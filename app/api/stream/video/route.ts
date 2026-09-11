import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../library/auth';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, message: 'Auth required' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');
    
    if (!file) return NextResponse.json({ success: false, message: 'File parameter required' }, { status: 400 });

    // Validate path to prevent directory traversal
    if (file.includes('..') || !file.startsWith('/uploads/elearning/')) {
      return NextResponse.json({ success: false, message: 'Invalid file path' }, { status: 400 });
    }

    const absPath = join(process.cwd(), 'public', file);
    
    // In a real application we would check here if the user has an active enrollment for the course
    // which can be parsed from the file path /uploads/elearning/[courseId]/videos/[filename]
    // For now we rely on the session check.

    const stat = statSync(absPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const stream = createReadStream(absPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      };
      
      return new NextResponse(stream as any, { status: 206, headers: head as any });
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      };
      const stream = createReadStream(absPath);
      return new NextResponse(stream as any, { status: 200, headers: head as any });
    }
  } catch (error) {
    console.error('Video streaming error', error);
    return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 });
  }
}
