import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userName = (formData.get('userName') as string) || 'Anonymous';

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });
    const buffer = Buffer.from(await file.arrayBuffer());

    // --- STEP 1: UPLOAD & ATTACH TO PARENT ---
    const response = await drive.files.create({
      requestBody: {
        name: `Receipt_${userName}_${Date.now()}`,
        parents: ['1xsCzvVY6aO88ILGmo5hdAxI2CtbGbFUB'], 
      },
      media: {
        mimeType: file.type,
        body: Readable.from(buffer),
      },
      // This allows the "Guest" Service Account to use your Folder's space
      supportsAllDrives: true, 
      useContentInsufficientQuota: true, 
      fields: 'id, owners',
    } as any);

    const fileId = response.data.id;

    // --- STEP 2: IMMEDIATELY GRANT YOU PERMISSION ---
    // This ensures you can see and manage the file even if the robot "owns" it
    await drive.permissions.create({
      fileId: fileId!,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: 'prajwalkt.official@gmail.com', // Your Gmail
      },
      supportsAllDrives: true,
    });

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