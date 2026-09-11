import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole, hashPassword, sanitizeEmail, validatePasswordStrength, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import { checkRateLimit, getClientIP, RateLimits } from '../../../library/rateLimiter';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    let query = `SELECT UserID, Email, Role, FirstName, LastName, Phone, Organization, Country, IsActive, IsApproved, CreatedAt, LastLogin FROM LMS_Users WHERE 1=1`;
    const inputs: Record<string, string> = {};

    if (role) { query += ` AND Role = @Role`; inputs['Role'] = role; }
    if (search) { query += ` AND (Email LIKE @Search OR FirstName LIKE @Search OR LastName LIKE @Search)`; inputs['Search'] = `%${search}%`; }
    query += ` ORDER BY CreatedAt DESC`;

    const req = pool.request();
    Object.entries(inputs).forEach(([k, v]) => req.input(k, v));
    const result = await req.query(query);

    return NextResponse.json({ success: true, users: result.recordset });
  } catch (e: any) {
    console.error('Users GET error:', e);
    return NextResponse.json({ success: false, message: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await parseAndSanitizeBody(request);
    const email = sanitizeEmail(body.email || '');
    const role = body.role as string;
    const firstName = body.firstName || '';
    const lastName = body.lastName || '';
    const phone = body.phone || '';
    const organization = body.organization || '';
    const country = body.country || '';
    const password = body.password || 'YTS@Temp2024!';

    if (!email || !role || !firstName || !lastName) {
      return NextResponse.json({ success: false, message: 'Required fields missing' }, { status: 400 });
    }

    const validRoles = ['ADMIN','TRAINER','AFFILIATE','STUDENT','FINANCE','TM'];
    if (!validRoles.includes(role)) return NextResponse.json({ success: false, message: 'Invalid role' }, { status: 400 });

    const pwCheck = validatePasswordStrength(password);
    if (!pwCheck.valid && body.password) return NextResponse.json({ success: false, message: pwCheck.message }, { status: 400 });

    const pool = await getConnection();
    const existing = await pool.request().input('Email', email).query(`SELECT UserID FROM LMS_Users WHERE Email = @Email`);
    if (existing.recordset.length > 0) return NextResponse.json({ success: false, message: 'Email already exists' }, { status: 409 });

    const passwordHash = await hashPassword(password);
    await pool.request()
      .input('Email', email).input('PasswordHash', passwordHash).input('Role', role)
      .input('FirstName', firstName).input('LastName', lastName).input('Phone', phone)
      .input('Organization', organization).input('Country', country)
      .query(`INSERT INTO LMS_Users (Email,PasswordHash,Role,FirstName,LastName,Phone,Organization,Country,IsActive,IsApproved,MustChangePassword) VALUES (@Email,@PasswordHash,@Role,@FirstName,@LastName,@Phone,@Organization,@Country,1,1,1)`);

    await auditLog(user!.userId, user!.email, 'USER_CREATED', 'USERS', `Created ${role}: ${email}`, ip);
    return NextResponse.json({ success: true, message: 'User created successfully' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await parseAndSanitizeBody(request);
    const { userId, role, isActive, isApproved, firstName, lastName, phone, organization, country } = body;
    if (!userId) return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });

    const pool = await getConnection();
    await pool.request()
      .input('UserID', userId).input('Role', role).input('IsActive', isActive ? 1 : 0)
      .input('IsApproved', isApproved ? 1 : 0).input('FirstName', firstName || '')
      .input('LastName', lastName || '').input('Phone', phone || '')
      .input('Organization', organization || '').input('Country', country || '')
      .query(`UPDATE LMS_Users SET Role=@Role,IsActive=@IsActive,IsApproved=@IsApproved,FirstName=@FirstName,LastName=@LastName,Phone=@Phone,Organization=@Organization,Country=@Country WHERE UserID=@UserID`);

    await auditLog(user!.userId, user!.email, 'USER_UPDATED', 'USERS', `Updated user ${userId}`, ip);
    return NextResponse.json({ success: true, message: 'User updated' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    if (!userId) return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
    if (Number(userId) === user!.userId) return NextResponse.json({ success: false, message: 'Cannot delete your own account' }, { status: 400 });

    const pool = await getConnection();
    await pool.request().input('UserID', Number(userId)).query(`UPDATE LMS_Users SET IsActive=0 WHERE UserID=@UserID`);
    await auditLog(user!.userId, user!.email, 'USER_DELETED', 'USERS', `Soft deleted user ${userId}`, ip);
    return NextResponse.json({ success: true, message: 'User deactivated' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
