import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../library/validation';
import { getUserFromRequest, requireRole } from '../../library/auth';
import { getConnection } from '../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const courseId = url.searchParams.get('courseId');

  try {
    const pool = await getConnection();
    let query = `
      SELECT m.*, u.FirstName + ' ' + u.LastName as UploadedByName
      FROM CourseMaterials m
      JOIN LMS_Users u ON m.UploadedBy = u.UserID
    `;
    
    // Students only see materials that are visible, others see all
    if (user.role === 'STUDENT' || user.role === 'AFFILIATE') {
      query += ` WHERE m.IsVisibleToStudent = 1 `;
      if (courseId) query += ` AND m.CourseID = @CourseID `;
    } else {
      if (courseId) query += ` WHERE m.CourseID = @CourseID `;
    }
    
    query += ` ORDER BY m.CreatedAt DESC`;
    
    const req = pool.request();
    if (courseId) req.input('CourseID', courseId);
    
    const result = await req.query(query);
    return NextResponse.json({ success: true, materials: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TRAINER', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const { courseId, title, fileType, filePath, isVisible } = await parseAndSanitizeBody(request);
    if (!courseId || !title || !filePath) return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });

    const pool = await getConnection();
    
    // Check if material with same title exists
    const existing = await pool.query(`SELECT MaterialID FROM CourseMaterials WHERE CourseID = $1 AND Title = $2`, [courseId, title]);

    let materialId;
    let versionNumber = 1;

    if (existing.recordset.length > 0) {
      materialId = existing.recordset[0].MaterialID;
      
      // Get max version
      const maxVer = await pool.query(`SELECT COALESCE(MAX(VersionNumber), 0) + 1 as NextVer FROM CourseMaterialVersions WHERE MaterialID = $1`, [materialId]);
      versionNumber = maxVer.recordset[0].NextVer;

      // Update existing
      await pool.query(`UPDATE CourseMaterials SET FilePath = $1, UploadedBy = $2 WHERE MaterialID = $3`, [filePath, user!.userId, materialId]);
    } else {
      // Insert new
      const insertResult = await pool.query(`
          INSERT INTO CourseMaterials (CourseID, Title, FileType, FilePath, UploadedBy, IsVisibleToStudent)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING MaterialID
        `, [courseId, title, fileType || 'DOCUMENT', filePath, user!.userId, isVisible === undefined ? 1 : isVisible]);
      materialId = insertResult.recordset[0].MaterialID;
    }

    // Insert version history
    await pool.query(`
        INSERT INTO CourseMaterialVersions (MaterialID, FilePath, VersionNumber, UploadedBy)
        VALUES ($1, $2, $3, $4)
      `, [materialId, filePath, versionNumber, user!.userId]);

    return NextResponse.json({ success: true, message: 'Material added successfully' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TRAINER', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  const url = new URL(request.url);
  const materialId = url.searchParams.get('id');
  if (!materialId) return NextResponse.json({ success: false, message: 'Missing material ID' }, { status: 400 });

  try {
    const pool = await getConnection();
    await pool.query(`DELETE FROM CourseMaterials WHERE MaterialID = $1`, [materialId]);
    return NextResponse.json({ success: true, message: 'Material deleted' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
