import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await parseAndSanitizeBody(request);
    const { regId, userId, name, email, course, trainingMode, date } = body;

    const templatePath = path.join(process.cwd(), 'private', 'templates', 'registration_template.pdf');
    let pdfBytes;

    try {
      // 1. Try to load the AcroForm template
      const templateBuffer = await fs.readFile(templatePath);
      const pdfDoc = await PDFDocument.load(templateBuffer);
      const form = pdfDoc.getForm();

      // Try to fill standard fields if they exist
      try { form.getTextField('Name')?.setText(name || ''); } catch (e) {}
      try { form.getTextField('Email')?.setText(email || ''); } catch (e) {}
      try { form.getTextField('Course')?.setText(course || ''); } catch (e) {}
      try { form.getTextField('TrainingMode')?.setText(trainingMode || ''); } catch (e) {}
      try { form.getTextField('Date')?.setText(date || new Date().toLocaleDateString()); } catch (e) {}
      try { form.getTextField('RegistrationID')?.setText(regId?.toString() || ''); } catch (e) {}

      form.flatten();
      pdfBytes = await pdfDoc.save();
    } catch (err) {
      // 2. Fallback to generic PDF generation if template is missing
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595, 842]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      page.drawText('Yokogawa Training Services', { x: 50, y: 800, size: 20, font: fontBold, color: rgb(0, 0.25, 0.6) });
      page.drawText('Registration Confirmation', { x: 50, y: 770, size: 16, font: fontBold });
      
      page.drawText(`Name: ${name}`, { x: 50, y: 730, size: 12, font });
      page.drawText(`Email: ${email}`, { x: 50, y: 710, size: 12, font });
      page.drawText(`Course: ${course}`, { x: 50, y: 690, size: 12, font });
      page.drawText(`Training Mode: ${trainingMode}`, { x: 50, y: 670, size: 12, font });
      page.drawText(`Date Approved: ${date || new Date().toLocaleDateString()}`, { x: 50, y: 650, size: 12, font });
      page.drawText(`Registration ID: ${regId}`, { x: 50, y: 630, size: 12, font });

      pdfBytes = await pdfDoc.save();
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'registrations');
    await fs.mkdir(uploadDir, { recursive: true });
    
    const fileName = `Registration_${userId}_${regId}.pdf`;
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, pdfBytes);

    return NextResponse.json({ success: true, pdfUrl: `/uploads/registrations/${fileName}` });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
