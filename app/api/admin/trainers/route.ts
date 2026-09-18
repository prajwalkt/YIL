import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    const result = await pool.query(`
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
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await parseAndSanitizeBody(request);
    const { userId, employeeId, department, expertise, experienceYears, certifications, biography, linkedInURL, isApproved } = body;
    if (!userId) return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });

    const pool = await getConnection();
    // Upsert trainer profile
    const existing = await pool.query(`SELECT ProfileID FROM TrainerProfiles WHERE UserID = $1`, [userId]);

    if (existing.recordset.length > 0) {
      await pool.query(`UPDATE TrainerProfiles SET EmployeeID=$1,Department=$2,Expertise=$3,ExperienceYears=$4,Certifications=$5,Biography=$6,LinkedInURL=$7,IsApproved=$8,UpdatedAt=CURRENT_TIMESTAMP WHERE UserID=$9`, [employeeId || '', department || '', expertise || '', Number(experienceYears) || 0, certifications || '', biography || '', linkedInURL || '', isApproved ? 1 : 0, userId]);
    } else {
      await pool.query(`INSERT INTO TrainerProfiles (UserID,EmployeeID,Department,Expertise,ExperienceYears,Certifications,Biography,LinkedInURL,IsApproved) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [userId, employeeId || '', department || '', expertise || '', Number(experienceYears) || 0, certifications || '', biography || '', linkedInURL || '', isApproved ? 1 : 0]);
    }

    await auditLog(user!.userId, user!.email, 'TRAINER_PROFILE_SAVED', 'TRAINERS', `Saved profile for user ${userId}`, ip);
    return NextResponse.json({ success: true, message: 'Trainer profile saved' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
