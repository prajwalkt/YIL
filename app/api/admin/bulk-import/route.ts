import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeFormData } from '../../../library/validation';
import { getUserFromRequest, auditLog, hashPassword } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import { validateUploadedFile, ALLOWED_MIME_TYPES } from '../../../library/fileUpload';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });

  try {
    const formData = await parseAndSanitizeFormData(request);
    const type = formData.get('type') as string;
    const file = formData.get('file') as File;

    if (!type || !file) return NextResponse.json({ success: false, message: 'Type and file are required' }, { status: 400 });

    const validation = await validateUploadedFile(file, {
      allowedMimeTypes: ALLOWED_MIME_TYPES.DOCUMENT,
      maxSizeBytes: 10 * 1024 * 1024,
      allowedExtensions: ['.xlsx', '.xls'],
    });

    if (!validation.valid) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
    }

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
        const exists = await pool.query(`SELECT UserID FROM LMS_Users WHERE Email = $1`, [row.Email]);
        if (exists.recordset.length === 0) {
          const defaultPassword = await hashPassword('Yokogawa@123');
          await pool.query(`
              INSERT INTO LMS_Users (Email, PasswordHash, Role, FirstName, LastName, Phone, Organization, Country, IsActive, IsApproved, MustChangePassword, CreatedAt)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 1, 1, CURRENT_TIMESTAMP)
            `, [row.Email, defaultPassword, row.Role.toUpperCase(), row.FirstName, row.LastName || '', row.Phone || '', row.Organization || '', row.Country || '']);
          importedCount++;
        }
      }
    } else if (type === 'courses') {
      for (const row of data) {
        if (!row.Title || !row.Code) continue;
        await pool.query(`
            INSERT INTO LMS_Courses (Title, Code, Description, Duration, FeeUSD, Mode, Status, Category, CreatedBy, CreatedAt)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
          `, [row.Title, row.Code, row.Description || '', row.Duration || '', row.FeeUSD || 0, row.Mode || 'VILT', row.Status || 'Active', row.Category || 'General', user.userId]);
        importedCount++;
      }
    } else if (type === 'calendar') {
      for (const row of data) {
        if (!row.CourseID || !row.StartDate) continue;
        await pool.query(`
            INSERT INTO TrainingCalendar (CourseID, Title, TrainingType, StartDate, EndDate, Status, CreatedAt)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          `, [row.CourseID, row.Title || 'Scheduled Training', row.TrainingType || 'VILT', new Date(row.StartDate), row.EndDate ? new Date(row.EndDate) : new Date(row.StartDate), row.Status || 'Scheduled']);
        importedCount++;
      }
    } else {
      return NextResponse.json({ success: false, message: 'Invalid import type' }, { status: 400 });
    }

    await auditLog(user.userId, user.email, 'BULK_IMPORT', 'ADMIN', `Imported ${importedCount} ${type}`, '0.0.0.0', 'SUCCESS');

    return NextResponse.json({ success: true, message: `Successfully imported ${importedCount} records.`, importedCount });
  } catch (e: any) {
    console.error('Bulk Import Error:', e);
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
