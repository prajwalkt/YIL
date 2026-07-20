import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const certId = searchParams.get('id');
    
    if (!certId) return new NextResponse('Certificate ID required', { status: 400 });

    const pool = await getConnection();
    const result = await pool.request()
      .input('CertificateID', Number(certId))
      .query(`SELECT * FROM Certificates WHERE CertificateID = @CertificateID`);
    
    if (result.recordset.length === 0) {
      return new NextResponse('Certificate not found', { status: 404 });
    }

    const cert = result.recordset[0];

    // Access control: Only the owner, ADMIN, or TM can download it
    if (user.role !== 'ADMIN' && user.role !== 'TM' && cert.StudentID !== user.userId) {
       return new NextResponse('Access denied', { status: 403 });
    }

    // Generate PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape
    const { width, height } = page.getSize();

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Draw Border
    page.drawRectangle({
      x: 20, y: 20, width: width - 40, height: height - 40,
      borderColor: rgb(0, 0.25, 0.6), borderWidth: 5,
    });

    // Draw Inner Border
    page.drawRectangle({
      x: 30, y: 30, width: width - 60, height: height - 60,
      borderColor: rgb(0.9, 0.6, 0.1), borderWidth: 2,
    });

    // Header text
    page.drawText('YOKOGAWA', {
      x: width / 2 - 90, y: height - 100,
      size: 32, font: helveticaBold, color: rgb(0, 0.25, 0.6)
    });

    page.drawText('CERTIFICATE OF COMPLETION', {
      x: width / 2 - 200, y: height - 160,
      size: 28, font: helveticaBold, color: rgb(0.2, 0.2, 0.2)
    });

    page.drawText('This is to certify that', {
      x: width / 2 - 80, y: height - 220,
      size: 16, font: helvetica, color: rgb(0.4, 0.4, 0.4)
    });

    // Participant Name
    const nameWidth = helveticaBold.widthOfTextAtSize(cert.ParticipantName, 36);
    page.drawText(cert.ParticipantName, {
      x: width / 2 - nameWidth / 2, y: height - 280,
      size: 36, font: helveticaBold, color: rgb(0, 0.25, 0.6)
    });

    page.drawText('has successfully completed the training course', {
      x: width / 2 - 150, y: height - 340,
      size: 16, font: helvetica, color: rgb(0.4, 0.4, 0.4)
    });

    // Course Name
    const courseWidth = helveticaBold.widthOfTextAtSize(cert.CourseName, 24);
    page.drawText(cert.CourseName, {
      x: width / 2 - courseWidth / 2, y: height - 390,
      size: 24, font: helveticaBold, color: rgb(0.2, 0.2, 0.2)
    });

    // Footer details
    page.drawText(`Date of Issue: ${new Date(cert.IssueDate).toLocaleDateString()}`, {
      x: 100, y: 100, size: 14, font: helvetica
    });

    page.drawText(`Certificate No: ${cert.CertificateNo}`, {
      x: 100, y: 70, size: 14, font: helveticaBold
    });

    page.drawText(`Instructor: ${cert.TrainerName || 'YTS Authorized Trainer'}`, {
      x: width - 350, y: 100, size: 14, font: helvetica
    });

    // Signature line
    page.drawLine({
      start: { x: width - 350, y: 120 }, end: { x: width - 100, y: 120 },
      thickness: 1, color: rgb(0, 0, 0)
    });

    // Verification URL & QR Code
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${cert.VerificationHash}`;
    
    try {
      const qrResponse = await fetch(`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyUrl)}`);
      const qrBuffer = await qrResponse.arrayBuffer();
      const qrImage = await pdfDoc.embedPng(qrBuffer);
      
      page.drawImage(qrImage, {
        x: width - 150,
        y: height - 150,
        width: 100,
        height: 100,
      });

      page.drawText('Scan to Verify', {
        x: width - 140,
        y: height - 165,
        size: 10,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4)
      });
    } catch (e) {
      console.error('QR Code generation failed', e);
    }

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${cert.CertificateNo}.pdf"`
      }
    });

  } catch (e: any) {
    console.error('PDF Generation Error:', e);
    return new NextResponse('Error generating PDF', { status: 500 });
  }
}
