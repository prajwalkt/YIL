import { NextResponse } from 'next/server';
import { getConnection } from '../../../library/db';

export async function GET() {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('Email', 'admin@yts.yokogawa.com')
            .query('SELECT UserID, Email, PasswordHash, Role, IsActive, IsApproved, LockoutUntil, FailedLoginAttempts FROM LMS_Users WHERE Email = @Email');
            
        if (result.recordset.length === 0) {
            return NextResponse.json({ success: true, message: 'Admin not found' });
        }
        
        return NextResponse.json({ success: true, user: result.recordset[0] });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message, stack: e.stack });
    }
}
