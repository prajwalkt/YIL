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

    // Resolve path (Local FS, Google Drive, or Supabase)
    const { resolveFileAccess, getFileStreamFromSupabase } = await import('../../library/supabaseStorage');
    const resolved = await resolveFileAccess(requestedPath);

    if (resolved.type === 'unknown') {
      return new NextResponse(
        JSON.stringify({ success: false, message: 'File not found or invalid' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (resolved.type === 'supabase') {
      try {
        const stream = await getFileStreamFromSupabase(resolved.key!);
        const ext = path.extname(resolved.key!).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.pdf') contentType = 'application/pdf';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.mp4') contentType = 'video/mp4';

        // @ts-ignore - node stream to web stream
        return new NextResponse(stream, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${path.basename(resolved.key!)}"`,
          },
        });
      } catch (e) {
        console.error("Supabase file fetch error:", e);
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Error retrieving from cloud storage' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    if (resolved.type === 'local' && resolved.path) {
      // Local fallback
      const absolutePath = resolved.path;

      if (!fs.existsSync(absolutePath)) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'File not found locally' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const fileBuffer = fs.readFileSync(absolutePath);
      
      const ext = path.extname(absolutePath).toLowerCase();
      let contentType = 'application/octet-stream';
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.mp4') contentType = 'video/mp4';

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${path.basename(absolutePath)}"`,
        },
      });
    }

    return new NextResponse(
      JSON.stringify({ success: false, message: 'Unsupported file storage backend' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('File viewer error:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
