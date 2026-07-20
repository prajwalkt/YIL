import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "../../library/db";
import { sendEmail } from "../../library/email";
import { sanitizeInput } from "../../library/auth";
import { checkRateLimit, getClientIP, RateLimits } from "../../library/rateLimiter";
import { validateUploadedFile, generateSafeFilename, ALLOWED_MIME_TYPES } from "../../library/fileUpload";
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  // Rate limit: 5 registrations per hour per IP
  const ip = getClientIP(request);
  const rateCheck = checkRateLimit({ ...RateLimits.REGISTER, identifier: ip });
  if (!rateCheck.allowed) {
    return NextResponse.json({
      success: false,
      message: `Too many registration attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
    }, { status: 429 });
  }

  try {
    const formData = await request.formData();

    const name = sanitizeInput(formData.get("name")?.toString() || "");
    const email = formData.get("email")?.toString().trim().toLowerCase() || "";
    const phone = sanitizeInput(formData.get("phone")?.toString() || "");
    const organization = sanitizeInput(formData.get("organization")?.toString() || "");
    const country = sanitizeInput(formData.get("country")?.toString() || "");
    const graduationYear = sanitizeInput(formData.get("graduationYear")?.toString() || "");
    const course = sanitizeInput(formData.get("course")?.toString() || "");
    const trainingMode = sanitizeInput(formData.get("trainingMode")?.toString() || "");
    const sponsor = sanitizeInput(formData.get("sponsor")?.toString() || "");
    const instructions = sanitizeInput(formData.get("instructions")?.toString() || "");
    // RegistrationType: explicitly sent by the form; fallback derives from sponsor field
    const registrationTypeRaw = formData.get("registrationType")?.toString() || "";
    const registrationType = (registrationTypeRaw === 'ORGANIZATION' || sponsor?.toLowerCase() === 'organization')
      ? 'ORGANIZATION'
      : 'SELF';
    let paymentProofPath = "";

    const pool = await getConnection();

    const result = await pool
      .request()
      .input("Name", name)
      .input("Email", email)
      .input("Phone", phone)
      .input("Organization", organization)
      .input("Country", country)
      .input("GraduationYear", graduationYear)
      .input("Course", course)
      .input("TrainingMode", trainingMode)
      .input("SponsoredBy", sponsor)
      .input("SpecialInstructions", instructions)
      .input("PaymentProofPath", paymentProofPath)
      .input("RegistrationType", registrationType)
      .input("Status", "WAITING_PAYMENT")
      .query(`
        INSERT INTO Registrations
        (
            Name, Email, Phone, Organization, Country, GraduationYear,
            Course, TrainingMode, SponsoredBy, SpecialInstructions, PaymentProofPath, RegistrationType, Status
        )
        OUTPUT INSERTED.Id
        VALUES
        (
            @Name, @Email, @Phone, @Organization, @Country, @GraduationYear,
            @Course, @TrainingMode, @SponsoredBy, @SpecialInstructions, @PaymentProofPath, @RegistrationType, @Status
        )
      `);

    const newRegId = result.recordset[0]?.Id;

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please proceed to payment.",
      registrationId: newRegId
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, message: 'Registration failed. Please try again.' }, { status: 500 });
  }
}