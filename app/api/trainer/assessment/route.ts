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

    // Insert into Assessments
    const req = pool.request();
    req.input('RegistrationID', enr.RegistrationID);
    req.input('StudentID', enr.StudentID);
    req.input('TrainerID', user!.userId);
    req.input('CourseID', enr.CourseID);
    req.input('CalendarID', enr.CalendarID);
    req.input('OverallScore', totalScore);
    req.input('Remarks', remarks || '');
    req.input('Status', status || 'COMPLETED');

    const assessRes = await req.query(`
      INSERT INTO Assessments (RegistrationID, StudentID, TrainerID, CourseID, CalendarID, OverallScore, Remarks, Status)
      OUTPUT INSERTED.AssessmentID
      VALUES (@RegistrationID, @StudentID, @TrainerID, @CourseID, @CalendarID, @OverallScore, @Remarks, @Status)
    `);
    const assessmentId = assessRes.recordset[0].AssessmentID;

    // Insert Responses
    for (const question in marks) {
      await pool.request()
        .input('AssessmentID', assessmentId)
        .input('Question', question)
        .input('Marks', Number(marks[question]))
        .query(`INSERT INTO AssessmentResponses (AssessmentID, Question, Marks) VALUES (@AssessmentID, @Question, @Marks)`);
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
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'reports');
    await fs.mkdir(uploadDir, { recursive: true });
    
    const fileName = `Assessment_${enr.StudentID}_${assessmentId}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, pdfBytes);
    
    const pdfUrl = `/uploads/reports/${fileName}`;

    // Update PDF path in DB
    await pool.request().input('PDFPath', pdfUrl).input('AssessmentID', assessmentId).query(`
      UPDATE Assessments SET PDFPath = @PDFPath WHERE AssessmentID = @AssessmentID
    `);

    // Update Enrollment and Registration if COMPLETED
    if (status === 'COMPLETED' || status === 'PASSED') {
      await pool.request()
        .input('EnrollmentID', enr.EnrollmentID)
        .input('RegistrationID', enr.RegistrationID)
        .query(`
          UPDATE Enrollments SET Status = 'COMPLETED', ProgressPercent = 100 WHERE EnrollmentID = @EnrollmentID;
          UPDATE Registrations SET Status = 'COMPLETED' WHERE Id = @RegistrationID;
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
      attachments: [{ filename: fileName, path: filePath }]
    });

    return NextResponse.json({ success: true, message: 'Assessment saved and emailed to student', pdfUrl });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
