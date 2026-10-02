import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../../../library/auth';
import { getPresignedUploadPost } from '../../../../../library/r2Storage';
import { generateSafeFilename } from '../../../../../library/fileUpload';

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const { filename, contentType, courseId, fileType } = await request.json();
    
    if (!filename || !courseId) {
      return NextResponse.json({ success: false, message: 'Filename and courseId required' }, { status: 400 });
    }

    const isVideo = fileType === 'VIDEO';
    const subDir = isVideo ? 'videos' : 'docs';
    const safeName = generateSafeFilename(filename, isVideo ? 'video' : 'doc');
    
    const r2Key = `uploads/elearning/${courseId}/${subDir}/${safeName}`;
    const filePath = `/${r2Key}`;

    // Get presigned POST
    const postData = await getPresignedUploadPost(r2Key, contentType, 500 * 1024 * 1024);

    return NextResponse.json({
      success: true,
      usePresigned: true,
      postData,
      filePath,
      fileName: safeName
    });
  } catch (error: any) {
    console.error('Presign error:', error);
    // If credentials aren't configured or R2 is down, fallback
    return NextResponse.json({ success: true, usePresigned: false });
  }
}
