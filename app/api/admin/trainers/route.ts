import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole, sanitizeInput, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT u.UserID, u.FirstName, u.LastName, u.Email, u.Phone, u.IsActive,
             tp.ProfileID, tp.EmployeeID, tp.Department, tp.Expertise, tp.ExperienceYears,
             tp.TrainerRating, tp.Certifications, tp.Biography, tp.IsApproved
      FROM LMS_Users u
      LEFT JOIN TrainerProfiles tp ON u.UserID = tp.UserID
      WHERE u.Role = 'TRAINER'
      ORDER BY u.CreatedAt DESC
    `);
    return NextResponse.json({ success: true, trainers: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await request.json();
    const { userId, employeeId, department, expertise, experienceYears, certifications, biography, linkedInURL, isApproved } = body;
    if (!userId) return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });

    const pool = await getConnection();
    // Upsert trainer profile
    const existing = await pool.request().input('UserID', userId).query(`SELECT ProfileID FROM TrainerProfiles WHERE UserID = @UserID`);

    if (existing.recordset.length > 0) {
      await pool.request()
        .input('UserID', userId).input('EmployeeID', sanitizeInput(employeeId || ''))
        .input('Department', sanitizeInput(department || '')).input('Expertise', sanitizeInput(expertise || ''))
        .input('ExperienceYears', Number(experienceYears) || 0).input('Certifications', sanitizeInput(certifications || ''))
        .input('Biography', sanitizeInput(biography || '')).input('LinkedInURL', sanitizeInput(linkedInURL || ''))
        .input('IsApproved', isApproved ? 1 : 0)
        .query(`UPDATE TrainerProfiles SET EmployeeID=@EmployeeID,Department=@Department,Expertise=@Expertise,ExperienceYears=@ExperienceYears,Certifications=@Certifications,Biography=@Biography,LinkedInURL=@LinkedInURL,IsApproved=@IsApproved,UpdatedAt=GETDATE() WHERE UserID=@UserID`);
    } else {
      await pool.request()
        .input('UserID', userId).input('EmployeeID', sanitizeInput(employeeId || ''))
        .input('Department', sanitizeInput(department || '')).input('Expertise', sanitizeInput(expertise || ''))
        .input('ExperienceYears', Number(experienceYears) || 0).input('Certifications', sanitizeInput(certifications || ''))
        .input('Biography', sanitizeInput(biography || '')).input('LinkedInURL', sanitizeInput(linkedInURL || ''))
        .input('IsApproved', isApproved ? 1 : 0)
        .query(`INSERT INTO TrainerProfiles (UserID,EmployeeID,Department,Expertise,ExperienceYears,Certifications,Biography,LinkedInURL,IsApproved) VALUES (@UserID,@EmployeeID,@Department,@Expertise,@ExperienceYears,@Certifications,@Biography,@LinkedInURL,@IsApproved)`);
    }

    await auditLog(user!.userId, user!.email, 'TRAINER_PROFILE_SAVED', 'TRAINERS', `Saved profile for user ${userId}`, ip);
    return NextResponse.json({ success: true, message: 'Trainer profile saved' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
