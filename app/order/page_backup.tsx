import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { supabase } from '../library/supabase'; // Points to your custom connection file
import stream from 'stream';

// Google Drive Auth
const auth = new google.auth.GoogleAuth({
  keyFile: './service-account.json', 
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const method = formData.get('method') as string;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    // 1. Upload to Google Drive
    const buffer = Buffer.from(await file.arrayBuffer());
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    const driveRes = await drive.files.create({
      requestBody: {
        name: `${method}_${Date.now()}_${file.name}`,
        parents: [process.env.DRIVE_FOLDER_ID!],
      },
      media: {
        mimeType: file.type,
        body: bufferStream,
      },
    });

    const driveFileId = driveRes.data.id;

    // 2. Save record to Supabase
    const { error } = await supabase
      .from('orders') 
      .insert([{
        user_id: formData.get('userId'),
        course_code: formData.get('courseCode'),
        course_name: formData.get('courseName'),
        method: method,
        drive_file_id: driveFileId,
        utr_number: formData.get('utrNumber') || null,
        company_name: formData.get('companyName') || null,
        participants: formData.get('participants') ? Number(formData.get('participants')) : null,
        status: 'pending'
      }]);

    if (error) throw error;

    return NextResponse.json({ success: true, fileId: driveFileId });
  } catch (error: any) {
    console.error("Submission Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}