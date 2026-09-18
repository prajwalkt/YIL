import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../../library/validation';
import { getUserFromRequest, requireRole } from '../../../../library/auth';
import { getConnection } from '../../../../library/db';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

// GET: Fetch student's assessment responses for grading
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const resultId = searchParams.get('resultId');
    if (!resultId) return NextResponse.json({ success: false, message: 'resultId is required' }, { status: 400 });

    const pool = await getConnection();

    const resultCheck = await pool.query(`
        SELECT ar.ResultID, ar.Score, ar.TotalMarks, ar.Percentage, ar.Passed,
               a.Title as AssessmentTitle, a.PassMarks, c.Title as CourseTitle,
               u.FirstName, u.LastName, u.UserID
        FROM AssessmentResults ar
        JOIN Assessments a ON ar.AssessmentID = a.AssessmentID
        JOIN LMS_Courses c ON a.CourseID = c.CourseID
        JOIN LMS_Users u ON ar.StudentID = u.UserID
        WHERE ar.ResultID = $1
      `, [Number(resultId)]);

    if (resultCheck.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Result not found' }, { status: 404 });
    }

    const responses = await pool.query(`
        SELECT r.ResponseID, r.Question as QuestionID, r.Answer, r.Marks as AwardedMarks,
               q.QuestionText, q.CorrectAnswer, q.Marks as MaxMarks
        FROM AssessmentResponses r
        JOIN AssessmentQuestions q ON r.Question = q.QuestionID
        WHERE r.ResultID = $1
      `, [Number(resultId)]);

    return NextResponse.json({
      success: true,
      result: resultCheck.recordset[0],
      responses: responses.recordset
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Submit evaluated marks and regenerate PDF
export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const body = await parseAndSanitizeBody(request);
    const { resultId, marksMap } = body; // marksMap: { [responseId]: newMarks }

    if (!resultId || !marksMap) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    const pool = await getConnection();
    
    // Validate result
    const resultCheck = await pool.query(`
        SELECT ar.AssessmentID, ar.StudentID, ar.TotalMarks, ar.Passed, ar.Score,
               a.Title as AssessmentTitle, a.PassMarks, c.Title as CourseTitle,
               u.FirstName, u.LastName
        FROM AssessmentResults ar
        JOIN Assessments a ON ar.AssessmentID = a.AssessmentID
        JOIN LMS_Courses c ON a.CourseID = c.CourseID
        JOIN LMS_Users u ON ar.StudentID = u.UserID
        WHERE ar.ResultID = $1
      `, [Number(resultId)]);

    if (resultCheck.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Result not found' }, { status: 404 });
    }

    const assessmentInfo = resultCheck.recordset[0];
    
    let totalScore = 0;
    
    // Update individual responses
    for (const [responseId, newMarks] of Object.entries(marksMap)) {
      const marks = Number(newMarks);
      totalScore += marks;
      await pool.query(`UPDATE AssessmentResponses SET Marks = $1 WHERE ResponseID = $2`, [marks, Number(responseId)]);
    }

    // Update overall result
    const totalMarks = assessmentInfo.TotalMarks;
    const passMarks = assessmentInfo.PassMarks;
    const percentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
    const passed = totalScore >= passMarks;

    await pool.query(`
        UPDATE AssessmentResults 
        SET Score = $1, Percentage = $2, Passed = $3 
        WHERE ResultID = $4
      `, [totalScore, percentage, passed ? 1 : 0, Number(resultId)]);

    // Regenerate PDF
    let pdfUrl = '';
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      page.drawText('Yokogawa Training Services', { x: 50, y: 800, size: 20, font: fontBold, color: rgb(0, 0.25, 0.6) });
      page.drawText('Evaluated Assessment Report', { x: 50, y: 770, size: 16, font });
      
      page.drawText(`Student: ${assessmentInfo.FirstName} ${assessmentInfo.LastName}`, { x: 50, y: 730, size: 12, font });
      page.drawText(`Course: ${assessmentInfo.CourseTitle}`, { x: 50, y: 710, size: 12, font });
      page.drawText(`Assessment: ${assessmentInfo.AssessmentTitle}`, { x: 50, y: 690, size: 12, font });
      page.drawText(`Evaluated By: ${user!.firstName} ${user!.lastName}`, { x: 50, y: 670, size: 12, font });
      page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y: 650, size: 12, font });

      page.drawText(`Status: ${passed ? 'PASSED' : 'FAILED'}`, { x: 50, y: 610, size: 16, font: fontBold, color: passed ? rgb(0, 0.6, 0) : rgb(0.8, 0, 0) });
      page.drawText(`Final Score: ${totalScore} / ${totalMarks} (${Math.round(percentage)}%)`, { x: 50, y: 580, size: 14, font: fontBold });
      page.drawText(`Pass Mark Required: ${passMarks}`, { x: 50, y: 560, size: 12, font });

      const pdfBytes = await pdfDoc.save();
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'reports');
      await fs.mkdir(uploadDir, { recursive: true });
      
      const fileName = `Assessment_Result_${assessmentInfo.StudentID}_${resultId}.pdf`;
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, pdfBytes);
      pdfUrl = `/uploads/reports/${fileName}`;
    } catch (pdfErr) {
      console.error('Failed to regenerate PDF:', pdfErr);
    }

    return NextResponse.json({ success: true, message: 'Evaluation saved and PDF regenerated.', pdfUrl, score: totalScore, passed });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
