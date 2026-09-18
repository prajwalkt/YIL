import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

// GET: Return assessments for the student's enrolled courses
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'STUDENT')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const pool = await getConnection();

    const assessments = await pool.query(`
        SELECT 
          a.AssessmentID, a.Title, a.Description, a.TotalMarks, a.PassMarks, a.DurationMinutes,
          c.Title as CourseTitle, c.CourseID,
          (SELECT COUNT(*) FROM AssessmentQuestions WHERE AssessmentID = a.AssessmentID) as QuestionCount,
          ar.Score, ar.Percentage, ar.Passed, ar.AttemptedAt, ar.ResultID
        FROM Assessments a
        JOIN LMS_Courses c ON a.CourseID = c.CourseID
        JOIN Enrollments e ON e.CourseID = a.CourseID AND e.StudentID = $1
        LEFT JOIN TrainingCalendar tc ON e.CalendarID = tc.CalendarID
        LEFT JOIN AssessmentResults ar ON ar.AssessmentID = a.AssessmentID AND ar.StudentID = $2
        WHERE a.IsActive = 1
          AND e.Status IN ('ENROLLED', 'IN_PROGRESS', 'COMPLETED')
          AND CAST(CURRENT_TIMESTAMP AS DATE) >= CAST(tc.EndDate AS DATE)
        ORDER BY a.CreatedAt DESC
      `, [user!.userId, user!.userId]);

    return NextResponse.json({ success: true, assessments: assessments.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

// GET with assessmentId: Return questions for taking the assessment
export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'STUDENT')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const body = await parseAndSanitizeBody(request);
    const { action, assessmentId, answers } = body;
    const pool = await getConnection();

    // ── Get Questions ──
    if (action === 'GET_QUESTIONS') {
      const questions = await pool.query(`
          SELECT QuestionID, QuestionText, OptionA, OptionB, OptionC, OptionD
          FROM AssessmentQuestions
          WHERE AssessmentID = $1
          ORDER BY QuestionID
        `, [Number(assessmentId)]);
      return NextResponse.json({ success: true, questions: questions.recordset });
    }

    // ── Submit Answers ──
    if (action === 'SUBMIT') {
      // Check not already attempted
      const existing = await pool.query(`SELECT * FROM AssessmentResults WHERE AssessmentID = $1 AND StudentID = $2`, [Number(assessmentId), user!.userId]);
      if (existing.recordset.length > 0) {
        return NextResponse.json({ success: false, message: 'You have already submitted this assessment.' }, { status: 400 });
      }

      // Fetch correct answers
      const questions = await pool.query(`SELECT QuestionID, CorrectAnswer, Marks FROM AssessmentQuestions WHERE AssessmentID = $1`, [Number(assessmentId)]);

      // Fetch assessment details
      const assessment = await pool.query(`
          SELECT a.TotalMarks, a.PassMarks, a.Title, c.Title as CourseTitle
          FROM Assessments a
          JOIN LMS_Courses c ON a.CourseID = c.CourseID
          WHERE a.AssessmentID = $1
        `, [Number(assessmentId)]);
      
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

      const insertResult = await pool.query(`
          INSERT INTO AssessmentResults (AssessmentID, StudentID, Score, TotalMarks, Percentage, Passed, AttemptedAt)
          VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          RETURNING ResultID
        `, [Number(assessmentId), user!.userId, score, totalMarks, percentage, passed ? 1 : 0]);

      const resultId = insertResult.recordset[0].ResultID;

      // Save individual responses
      for (const q of questions.recordset) {
        const studentAnswer = answers?.[q.QuestionID] || '';
        const mark = (studentAnswer === q.CorrectAnswer) ? (q.Marks || 1) : 0;
        await pool.query(`
            INSERT INTO AssessmentResponses (AssessmentID, ResultID, Question, Answer, Marks)
            VALUES ($1, $2, $3, $4, $5)
          `, [Number(assessmentId), resultId, q.QuestionID.toString(), studentAnswer, mark]);
      }

      let pdfUrl = '';
      try {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        page.drawText('Yokogawa Training Services', { x: 50, y: 800, size: 20, font: fontBold, color: rgb(0, 0.25, 0.6) });
        page.drawText('E-Learning Assessment Report', { x: 50, y: 770, size: 16, font });
        
        page.drawText(`Student: ${user!.firstName} ${user!.lastName}`, { x: 50, y: 730, size: 12, font });
        page.drawText(`Course: ${assessment.recordset[0].CourseTitle}`, { x: 50, y: 710, size: 12, font });
        page.drawText(`Assessment: ${assessment.recordset[0].Title}`, { x: 50, y: 690, size: 12, font });
        page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y: 670, size: 12, font });

        page.drawText(`Status: ${passed ? 'PASSED' : 'FAILED'}`, { x: 50, y: 630, size: 16, font: fontBold, color: passed ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0) });
        page.drawText(`Score: ${score} / ${totalMarks} (${Math.round(percentage)}%)`, { x: 50, y: 600, size: 14, font: fontBold });
        page.drawText(`Pass Mark Required: ${passMarks}`, { x: 50, y: 580, size: 12, font });

        const pdfBytes = await pdfDoc.save();
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'reports');
        await fs.mkdir(uploadDir, { recursive: true });
        
        const fileName = `Assessment_Result_${user!.userId}_${resultId}.pdf`;
        const filePath = path.join(uploadDir, fileName);
        await fs.writeFile(filePath, pdfBytes);
        pdfUrl = `/uploads/reports/${fileName}`;
      } catch (pdfErr) {
        console.error('Failed to generate PDF:', pdfErr);
      }

      return NextResponse.json({
        success: true,
        score,
        totalMarks,
        percentage: Math.round(percentage),
        passed,
        pdfUrl,
        message: passed ? `✅ Passed! Score: ${score}/${totalMarks} (${Math.round(percentage)}%)` : `❌ Failed. Score: ${score}/${totalMarks} (${Math.round(percentage)}%). Pass mark: ${passMarks}`
      });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
