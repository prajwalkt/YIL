export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "../../library/db";
import { checkRateLimit, getClientIP, RateLimits } from "../../library/rateLimiter";
import { parseAndSanitizeFormData } from "../../library/validation";

export async function GET() {
  try {
    const pool = await getConnection();
    const result = await pool.query(`
      SELECT 
        CourseID as id,
        Title as name, 
        Code as code, 
        COALESCE(DurationDays, 3) as days, 
        COALESCE(AgendaPDFPath, '#') as agendaPath 
      FROM LMS_Courses 
      WHERE Status = 'ACTIVE' 
      ORDER BY Title ASC
    `);
    const courses = result.recordset;
    return NextResponse.json({ success: true, courses });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const rateCheck = checkRateLimit({ ...RateLimits.REGISTER, identifier: ip });
  if (!rateCheck.allowed) {
    return NextResponse.json({
      success: false,
      message: `Too many registration attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
    }, { status: 429 });
  }

  try {
    const formData = await parseAndSanitizeFormData(request);

    // Validate and sanitize incoming fields
    const name = (formData.get("name")?.toString() || "").trim();
    const email = formData.get("email")?.toString().trim().toLowerCase() || "";
    const phone = (formData.get("phone")?.toString() || "").trim();
    const organization = (formData.get("organization")?.toString() || "").trim();
    const country = (formData.get("country")?.toString() || "").trim();
    const graduationYearStr = (formData.get("graduationYear")?.toString() || "").trim();
    const course = (formData.get("course")?.toString() || "").trim();
    const trainingMode = (formData.get("trainingMode")?.toString() || "").trim();
    const sponsor = (formData.get("sponsor")?.toString() || "").trim();
    const instructions = (formData.get("instructions")?.toString() || "").trim();
    const preferredStartDateStr = (formData.get("preferredStartDate")?.toString() || "").trim();
    const preferredEndDateStr = (formData.get("preferredEndDate")?.toString() || "").trim();
    
    // Required fields validation
    if (!name || !email || !course || !trainingMode || !sponsor) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: Name, Email, Course, Training Mode, and Sponsor are required.' 
      }, { status: 400 });
    }

    // Date validation
    let preferredStartDate = null;
    let preferredEndDate = null;
    if (preferredStartDateStr) {
      preferredStartDate = new Date(preferredStartDateStr);
      if (isNaN(preferredStartDate.getTime())) {
        return NextResponse.json({ success: false, message: 'Invalid Preferred Start Date.' }, { status: 400 });
      }
    }
    if (preferredEndDateStr) {
      preferredEndDate = new Date(preferredEndDateStr);
      if (isNaN(preferredEndDate.getTime())) {
        return NextResponse.json({ success: false, message: 'Invalid Preferred End Date.' }, { status: 400 });
      }
    }

    // Extract SelectedSlotID if present
    const selectedSlotIdStr = formData.get("SelectedSlotID")?.toString();
    const selectedSlotId = selectedSlotIdStr ? parseInt(selectedSlotIdStr, 10) : null;

    if (trainingMode !== "E-Learning (Self-Paced)" && !selectedSlotId) {
      if (!preferredStartDate || !preferredEndDate) {
        return NextResponse.json({ 
          success: false, 
          message: 'Requested Dates are required for this training mode.' 
        }, { status: 400 });
      }
    }

    if (preferredStartDate && preferredEndDate && preferredStartDate > preferredEndDate) {
      return NextResponse.json({ success: false, message: 'Preferred Start Date cannot be after End Date.' }, { status: 400 });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email format.' 
      }, { status: 400 });
    }

    const graduationYear = graduationYearStr ? parseInt(graduationYearStr, 10) : null;
    let paymentProofPath = "";
    
    // SelectedSlotID extracted above

    const pool = await getConnection();

    if (selectedSlotId) {
      const slotCheck = await pool.query(`
        SELECT MaxParticipants, StartDate, EndDate,
               (SELECT COUNT(*) FROM Registrations WHERE SelectedSlotID = $1 AND Status NOT IN ('REJECTED', 'CANCELLED')) as CurrentEnrolled
        FROM TrainingCalendar 
        WHERE CalendarID = $2
      `, [selectedSlotId, selectedSlotId]);
      const slot = slotCheck.recordset[0];
      if (slot && slot.CurrentEnrolled >= slot.MaxParticipants) {
        return NextResponse.json({ success: false, message: 'This batch is fully booked.' }, { status: 400 });
      }
      if (slot) {
        preferredStartDate = new Date(slot.StartDate);
        preferredEndDate = new Date(slot.EndDate);
      }
    }

    // Date Duration Validation
    if (preferredStartDate && preferredEndDate && trainingMode !== "E-Learning (Self-Paced)") {
      const { calculateWorkingDays } = await import("../../library/dateUtils");
      const workingDays = calculateWorkingDays(preferredStartDate, preferredEndDate);
      
      const courseCheck = await pool.query(`
        SELECT DurationDays FROM LMS_Courses WHERE Title = $1 AND Status = 'ACTIVE'
      `, [course]);
      
      if (courseCheck.recordset.length > 0) {
        const requiredDays = courseCheck.recordset[0].DurationDays;
        if (requiredDays && workingDays !== requiredDays) {
          return NextResponse.json({ 
            success: false, 
            message: `Selected dates do not match the course duration. This course requires ${requiredDays} training days (Mon-Fri).` 
          }, { status: 400 });
        }
      }
    }

    // Use parameterized queries to prevent SQL injection
    const result = await pool.query(`
        INSERT INTO Registrations
        (
            Name, Email, Phone, Organization, Country, GraduationYear,
            Course, TrainingMode, SponsoredBy, SpecialInstructions, PaymentProofPath, Status, RegistrationType, SelectedSlotID, OriginalStartDate, OriginalEndDate, DateApprovalStatus
        )
        VALUES
        (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
        RETURNING Id
      `, [name, email, phone || null, organization || null, country || null, graduationYear, course, trainingMode, sponsor, instructions || null, paymentProofPath || null, "PENDING", sponsor.toUpperCase() === "ORGANIZATION" ? "ORGANIZATION" : "SELF", selectedSlotId, preferredStartDate || null, preferredEndDate || null, (!selectedSlotId && preferredStartDate) ? "PENDING" : "NOT_REQUESTED"]);

    const newRegId = result.recordset[0]?.Id;

    return NextResponse.json({
      success: true,
      message: "Registration successful. Please proceed to payment.",
      registrationId: newRegId
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError' && error.message === 'MALICIOUS_PAYLOAD_DETECTED') {
      return NextResponse.json({
        success: false,
        message: 'Invalid input detected: request rejected for security reasons.',
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Registration failed due to a server error. Please try again later.',
      errorDetail: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}