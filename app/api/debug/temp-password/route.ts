import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'No email' });

  const pool = await getConnection();
  const res = await pool.request()
    .input('Email', email)
    .query(`
      SELECT Body FROM Messages 
      WHERE Body LIKE '%Temporary Password:%' 
      AND ReceiverID = (SELECT UserID FROM LMS_Users WHERE Email = @Email)
      ORDER BY SentAt DESC
    `);
  
  if (res.recordset.length > 0) {
    const match = res.recordset[0].Body.match(/Temporary Password:\s*([^\n\r<]+)/);
    if (match) {
      return NextResponse.json({ password: match[1].trim(), body: res.recordset[0].Body });
    }
  }
  return NextResponse.json({ error: 'Not found' });
}
