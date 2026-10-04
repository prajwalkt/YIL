import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const body = await parseAndSanitizeBody(request);
    const { enrollmentId, marks, remarks, status } = body;
    // marks is an object like { "Q1": 10, "Q2": 8 }

    const pool = await getConnection();
    
    // Get enrollment details
    const enrRes = await pool.request().input('EnrollmentID', Number(enrollmentId)).query(`
      SELECT e.*, u.FirstName, u.LastName, u.Email, c.Title as CourseTitle
      FROM Enrollments e
      JOIN LMS_Users u ON e.StudentID = u.UserID
      JOIN LMS_Courses c ON e.CourseID = c.CourseID
      WHERE e.EnrollmentID = @EnrollmentID
    `);
    
    if (enrRes.recordset.length === 0) return NextResponse.json({ success: false, message: 'Enrollment not found' }, { status: 404 });
    const enr = enrRes.recordset[0];

    // Calculate total score
    let totalScore = 0;
    for (const key in marks) {
      totalScore += Number(marks[key]) || 0;
    }

    // Check if VPFE assessment already exists
    const assessmentQuery = await pool.request()
      .input('CourseID', Number(enr.CourseID))
      .query(`SELECT AssessmentID, Title FROM Assessments WHERE CourseID = @CourseID AND Title LIKE '%VPFE%'`);
      
    let assessmentId = assessmentQuery.recordset[0]?.AssessmentID;
    
    if (!assessmentId) {
       const newAsses = await pool.request()
        .input('CourseID', Number(enr.CourseID))
        .query(`
          INSERT INTO Assessments (CourseID, Title, Description, TotalMarks, PassMarks, DurationMinutes, IsActive)
          OUTPUT INSERTED.AssessmentID
          VALUES (@CourseID, 'VPFE Assessment', 'Centum VP Fundamental and Engineering', 50, 25, 60, 1)
        `);
       assessmentId = newAsses.recordset[0].AssessmentID;
    }

    const percentage = totalScore * 2;
    const passed = totalScore >= 25 ? 1 : 0;

    // Insert or Update AssessmentResults
    const existing = await pool.request()
      .input('AssessmentID', assessmentId)
      .input('StudentID', enr.StudentID)
      .query(`SELECT ResultID FROM AssessmentResults WHERE AssessmentID = @AssessmentID AND StudentID = @StudentID`);
      
    if (existing.recordset.length > 0) {
      await pool.request()
        .input('ResultID', existing.recordset[0].ResultID)
        .input('Score', totalScore)
        .input('Percentage', percentage)
        .input('Passed', passed)
        .query(`
          UPDATE AssessmentResults 
          SET Score = @Score, Percentage = @Percentage, Passed = @Passed 
          WHERE ResultID = @ResultID
        `);
    } else {
      await pool.request()
        .input('AssessmentID', assessmentId)
        .input('StudentID', enr.StudentID)
        .input('Score', totalScore)
        .input('TotalMarks', 50)
        .input('Percentage', percentage)
        .input('Passed', passed)
        .query(`
          INSERT INTO AssessmentResults (AssessmentID, StudentID, Score, TotalMarks, Percentage, Passed, AttemptedAt)
          VALUES (@AssessmentID, @StudentID, @Score, @TotalMarks, @Percentage, @Passed, GETDATE())
        `);
    }

    // Generate PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText('Yokogawa Training Services', { x: 50, y: 800, size: 20, font: fontBold, color: rgb(0, 0.25, 0.6) });
    page.drawText('Official Assessment Report', { x: 50, y: 770, size: 16, font });
    
    page.drawText(`Student: ${enr.FirstName} ${enr.LastName}`, { x: 50, y: 730, size: 12, font });
    page.drawText(`Course: ${enr.CourseTitle}`, { x: 50, y: 710, size: 12, font });
    page.drawText(`Trainer: ${user!.firstName} ${user!.lastName}`, { x: 50, y: 690, size: 12, font });
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y: 670, size: 12, font });

    let yOffset = 630;
    page.drawText('Marks Breakdown:', { x: 50, y: yOffset, size: 14, font: fontBold });
    yOffset -= 30;

    for (const question in marks) {
      page.drawText(`${question}: ${marks[question]} / 10`, { x: 50, y: yOffset, size: 12, font });
      yOffset -= 25;
    }

    yOffset -= 20;
    page.drawText(`Overall Score: ${totalScore}`, { x: 50, y: yOffset, size: 14, font: fontBold });
    yOffset -= 30;
    page.drawText(`Remarks: ${remarks || 'None'}`, { x: 50, y: yOffset, size: 12, font });

    const pdfBytes = await pdfDoc.save();
    
    const fileName = `Assessment_${enr.StudentID}_${assessmentId}.pdf`;
    const r2Key = `reports/${fileName}`;
    const { uploadToSupabase } = await import('../../../library/supabaseStorage');
    await uploadToSupabase(r2Key, Buffer.from(pdfBytes), 'application/pdf');
    
    const pdfUrl = `/reports/${fileName}`;

    // Update Enrollment and Registration if COMPLETED
    if (status === 'COMPLETED' || status === 'PASSED') {
      await pool.request()
        .input('EnrollmentID', enr.EnrollmentID)
        .input('RegistrationID', enr.RegistrationID)
        .query(`
          UPDATE Enrollments SET Status = 'COMPLETED', ProgressPercent = 100 WHERE EnrollmentID = @EnrollmentID;
          UPDATE LMS_Registrations SET Status = 'COMPLETED' WHERE Id = @RegistrationID;
        `);
    }

    // Email to Student
    const { sendEmail } = await import('../../../library/email');
    await sendEmail({
      to: enr.Email,
      subject: `Your Assessment Report for ${enr.CourseTitle}`,
      html: `<p>Dear ${enr.FirstName},</p>
             <p>Your assessment for <strong>${enr.CourseTitle}</strong> has been graded by your trainer.</p>
             <p>Overall Score: ${totalScore}</p>
             <p>Status: ${status || 'COMPLETED'}</p>
             <p>Please find your official Assessment Report attached.</p>`,
      attachments: [{ filename: fileName, content: Buffer.from(pdfBytes) }]
    });

    return NextResponse.json({ success: true, message: 'Assessment saved and emailed to student', pdfUrl });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
