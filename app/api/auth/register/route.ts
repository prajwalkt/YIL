import { NextRequest, NextResponse } from 'next/server';
import { 
  hashPassword, sanitizeEmail, sanitizeInput, 
  validatePasswordStrength, auditLog 
} from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  try {
    const body = await request.json();
    const email = sanitizeEmail(body.email || '');
    const password = body.password || '';
    const firstName = sanitizeInput(body.firstName || '');
    const lastName = sanitizeInput(body.lastName || '');
    const phone = sanitizeInput(body.phone || '');
    const organization = sanitizeInput(body.organization || '');
    const country = sanitizeInput(body.country || '');

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email, password, first name, and last name are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: 'Invalid email format' }, { status: 400 });
    }

    // Validate password strength
    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.valid) {
      return NextResponse.json({ success: false, message: pwCheck.message }, { status: 400 });
    }

    const pool = await getConnection();
    
    // Check if email already exists
    const existing = await pool.request()
      .input('Email', email)
      .query(`SELECT UserID FROM LMS_Users WHERE Email = @Email`);
    
    if (existing.recordset.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'An account with this email already exists' 
      }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    await pool.request()
      .input('Email', email)
      .input('PasswordHash', passwordHash)
      .input('Role', 'STUDENT')
      .input('FirstName', firstName)
      .input('LastName', lastName)
      .input('Phone', phone)
      .input('Organization', organization)
      .input('Country', country)
      .query(`
        INSERT INTO LMS_Users (Email, PasswordHash, Role, FirstName, LastName, Phone, Organization, Country, IsActive, IsApproved)
        VALUES (@Email, @PasswordHash, @Role, @FirstName, @LastName, @Phone, @Organization, @Country, 1, 1)
      `);

    await auditLog(null, email, 'STUDENT_REGISTERED', 'AUTH', `New student registration from ${ip}`, ip, 'SUCCESS');

    return NextResponse.json({ 
      success: true, 
      message: 'Account created successfully. You can now login.' 
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, message: 'Registration failed. Please try again.' }, { status: 500 });
  }
}
