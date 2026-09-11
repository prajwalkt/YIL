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
    const existing = await pool.request()
      .input('CourseID', courseId)
      .input('Title', title)
      .query(`SELECT MaterialID FROM CourseMaterials WHERE CourseID = @CourseID AND Title = @Title`);

    let materialId;
    let versionNumber = 1;

    if (existing.recordset.length > 0) {
      materialId = existing.recordset[0].MaterialID;
      
      // Get max version
      const maxVer = await pool.request()
        .input('MaterialID', materialId)
        .query(`SELECT ISNULL(MAX(VersionNumber), 0) + 1 as NextVer FROM CourseMaterialVersions WHERE MaterialID = @MaterialID`);
      versionNumber = maxVer.recordset[0].NextVer;

      // Update existing
      await pool.request()
        .input('MaterialID', materialId)
        .input('FilePath', filePath)
        .input('UploadedBy', user!.userId)
        .query(`UPDATE CourseMaterials SET FilePath = @FilePath, UploadedBy = @UploadedBy WHERE MaterialID = @MaterialID`);
    } else {
      // Insert new
      const insertResult = await pool.request()
        .input('CourseID', courseId)
        .input('Title', title)
        .input('FileType', fileType || 'DOCUMENT')
        .input('FilePath', filePath)
        .input('UploadedBy', user!.userId)
        .input('IsVisible', isVisible === undefined ? 1 : isVisible)
        .query(`
          INSERT INTO CourseMaterials (CourseID, Title, FileType, FilePath, UploadedBy, IsVisibleToStudent)
          OUTPUT INSERTED.MaterialID
          VALUES (@CourseID, @Title, @FileType, @FilePath, @UploadedBy, @IsVisible)
        `);
      materialId = insertResult.recordset[0].MaterialID;
    }

    // Insert version history
    await pool.request()
      .input('MaterialID', materialId)
      .input('FilePath', filePath)
      .input('VersionNumber', versionNumber)
      .input('UploadedBy', user!.userId)
      .query(`
        INSERT INTO CourseMaterialVersions (MaterialID, FilePath, VersionNumber, UploadedBy)
        VALUES (@MaterialID, @FilePath, @VersionNumber, @UploadedBy)
      `);

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
    await pool.request().input('ID', materialId).query(`DELETE FROM CourseMaterials WHERE MaterialID = @ID`);
    return NextResponse.json({ success: true, message: 'Material deleted' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
