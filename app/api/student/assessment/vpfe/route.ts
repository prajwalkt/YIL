import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../../library/validation';
import { getUserFromRequest, requireRole } from '../../../../library/auth';
import { getConnection } from '../../../../library/db';

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'STUDENT')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const body = await parseAndSanitizeBody(request);
    const { courseId, answers } = body;
    const pool = await getConnection();

    // Check if VPFE assessment already exists
    const assessmentQuery = await pool.request()
      .input('CourseID', Number(courseId))
      .query(`SELECT AssessmentID, Title FROM Assessments WHERE CourseID = @CourseID AND Title LIKE '%VPFE%'`);
      
    let assessmentId = assessmentQuery.recordset[0]?.AssessmentID;
    
    // Auto-create assessment if not exists for the course
    if (!assessmentId) {
       const newAsses = await pool.request()
        .input('CourseID', Number(courseId))
        .query(`
          INSERT INTO Assessments (CourseID, Title, Description, TotalMarks, PassMarks, DurationMinutes, IsActive)
          OUTPUT INSERTED.AssessmentID
          VALUES (@CourseID, 'VPFE Assessment', 'Centum VP Fundamental and Engineering', 50, 25, 60, 1)
        `);
       assessmentId = newAsses.recordset[0].AssessmentID;
    }

    // Check if already attempted
    const existing = await pool.request()
      .input('AssessmentID', assessmentId)
      .input('StudentID', user!.userId)
      .query(`SELECT * FROM AssessmentResults WHERE AssessmentID = @AssessmentID AND StudentID = @StudentID`);
    
    if (existing.recordset.length > 0) {
      return NextResponse.json({ success: false, message: 'You have already submitted this assessment.' }, { status: 400 });
    }

    // Basic scoring algorithm (simulated)
    // In a real app we'd compare against correct strings. 
    // For this demonstration, we'll give partial/full marks randomly if the field is filled.
    let scoreBase = 0;
    let totalBase = 29;

    const answerKeys = Object.keys(answers);
    for (const k of answerKeys) {
      if (answers[k] && answers[k].trim() !== '') {
        // Just giving some points for non-empty string in demo.
        scoreBase += 1.5; 
      }
    }
    scoreBase = Math.min(scoreBase, 29); // Max 29
    
    // Scale to 50 marks
    const score = Math.round((scoreBase / totalBase) * 50);
    const percentage = score * 2; // Since total is 50
    const passed = score >= 25; // pass marks 25

    const insertResult = await pool.request()
      .input('AssessmentID', assessmentId)
      .input('StudentID', user!.userId)
      .input('Score', score)
      .input('TotalMarks', 50)
      .input('Percentage', percentage)
      .input('Passed', passed ? 1 : 0)
      .query(`
        INSERT INTO AssessmentResults (AssessmentID, StudentID, Score, TotalMarks, Percentage, Passed, AttemptedAt)
        OUTPUT INSERTED.ResultID
        VALUES (@AssessmentID, @StudentID, @Score, @TotalMarks, @Percentage, @Passed, GETDATE())
      `);

    return NextResponse.json({
      success: true,
      score,
      totalMarks: 50,
      percentage,
      passed,
      message: 'Assessment submitted successfully'
    });

  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
