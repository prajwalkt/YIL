import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

// GET: Return pending feedback forms for enrolled courses
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'STUDENT', 'AFFILIATE')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const pool = await getConnection();

    // Get enrolled courses
    const enrolled = await pool.request()
      .input('StudentID', user!.userId)
      .input('UserRole', user!.role)
      .query(`
        SELECT e.CourseID, c.Title as CourseTitle, e.EnrollmentID,
               u.FirstName + ' ' + u.LastName as TrainerName, u.UserID as TrainerID,
               tc.StartDate, tc.EndDate
        FROM Enrollments e
        JOIN LMS_Courses c ON c.CourseID = e.CourseID
        LEFT JOIN TrainingCalendar tc ON tc.CalendarID = e.CalendarID
        LEFT JOIN LMS_Users u ON u.UserID = tc.TrainerID
        WHERE e.StudentID = @StudentID
          AND e.Status IN ('ENROLLED', 'IN_PROGRESS', 'COMPLETED')
          AND CAST(GETDATE() AS DATE) >= CAST(tc.EndDate AS DATE)
          AND (
            @UserRole = 'AFFILIATE'
            OR
            NOT EXISTS (SELECT 1 FROM Assessments a WHERE a.CourseID = e.CourseID AND a.IsActive = 1)
            OR
            EXISTS (SELECT 1 FROM AssessmentResults ar JOIN Assessments a2 ON ar.AssessmentID = a2.AssessmentID WHERE a2.CourseID = e.CourseID AND ar.StudentID = e.StudentID)
          )
      `);

    // Check which courses already have feedback
    const submitted = await pool.request()
      .input('StudentID', user!.userId)
      .query(`SELECT CourseID FROM Feedback WHERE StudentID = @StudentID`);

    const submittedCourseIds = new Set(submitted.recordset.map((r: any) => r.CourseID));

    const pendingFeedback = enrolled.recordset.filter((e: any) => !submittedCourseIds.has(e.CourseID));
    const completedFeedback = enrolled.recordset.filter((e: any) => submittedCourseIds.has(e.CourseID));

    return NextResponse.json({
      success: true,
      pending: pendingFeedback,
      submitted: completedFeedback,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Submit feedback for a course
export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'STUDENT', 'AFFILIATE')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const body = await parseAndSanitizeBody(request);
    const { courseId, courseName, trainerId, trainerName, overallScore, contentScore, trainerScore, facilityScore, remarks, trainingDate } = body;

    if (!courseId || !overallScore) {
      return NextResponse.json({ success: false, message: 'Course and overall score are required' }, { status: 400 });
    }

    const pool = await getConnection();

    // Check if feedback already submitted
    const existing = await pool.request()
      .input('StudentID', user!.userId)
      .input('CourseID', Number(courseId))
      .query(`SELECT * FROM Feedback WHERE StudentID = @StudentID AND CourseID = @CourseID`);

    if (existing.recordset.length > 0) {
      return NextResponse.json({ success: false, message: 'You have already submitted feedback for this course.' }, { status: 400 });
    }

    // Get student info
    const studentInfo = await pool.request()
      .input('UserID', user!.userId)
      .query(`SELECT FirstName + ' ' + LastName as FullName FROM LMS_Users WHERE UserID = @UserID`);

    const participantName = studentInfo.recordset[0]?.FullName || user!.email;

    const insertResult = await pool.request()
      .input('StudentID', user!.userId)
      .input('ParticipantName', participantName)
      .input('CourseID', Number(courseId))
      .input('CourseName', courseName || '')
      .input('TrainerID', trainerId || null)
      .input('TrainerName', trainerName || '')
      .input('OverallScore', Number(overallScore))
      .input('ContentScore', Number(contentScore) || Number(overallScore))
      .input('TrainerScore', Number(trainerScore) || Number(overallScore))
      .input('FacilityScore', Number(facilityScore) || Number(overallScore))
      .input('Remarks', remarks || '')
      .input('TrainingDate', trainingDate || null)
      .query(`
        INSERT INTO Feedback (StudentID, ParticipantName, CourseID, CourseName, TrainerID, TrainerName, OverallScore, ContentScore, TrainerScore, FacilityScore, Remarks, TrainingDate, SubmittedAt)
        OUTPUT INSERTED.FeedbackID
        VALUES (@StudentID, @ParticipantName, @CourseID, @CourseName, @TrainerID, @TrainerName, @OverallScore, @ContentScore, @TrainerScore, @FacilityScore, @Remarks, @TrainingDate, GETDATE())
      `);

    const feedbackId = insertResult.recordset[0].FeedbackID;

    // Generate PDF Report
    let pdfUrl = '';
    try {
      const templatePath = path.join(process.cwd(), 'private', 'templates', 'feedback_template.pdf');
      let pdfBytes;

      try {
        const templateBuffer = await fs.readFile(templatePath);
        const pdfDoc = await PDFDocument.load(templateBuffer);
        const form = pdfDoc.getForm();

        try { form.getTextField('ParticipantName')?.setText(participantName || ''); } catch (e) {}
        try { form.getTextField('CourseName')?.setText(courseName || ''); } catch (e) {}
        try { form.getTextField('TrainerName')?.setText(trainerName || ''); } catch (e) {}
        try { form.getTextField('Date')?.setText(new Date().toLocaleDateString()); } catch (e) {}
        try { form.getTextField('OverallScore')?.setText(overallScore?.toString() || ''); } catch (e) {}
        try { form.getTextField('ContentScore')?.setText(contentScore?.toString() || ''); } catch (e) {}
        try { form.getTextField('TrainerScore')?.setText(trainerScore?.toString() || ''); } catch (e) {}
        try { form.getTextField('FacilityScore')?.setText(facilityScore?.toString() || ''); } catch (e) {}
        try { form.getTextField('Remarks')?.setText(remarks || ''); } catch (e) {}

        form.flatten();
        pdfBytes = await pdfDoc.save();
      } catch (err) {
        // Fallback to generic PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        page.drawText('Yokogawa Training Services', { x: 50, y: 800, size: 20, font: fontBold, color: rgb(0, 0.25, 0.6) });
        page.drawText('Course Feedback Report', { x: 50, y: 770, size: 16, font });
        
        page.drawText(`Participant: ${participantName}`, { x: 50, y: 730, size: 12, font });
        page.drawText(`Course: ${courseName || 'Unknown Course'}`, { x: 50, y: 710, size: 12, font });
        page.drawText(`Trainer: ${trainerName || 'N/A'}`, { x: 50, y: 690, size: 12, font });
        page.drawText(`Date Submitted: ${new Date().toLocaleDateString()}`, { x: 50, y: 670, size: 12, font });

        page.drawText('Scores:', { x: 50, y: 630, size: 14, font: fontBold });
        page.drawText(`Overall Satisfaction: ${overallScore} / 5`, { x: 50, y: 600, size: 12, font });
        page.drawText(`Course Content: ${contentScore} / 5`, { x: 50, y: 580, size: 12, font });
        page.drawText(`Trainer Performance: ${trainerScore} / 5`, { x: 50, y: 560, size: 12, font });
        page.drawText(`Facilities / Platform: ${facilityScore} / 5`, { x: 50, y: 540, size: 12, font });

        page.drawText('Remarks / Comments:', { x: 50, y: 500, size: 14, font: fontBold });
        
        const remarksText = remarks || 'No remarks provided.';
        const words = remarksText.split(' ');
        let line = '';
        let yOffset = 470;
        for (let i = 0; i < words.length; i++) {
          if (line.length + words[i].length > 80) {
            page.drawText(line, { x: 50, y: yOffset, size: 12, font });
            line = '';
            yOffset -= 20;
          }
          line += words[i] + ' ';
        }
        page.drawText(line, { x: 50, y: yOffset, size: 12, font });

        pdfBytes = await pdfDoc.save();
      }

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'reports');
      await fs.mkdir(uploadDir, { recursive: true });
      
      const fileName = `Feedback_${user!.userId}_${feedbackId}.pdf`;
      const filePath = path.join(uploadDir, fileName);
      await fs.writeFile(filePath, pdfBytes);
      pdfUrl = `/uploads/reports/${fileName}`;
      // Dispatch Feedback PDF to TM/Admin
      const tmAdmins = await pool.request().query(`SELECT Email FROM LMS_Users WHERE Role IN ('TM', 'ADMIN') AND IsActive = 1`);
      const { sendEmail } = await import('../../../library/email');
      
      for (const admin of tmAdmins.recordset) {
        await sendEmail({
          to: admin.Email,
          subject: `New Course Feedback Submitted — ${courseName}`,
          html: `<p>A new feedback report has been submitted by <strong>${participantName}</strong> for the course <strong>${courseName}</strong>.</p>
                 <ul>
                   <li>Overall Score: ${overallScore}/5</li>
                   <li>Trainer Score: ${trainerScore}/5</li>
                 </ul>
                 <p>Please find the detailed Feedback Report attached.</p>`,
          attachments: [{ filename: fileName, path: filePath }]
        });
      }
    } catch (pdfErr) {
      console.error('Failed to generate PDF:', pdfErr);
    }

    return NextResponse.json({ success: true, message: 'Feedback submitted successfully', pdfUrl });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
