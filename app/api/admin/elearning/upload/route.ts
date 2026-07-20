import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../../library/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const courseId = formData.get('courseId') as string | null;
    const contentType = (formData.get('contentType') as string | null) || 'VIDEO';

    if (!file) return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    if (!courseId) return NextResponse.json({ success: false, message: 'courseId is required' }, { status: 400 });

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, message: 'File size exceeds 500 MB limit' }, { status: 413 });
    }

    // Validate file type
    const ext = extname(file.name).toLowerCase();
    const allowedVideo = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    const allowedDoc = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx'];
    const isVideo = contentType === 'VIDEO' && allowedVideo.includes(ext);
    const isDoc = (contentType === 'PDF' || contentType === 'DOCUMENT') && allowedDoc.includes(ext);

    if (!isVideo && !isDoc) {
      return NextResponse.json({
        success: false,
        message: `Invalid file type. Videos: ${allowedVideo.join(', ')} | Documents: ${allowedDoc.join(', ')}`,
      }, { status: 400 });
    }

    // Build destination path
    const subDir = isVideo ? 'videos' : 'docs';
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'elearning', courseId, subDir);

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Unique filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}_${safeName}`;
    const filePath = `/uploads/elearning/${courseId}/${subDir}/${fileName}`;
    const absPath = join(process.cwd(), 'public', filePath);

    const bytes = await file.arrayBuffer();
    await writeFile(absPath, Buffer.from(bytes));

    return NextResponse.json({
      success: true,
      filePath,
      fileName,
      fileSize: file.size,
      message: 'File uploaded successfully',
    });
  } catch (e: any) {
    console.error('Upload error:', e);
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
