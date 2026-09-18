import { NextRequest, NextResponse } from "next/server";
import { parseAndSanitizeFormData } from "../../../library/validation";
import { getConnection } from "../../../library/db";
import { getUserFromRequest, requireRole } from "../../../library/auth";
import { promises as fs } from 'fs';
import path from 'path';
import { validateUploadedFile, generateSafeFilename, ALLOWED_MIME_TYPES, verifyMimeByMagic } from "../../../library/fileUpload";

async function ensureTable(pool: any) {
  const result = await pool.query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'InteractiveManuals'
  `);
  if (result.recordset.length === 0) {
    await pool.query(`
      CREATE TABLE InteractiveManuals (
          ManualID INT IDENTITY(1,1) PRIMARY KEY,
          CourseID INT NULL,
          Title NVARCHAR(200),
          Description NVARCHAR(500),
          FilePath NVARCHAR(500),
          IsActive BIT DEFAULT 1,
          CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pool = await getConnection();
    await ensureTable(pool);

    const result = await pool.query(`
      SELECT m.*, c.Title as CourseName 
      FROM InteractiveManuals m
      LEFT JOIN LMS_Courses c ON m.CourseID = c.CourseID
      ORDER BY m.CreatedAt DESC
    `);

    return NextResponse.json({ success: true, manuals: result.recordset });
  } catch (error: any) {
    console.error('Error fetching manuals:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await parseAndSanitizeFormData(request);
    const title = formData.get("title")?.toString();
    const description = formData.get("description")?.toString() || "";
    const courseId = formData.get("courseId")?.toString();
    const file = formData.get("file") as File | null;

    if (!title || !file) {
      return NextResponse.json({ success: false, message: "Title and File are required" }, { status: 400 });
    }

    const pool = await getConnection();
    await ensureTable(pool);

    const validation = await validateUploadedFile(file, {
      allowedMimeTypes: [...ALLOWED_MIME_TYPES.DOCUMENT, ...ALLOWED_MIME_TYPES.PDF, 'application/zip'],
      maxSizeBytes: 50 * 1024 * 1024, // 50MB
    });

    if (!validation.valid) {
      return NextResponse.json({ success: false, message: validation.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!verifyMimeByMagic(buffer, file.type.toLowerCase())) {
      return NextResponse.json({ success: false, message: "File contents do not match extension" }, { status: 400 });
    }

    const safeFilename = generateSafeFilename(file.name, 'manual');
    
    // Create public directory for manuals (SCORM or PDF)
    const uploadDir = path.join(process.cwd(), 'public', 'manuals_repo');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const destPath = path.join(uploadDir, safeFilename);
    await fs.writeFile(destPath, buffer);
    const dbPath = `/manuals_repo/${safeFilename}`;

    await pool.query(`
        INSERT INTO InteractiveManuals (CourseID, Title, Description, FilePath)
        VALUES ($1, $2, $3, $4)
      `, [courseId ? Number(courseId) : null, title, description, dbPath]);

    return NextResponse.json({ success: true, message: "Manual uploaded successfully" });
  } catch (error: any) {
    console.error('Error uploading manual:', error);
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}
