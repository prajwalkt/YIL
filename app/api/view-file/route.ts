import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../library/auth';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    // Allow Admin, Finance, and TM to view files
    if (!requireRole(user, 'ADMIN', 'FINANCE', 'TM')) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Unauthorized access' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedPath = searchParams.get('path');

    if (!requestedPath || !requestedPath.startsWith('/private/')) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Invalid or missing file path' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Construct the absolute path
    const absolutePath = path.join(/*turbopackIgnore: true*/ process.cwd(), requestedPath);

    // Security check: ensure the resolved path stays within the private directory
    if (!absolutePath.startsWith(path.join(/*turbopackIgnore: true*/ process.cwd(), 'private'))) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'Directory traversal detected' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!fs.existsSync(absolutePath)) {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'File not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fileBuffer = fs.readFileSync(absolutePath);
    
    // Determine content type based on extension
    const ext = path.extname(absolutePath).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${path.basename(absolutePath)}"`,
      },
    });
  } catch (error) {
    console.error('File viewer error:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
