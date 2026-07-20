import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const body = await request.json();
    const { enrollmentId, ratings, comments, status } = body;
    // ratings = { "Content": 5, "Delivery": 4 }

    const pool = await getConnection();
    
    // Get enrollment details
    const enrRes = await pool.request().input('EnrollmentID', Number(enrollmentId)).query(`
      SELECT e.*, u.FirstName, u.LastName, c.Title as CourseTitle
      FROM Enrollments e
      JOIN LMS_Users u ON e.StudentID = u.UserID
      JOIN LMS_Courses c ON e.CourseID = c.CourseID
      WHERE e.EnrollmentID = @EnrollmentID
    `);
    
    if (enrRes.recordset.length === 0) return NextResponse.json({ success: false, message: 'Enrollment not found' }, { status: 404 });
    const enr = enrRes.recordset[0];

    // Calculate overall rating
    let totalRating = 0;
    let count = 0;
    for (const key in ratings) {
      totalRating += Number(ratings[key]) || 0;
      count++;
    }
    const overallRating = count > 0 ? (totalRating / count) : 0;

    // Insert into Feedback
    const req = pool.request();
    req.input('RegistrationID', enr.RegistrationID);
    req.input('StudentID', enr.StudentID);
    req.input('TrainerID', user!.userId);
    req.input('CourseID', enr.CourseID);
    req.input('CalendarID', enr.CalendarID);
    req.input('OverallRating', overallRating);
    req.input('Comments', comments || '');
    req.input('Status', status || 'COMPLETED');

    const feedRes = await req.query(`
      INSERT INTO Feedback (RegistrationID, StudentID, TrainerID, CourseID, CalendarID, OverallRating, Comments, Status)
      OUTPUT INSERTED.FeedbackID
      VALUES (@RegistrationID, @StudentID, @TrainerID, @CourseID, @CalendarID, @OverallRating, @Comments, @Status)
    `);
    const feedbackId = feedRes.recordset[0].FeedbackID;

    // Insert Responses
    for (const question in ratings) {
      await pool.request()
        .input('FeedbackID', feedbackId)
        .input('Question', question)
        .input('Rating', Number(ratings[question]))
        .query(`INSERT INTO FeedbackResponses (FeedbackID, Question, Rating) VALUES (@FeedbackID, @Question, @Rating)`);
    }

    // Generate PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText('Yokogawa Training Services', { x: 50, y: 800, size: 20, font: fontBold, color: rgb(0, 0.4, 0.2) });
    page.drawText('Official Feedback Report', { x: 50, y: 770, size: 16, font });
    
    page.drawText(`Student: ${enr.FirstName} ${enr.LastName}`, { x: 50, y: 730, size: 12, font });
    page.drawText(`Course: ${enr.CourseTitle}`, { x: 50, y: 710, size: 12, font });
    page.drawText(`Trainer: ${user!.firstName} ${user!.lastName}`, { x: 50, y: 690, size: 12, font });
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, { x: 50, y: 670, size: 12, font });

    let yOffset = 630;
    page.drawText('Ratings Breakdown:', { x: 50, y: yOffset, size: 14, font: fontBold });
    yOffset -= 30;

    for (const question in ratings) {
      page.drawText(`${question}: ${ratings[question]} / 5`, { x: 50, y: yOffset, size: 12, font });
      yOffset -= 25;
    }

    yOffset -= 20;
    page.drawText(`Overall Rating: ${overallRating.toFixed(1)} / 5`, { x: 50, y: yOffset, size: 14, font: fontBold });
    yOffset -= 30;
    page.drawText(`Comments: ${comments || 'None'}`, { x: 50, y: yOffset, size: 12, font });

    const pdfBytes = await pdfDoc.save();
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'reports');
    await fs.mkdir(uploadDir, { recursive: true });
    
    const fileName = `Feedback_${enr.StudentID}_${feedbackId}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, pdfBytes);
    
    const pdfUrl = `/uploads/reports/${fileName}`;

    // Update PDF path in DB
    await pool.request().input('PDFPath', pdfUrl).input('FeedbackID', feedbackId).query(`
      UPDATE Feedback SET PDFPath = @PDFPath WHERE FeedbackID = @FeedbackID
    `);

    return NextResponse.json({ success: true, message: 'Feedback saved', pdfUrl });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
