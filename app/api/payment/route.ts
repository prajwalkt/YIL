import { NextRequest, NextResponse } from "next/server";
import { parseAndSanitizeFormData } from "../../library/validation";
import { getConnection } from "../../library/db";
import { checkRateLimit, getClientIP, RateLimits } from "../../library/rateLimiter";
import { validateUploadedFile, generateSafeFilename, ALLOWED_MIME_TYPES } from "../../library/fileUpload";
import { sendEmail } from "../../library/email";
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const rateCheck = checkRateLimit({ ...RateLimits.REGISTER, identifier: ip });
  if (!rateCheck.allowed) {
    return NextResponse.json({
      success: false,
      message: `Too many payment attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
    }, { status: 429 });
  }

  try {
    const formData = await parseAndSanitizeFormData(request);
    
    const registrationId = formData.get("registrationId")?.toString();
    const transactionId = formData.get("transactionId")?.toString();
    const paymentProof = formData.get("paymentProof") as File | null;

    if (!registrationId || !transactionId || !paymentProof || paymentProof.size === 0) {
      return NextResponse.json({ success: false, message: "Missing required payment details." }, { status: 400 });
    }

    // Validate file
    const validation = await validateUploadedFile(paymentProof, {
      allowedMimeTypes: ALLOWED_MIME_TYPES.PAYMENT_PROOF,
      maxSizeBytes: 5 * 1024 * 1024,
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
    });

    if (!validation.valid) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
    }

    const buffer = Buffer.from(await paymentProof.arrayBuffer());
    const safeFilename = generateSafeFilename(paymentProof.name, 'payment_proof_' + registrationId);
    const uploadDir = path.join(process.cwd(), 'private', 'uploads', 'payments');
    
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    await fs.writeFile(path.join(uploadDir, safeFilename), buffer);
    const paymentProofPath = `/private/uploads/payments/${safeFilename}`;

    const pool = await getConnection();

    // Fetch Registration Details
    const regQuery = await pool.request()
      .input("Id", Number(registrationId))
      .query(`SELECT * FROM Registrations WHERE Id = @Id`);

    if (regQuery.recordset.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid Registration ID" }, { status: 404 });
    }
    const reg = regQuery.recordset[0];

    // Insert into PaymentTracking if schema supports it, but first try updating Registrations
    await pool.request()
      .input("Id", Number(registrationId))
      .input("PaymentProofPath", paymentProofPath)
      .input("Status", "PENDING")
      .query(`
        UPDATE Registrations 
        SET PaymentProofPath = @PaymentProofPath, Status = @Status
        WHERE Id = @Id
      `);

    try {
      await pool.request()
        .input("RegistrationID", Number(registrationId))
        .input("StudentName", reg.Name)
        .input("CourseName", reg.Course)
        .input("TransactionID", transactionId)
        .input("PaymentProofPath", paymentProofPath)
        .query(`
          INSERT INTO PaymentTracking (RegistrationID, StudentName, CourseName, TransactionID, PaymentProofPath, Status)
          VALUES (@RegistrationID, @StudentName, @CourseName, @TransactionID, @PaymentProofPath, 'PENDING')
        `);
    } catch (e) {
      console.warn("PaymentTracking insert failed (table might be missing), continuing with Registration update.", e);
    }

    // Send email to Finance
    try {
      const financeUsers = await pool.request().query(`SELECT Email FROM LMS_Users WHERE Role='FINANCE' AND IsActive=1`);
      for (const f of financeUsers.recordset) {
        await sendEmail({
          to: f.Email,
          subject: `New Payment Pending Finance Approval - ${reg.Name}`,
          html: `<p>A new payment has been submitted by ${reg.Name} for the course ${reg.Course}.<br/>Transaction ID: <strong>${transactionId}</strong><br/>Please review the payment proof and approve or reject.</p>`
        });
      }
    } catch(e) {}

    return NextResponse.json({
      success: true,
      message: "Payment submitted successfully. Pending Finance Approval.",
    });

  } catch (error: any) {
    console.error('Payment error:', error);
    return NextResponse.json({ success: false, message: 'Payment submission failed. Please try again.' }, { status: 500 });
  }
}