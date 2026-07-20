import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, auditLog, hashPassword } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });

  try {
    const formData = await request.formData();
    const type = formData.get('type') as string;
    const file = formData.get('file') as File;

    if (!type || !file) return NextResponse.json({ success: false, message: 'Type and file are required' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (data.length === 0) return NextResponse.json({ success: false, message: 'File is empty' }, { status: 400 });

    const pool = await getConnection();
    let importedCount = 0;

    if (type === 'users') {
      for (const row of data) {
        if (!row.Email || !row.Role || !row.FirstName) continue;
        const exists = await pool.request().input('Email', row.Email).query(`SELECT UserID FROM LMS_Users WHERE Email = @Email`);
        if (exists.recordset.length === 0) {
          const defaultPassword = await hashPassword('Yokogawa@123');
          await pool.request()
            .input('Email', row.Email)
            .input('PasswordHash', defaultPassword)
            .input('Role', row.Role.toUpperCase())
            .input('FirstName', row.FirstName)
            .input('LastName', row.LastName || '')
            .input('Phone', row.Phone || '')
            .input('Organization', row.Organization || '')
            .input('Country', row.Country || '')
            .query(`
              INSERT INTO LMS_Users (Email, PasswordHash, Role, FirstName, LastName, Phone, Organization, Country, IsActive, IsApproved, MustChangePassword, CreatedAt)
              VALUES (@Email, @PasswordHash, @Role, @FirstName, @LastName, @Phone, @Organization, @Country, 1, 1, 1, GETDATE())
            `);
          importedCount++;
        }
      }
    } else if (type === 'courses') {
      for (const row of data) {
        if (!row.Title || !row.Code) continue;
        await pool.request()
          .input('Title', row.Title)
          .input('Code', row.Code)
          .input('Description', row.Description || '')
          .input('Duration', row.Duration || '')
          .input('FeeUSD', row.FeeUSD || 0)
          .input('Mode', row.Mode || 'VILT')
          .input('Status', row.Status || 'Active')
          .input('Category', row.Category || 'General')
          .input('CreatedBy', user.userId)
          .query(`
            INSERT INTO LMS_Courses (Title, Code, Description, Duration, FeeUSD, Mode, Status, Category, CreatedBy, CreatedAt)
            VALUES (@Title, @Code, @Description, @Duration, @FeeUSD, @Mode, @Status, @Category, @CreatedBy, GETDATE())
          `);
        importedCount++;
      }
    } else if (type === 'calendar') {
      for (const row of data) {
        if (!row.CourseID || !row.StartDate) continue;
        await pool.request()
          .input('CourseID', row.CourseID)
          .input('Title', row.Title || 'Scheduled Training')
          .input('TrainingType', row.TrainingType || 'VILT')
          .input('StartDate', new Date(row.StartDate))
          .input('EndDate', row.EndDate ? new Date(row.EndDate) : new Date(row.StartDate))
          .input('Status', row.Status || 'Scheduled')
          .query(`
            INSERT INTO TrainingCalendar (CourseID, Title, TrainingType, StartDate, EndDate, Status, CreatedAt)
            VALUES (@CourseID, @Title, @TrainingType, @StartDate, @EndDate, @Status, GETDATE())
          `);
        importedCount++;
      }
    } else {
      return NextResponse.json({ success: false, message: 'Invalid import type' }, { status: 400 });
    }

    await auditLog(user.userId, user.email, 'BULK_IMPORT', 'ADMIN', `Imported ${importedCount} ${type}`, '0.0.0.0', 'SUCCESS');

    return NextResponse.json({ success: true, message: `Successfully imported ${importedCount} records.`, importedCount });
  } catch (e: any) {
    console.error('Bulk Import Error:', e);
    return NextResponse.json({ success: false, message: e.message || 'Import failed' }, { status: 500 });
  }
}
