import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../library/validation';
import { getUserFromRequest, requireRole } from '../../library/auth';
import { getConnection } from '../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'inbox'; // inbox or sent

  try {
    const pool = await getConnection();
    let query = '';
    
    if (type === 'sent') {
      query = `
        SELECT m.*, u.FirstName + ' ' + u.LastName as ReceiverName, u.Email as ReceiverEmail, u.Role as ReceiverRole
        FROM Messages m
        JOIN LMS_Users u ON m.ReceiverID = u.UserID
        WHERE m.SenderID = @UserID
        ORDER BY m.CreatedAt DESC
      `;
    } else {
      query = `
        SELECT m.*, u.FirstName + ' ' + u.LastName as SenderName, u.Email as SenderEmail, u.Role as SenderRole
        FROM Messages m
        JOIN LMS_Users u ON m.SenderID = u.UserID
        WHERE m.ReceiverID = @UserID
        ORDER BY m.CreatedAt DESC
      `;
    }
    
    const result = await pool.request().input('UserID', user.userId).query(query);
    return NextResponse.json({ success: true, messages: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const { receiverId, subject, body } = await parseAndSanitizeBody(request);
    if (!receiverId || !subject || !body) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const pool = await getConnection();
    await pool.request()
      .input('SenderID', user.userId)
      .input('ReceiverID', receiverId)
      .input('Subject', subject)
      .input('Body', body)
      .query(`
        INSERT INTO Messages (SenderID, ReceiverID, Subject, Body)
        VALUES (@SenderID, @ReceiverID, @Subject, @Body)
      `);

    return NextResponse.json({ success: true, message: 'Message sent successfully' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const { messageId } = await parseAndSanitizeBody(request);
    if (!messageId) return NextResponse.json({ success: false, message: 'Missing messageId' }, { status: 400 });

    const pool = await getConnection();
    await pool.request()
      .input('MessageID', messageId)
      .input('UserID', user.userId)
      .query(`
        UPDATE Messages 
        SET IsRead = 1, ReadAt = GETDATE() 
        WHERE MessageID = @MessageID AND ReceiverID = @UserID
      `);

    return NextResponse.json({ success: true, message: 'Message marked as read' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
