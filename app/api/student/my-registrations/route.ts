import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'STUDENT', 'AFFILIATE', 'ADMIN')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const pool = await getConnection();
    const req = pool.request();
    req.input('Email', user!.email);

    // Fetch registrations matching this user's email
    // Wait, for Affiliates, they might register ON BEHALF of students. 
    // Usually Affiliate registrations use the Affiliate's email for tracking, or a specific field.
    // Assuming the email field in Registrations matches the person who registered it.
    const result = await req.query(`
      SELECT Id, Name, Email, Phone, Company, Course, TrainingMode, Message, Status, CreatedAt 
      FROM Registrations 
      WHERE Email = @Email
      ORDER BY CreatedAt DESC
    `);

    return NextResponse.json({ 
      success: true, 
      registrations: result.recordset 
    });
  } catch (e: any) {
    console.error("Error in my-registrations API:", e);
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
