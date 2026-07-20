import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    const result = await pool.request().query(`SELECT * FROM Notifications ORDER BY CreatedAt DESC`);
    return NextResponse.json({ success: true, notifications: result.recordset });
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
    const { title, message, priority, recipientRole, startDate, expiryDate } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, message: 'Title and Message are required' }, { status: 400 });
    }

    const pool = await getConnection();
    await pool.request()
      .input('Title', title)
      .input('Message', message)
      .input('Priority', priority || 'NORMAL')
      .input('RecipientRole', recipientRole || 'ALL')
      .input('StartDate', startDate ? new Date(startDate) : null)
      .input('ExpiryDate', expiryDate ? new Date(expiryDate) : null)
      .input('CreatedBy', user!.userId)
      .query(`
        INSERT INTO Notifications (Title, Message, Priority, RecipientRole, StartDate, ExpiryDate, CreatedBy)
        VALUES (@Title, @Message, @Priority, @RecipientRole, @StartDate, @ExpiryDate, @CreatedBy)
      `);

    await auditLog(user!.userId, user!.email, 'CREATE_NOTIFICATION', 'NOTIFICATIONS', `Created notification: ${title}`, ip);
    return NextResponse.json({ success: true, message: 'Notification created successfully' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ success: false, message: 'Notification ID required' }, { status: 400 });

    const pool = await getConnection();
    await pool.request().input('ID', Number(id)).query(`DELETE FROM Notifications WHERE NotificationID = @ID`);

    await auditLog(user!.userId, user!.email, 'DELETE_NOTIFICATION', 'NOTIFICATIONS', `Deleted notification ID: ${id}`, ip);
    return NextResponse.json({ success: true, message: 'Notification deleted successfully' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
