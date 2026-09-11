import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeFormData } from '../../../../library/validation';
import { getUserFromRequest, requireRole } from '../../../../library/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';
import { validateUploadedFile, generateSafeFilename, ALLOWED_MIME_TYPES, verifyMimeByMagic } from '../../../../library/fileUpload';

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const formData = await parseAndSanitizeFormData(request);
    const file = formData.get('file') as File | null;
    const courseId = formData.get('courseId') as string | null;
    const contentType = (formData.get('contentType') as string | null) || 'VIDEO';

    if (!file) return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
    if (!courseId) return NextResponse.json({ success: false, message: 'courseId is required' }, { status: 400 });

    let allowedMimes: string[] = [];
    if (contentType === 'VIDEO') allowedMimes = ALLOWED_MIME_TYPES.VIDEO;
    else if (contentType === 'PDF') allowedMimes = ALLOWED_MIME_TYPES.PDF;
    else if (contentType === 'DOCUMENT') allowedMimes = [...ALLOWED_MIME_TYPES.DOCUMENT, ...ALLOWED_MIME_TYPES.PDF];
    else allowedMimes = [...ALLOWED_MIME_TYPES.VIDEO, ...ALLOWED_MIME_TYPES.DOCUMENT, ...ALLOWED_MIME_TYPES.PDF];

    const validation = await validateUploadedFile(file, {
      allowedMimeTypes: allowedMimes,
      maxSizeBytes: MAX_SIZE,
    });

    if (!validation.valid) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (!verifyMimeByMagic(buffer, file.type.toLowerCase())) {
      return NextResponse.json({ success: false, message: "File contents do not match extension" }, { status: 400 });
    }

    const isVideo = contentType === 'VIDEO';

    // Build destination path
    const subDir = isVideo ? 'videos' : 'docs';
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'elearning', courseId, subDir);

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Unique filename
    const safeName = generateSafeFilename(file.name, isVideo ? 'video' : 'doc');
    const filePath = `/uploads/elearning/${courseId}/${subDir}/${safeName}`;
    const absPath = join(process.cwd(), 'public', filePath);

    await writeFile(absPath, buffer);

    return NextResponse.json({
      success: true,
      filePath,
      fileName: safeName,
      fileSize: file.size,
      message: 'File uploaded successfully',
    });
  } catch (e: any) {
    console.error('Upload error:', e);
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
