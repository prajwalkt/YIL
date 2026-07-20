import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';

// GET: Return assessments for the student's enrolled courses
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'STUDENT', 'AFFILIATE')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const pool = await getConnection();

    const assessments = await pool.request()
      .input('UserID', user!.userId)
      .query(`
        SELECT 
          a.AssessmentID, a.Title, a.Description, a.TotalMarks, a.PassMarks, a.DurationMinutes,
          c.Title as CourseTitle, c.CourseID,
          (SELECT COUNT(*) FROM AssessmentQuestions WHERE AssessmentID = a.AssessmentID) as QuestionCount,
          ar.Score, ar.Percentage, ar.Passed, ar.AttemptedAt, ar.ResultID
        FROM Assessments a
        JOIN LMS_Courses c ON a.CourseID = c.CourseID
        JOIN Enrollments e ON e.CourseID = a.CourseID AND e.StudentID = @UserID
        LEFT JOIN AssessmentResults ar ON ar.AssessmentID = a.AssessmentID AND ar.StudentID = @UserID
        WHERE a.IsActive = 1
          AND e.Status IN ('ENROLLED', 'IN_PROGRESS', 'COMPLETED')
        ORDER BY a.CreatedAt DESC
      `);

    return NextResponse.json({ success: true, assessments: assessments.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

// GET with assessmentId: Return questions for taking the assessment
export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'STUDENT', 'AFFILIATE')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, assessmentId, answers } = body;
    const pool = await getConnection();

    // ── Get Questions ──
    if (action === 'GET_QUESTIONS') {
      const questions = await pool.request()
        .input('AssessmentID', Number(assessmentId))
        .query(`
          SELECT QuestionID, QuestionText, OptionA, OptionB, OptionC, OptionD
          FROM AssessmentQuestions
          WHERE AssessmentID = @AssessmentID
          ORDER BY QuestionID
        `);
      return NextResponse.json({ success: true, questions: questions.recordset });
    }

    // ── Submit Answers ──
    if (action === 'SUBMIT') {
      // Check not already attempted
      const existing = await pool.request()
        .input('AssessmentID', Number(assessmentId))
        .input('StudentID', user!.userId)
        .query(`SELECT * FROM AssessmentResults WHERE AssessmentID = @AssessmentID AND StudentID = @StudentID`);
      if (existing.recordset.length > 0) {
        return NextResponse.json({ success: false, message: 'You have already submitted this assessment.' }, { status: 400 });
      }

      // Fetch correct answers
      const questions = await pool.request()
        .input('AssessmentID', Number(assessmentId))
        .query(`SELECT QuestionID, CorrectAnswer, Marks FROM AssessmentQuestions WHERE AssessmentID = @AssessmentID`);

      // Fetch assessment details
      const assessment = await pool.request()
        .input('AssessmentID', Number(assessmentId))
        .query(`SELECT TotalMarks, PassMarks FROM Assessments WHERE AssessmentID = @AssessmentID`);
      
      if (!assessment.recordset.length) {
        return NextResponse.json({ success: false, message: 'Assessment not found.' }, { status: 404 });
      }

      const totalMarks = assessment.recordset[0].TotalMarks;
      const passMarks = assessment.recordset[0].PassMarks;

      // Score calculation
      let score = 0;
      for (const q of questions.recordset) {
        const studentAnswer = answers?.[q.QuestionID];
        if (studentAnswer && studentAnswer === q.CorrectAnswer) {
          score += (q.Marks || 1);
        }
      }

      const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
      const passed = score >= passMarks;

      await pool.request()
        .input('AssessmentID', Number(assessmentId))
        .input('StudentID', user!.userId)
        .input('Score', score)
        .input('TotalMarks', totalMarks)
        .input('Percentage', percentage)
        .input('Passed', passed ? 1 : 0)
        .query(`
          INSERT INTO AssessmentResults (AssessmentID, StudentID, Score, TotalMarks, Percentage, Passed, AttemptedAt)
          VALUES (@AssessmentID, @StudentID, @Score, @TotalMarks, @Percentage, @Passed, GETDATE())
        `);

      return NextResponse.json({
        success: true,
        score,
        totalMarks,
        percentage: Math.round(percentage),
        passed,
        message: passed ? `✅ Passed! Score: ${score}/${totalMarks} (${Math.round(percentage)}%)` : `❌ Failed. Score: ${score}/${totalMarks} (${Math.round(percentage)}%). Pass mark: ${passMarks}`
      });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
