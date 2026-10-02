import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { getUserFromRequest } from '../../library/auth';
import { checkRateLimit, getClientIP } from '../../library/rateLimiter';
import { validateUploadedFile, ALLOWED_MIME_TYPES, generateSafeFilename } from '../../library/fileUpload';

export async function POST(req: NextRequest) {
  // Auth check: must be authenticated to upload payment proofs
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Rate limit uploads
  const ip = getClientIP(req);
  const rateCheck = checkRateLimit({ context: 'upload', identifier: ip, maxRequests: 10, windowMs: 60 * 60 * 1000 });
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many uploads. Please wait before trying again.' }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userName = (formData.get('userName') as string) || 'Anonymous';

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });


    
    const validation = await validateUploadedFile(file, {
      allowedMimeTypes: ALLOWED_MIME_TYPES.PAYMENT_PROOF,
      maxSizeBytes: 5 * 1024 * 1024,
      allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
    });

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = generateSafeFilename(file.name, `Receipt_${userName}`);

    // --- SUPABASE FILE SYSTEM UPLOAD ---
    let useSupabase = true;
    let r2Key = `uploads/${safeName}`; // Keep legacy prefix for compatibility
    try {
      const { uploadToSupabase } = await import('../../library/supabaseStorage');
      await uploadToSupabase(r2Key, buffer, file.type);
    } catch (r2Error) {
      console.warn("Supabase Upload skipped or failed, using local only.", r2Error);
      useSupabase = false;
    }

    // --- LOCAL FILE SYSTEM UPLOAD FOR OPTION 1 / REFERENCE ---
    const fs = await import('fs');
    const path = await import('path');
    
    // Ensure public/uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Write file locally
    const filePath = path.join(uploadDir, safeName);
    fs.writeFileSync(filePath, buffer);
    
    // The "fileId" can just be the relative URL for the browser to access
    // This allows it to work from the local 'public' folder transparently during migration
    const fileId = `/uploads/${safeName}`;

    return NextResponse.json({ success: true, fileId });

  } catch (error: any) {
    console.error("Critical Upload Error:", error.response?.data || error.message);
    
    // If it still fails with 403, we need to check the "Sharing" setting manually
    return NextResponse.json({ 
      error: "Quota/Permission Denied", 
      details: "Ensure the folder is shared with 'Editor' access to the Service Account." 
    }, { status: 500 });
  }
}