import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import fs from 'fs';
import path from 'path';

// GET — List all E-Learning content (optionally filter by courseId)
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    const pool = await getConnection();
    let query = `
      SELECT ec.*, c.Title as CourseTitle, u.FirstName + ' ' + u.LastName as CreatedByName
      FROM ELearningContent ec
      LEFT JOIN LMS_Courses c ON ec.CourseID = c.CourseID
      LEFT JOIN LMS_Users u ON ec.CreatedBy = u.UserID
    `;
    if (courseId) query += ` WHERE ec.CourseID = ${Number(courseId)}`;
    query += ` ORDER BY ec.CourseID, ec.SortOrder, ec.ContentID`;

    const result = await pool.request().query(query);
    return NextResponse.json({ success: true, content: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

// POST — Create new E-Learning content entry
export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await parseAndSanitizeBody(request);
    const { courseId, title, contentType, filePath, durationSec, sortOrder, isRequired, description, thumbnailPath } = body;

    if (!courseId || !title || !contentType || !filePath) {
      return NextResponse.json({ success: false, message: 'courseId, title, contentType and filePath are required' }, { status: 400 });
    }

    const pool = await getConnection();
    const result = await pool.query(`
        INSERT INTO ELearningContent (CourseID, Title, ContentType, FilePath, DurationSec, SortOrder, IsRequired, Description, ThumbnailPath, CreatedBy)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING ContentID
      `, [Number(courseId), title, contentType, filePath, durationSec || 0, sortOrder || 0, isRequired !== false ? 1 : 0, description || '', thumbnailPath || '', user!.userId]);

    await auditLog(user!.userId, user!.email, 'ELEARNING_CONTENT_ADDED', 'ELEARNING', `Added ${contentType}: ${title} for Course ${courseId}`, ip);

    return NextResponse.json({ success: true, message: 'Content added successfully', contentId: result.recordset[0].ContentID });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

// PUT — Update existing E-Learning content
export async function PUT(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await parseAndSanitizeBody(request);
    const { contentId, title, contentType, filePath, durationSec, sortOrder, isRequired, description, thumbnailPath } = body;

    if (!contentId) return NextResponse.json({ success: false, message: 'contentId is required' }, { status: 400 });

    const pool = await getConnection();
    await pool.query(`
        UPDATE ELearningContent
        SET Title = $1, ContentType = $2, FilePath = $3,
            DurationSec = $4, SortOrder = $5, IsRequired = $6,
            Description = $7, ThumbnailPath = $8, UpdatedAt = CURRENT_TIMESTAMP
        WHERE ContentID = $9
      `, [title || '', contentType || 'VIDEO', filePath || '', durationSec || 0, sortOrder || 0, isRequired !== false ? 1 : 0, description || '', thumbnailPath || '', Number(contentId)]);

    await auditLog(user!.userId, user!.email, 'ELEARNING_CONTENT_UPDATED', 'ELEARNING', `Updated content ${contentId}`, ip);
    return NextResponse.json({ success: true, message: 'Content updated successfully' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE — Remove E-Learning content
export async function DELETE(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');
    if (!contentId) return NextResponse.json({ success: false, message: 'contentId is required' }, { status: 400 });

    const pool = await getConnection();

    // Get file path before deleting (for optional file cleanup)
    const existing = await pool.query(`SELECT FilePath FROM ELearningContent WHERE ContentID = $1`, [Number(contentId)]);

    await pool.query(`DELETE FROM ELearningContent WHERE ContentID = $1`, [Number(contentId)]);

    // Optional: delete physical file
    if (existing.recordset.length > 0) {
      const filePath = existing.recordset[0].FilePath;
      if (filePath && filePath.startsWith('/uploads/')) {
        try {

          const absPath = path.join(process.cwd(), 'public', filePath);
          if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
        } catch { /* file cleanup is best-effort */ }
      }
    }

    await auditLog(user!.userId, user!.email, 'ELEARNING_CONTENT_DELETED', 'ELEARNING', `Deleted content ${contentId}`, ip);
    return NextResponse.json({ success: true, message: 'Content deleted successfully' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
