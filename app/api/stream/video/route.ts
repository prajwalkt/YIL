import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '../../../library/auth';

// Vercel serverless functions cannot read files from public/ at runtime, and their
// filesystem is ephemeral. Legacy /uploads/elearning/... videos are deployed as static
// assets (served by the CDN with Range support); new uploads live in Supabase Storage.
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, message: 'Auth required' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) return NextResponse.json({ success: false, message: 'File parameter required' }, { status: 400 });

    // Validate path to prevent directory traversal
    const isLegacyStatic = file.startsWith('/uploads/elearning/');
    const isSupabaseKey = file.startsWith('elearning/');
    if (file.includes('..') || (!isLegacyStatic && !isSupabaseKey)) {
      return NextResponse.json({ success: false, message: 'Invalid file path' }, { status: 400 });
    }

    if (isLegacyStatic) {
      return NextResponse.redirect(new URL(encodeURI(file), request.url), 302);
    }

    const { getPresignedDownloadUrl } = await import('../../../library/supabaseStorage');
    const signedUrl = await getPresignedDownloadUrl(file, 3600);
    return NextResponse.redirect(signedUrl, 302);
  } catch (error) {
    console.error('Video streaming error', error);
    return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 });
  }
}
