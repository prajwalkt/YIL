import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "../../../library/db";
import { getUserFromRequest, requireRole } from "../../../library/auth";
import { promises as fs } from 'fs';
import path from 'path';

async function ensureTable(pool: any) {
  const result = await pool.request().query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'InteractiveManuals'
  `);
  if (result.recordset.length === 0) {
    await pool.request().query(`
      CREATE TABLE InteractiveManuals (
          ManualID INT IDENTITY(1,1) PRIMARY KEY,
          CourseID INT NULL,
          Title NVARCHAR(200),
          Description NVARCHAR(500),
          FilePath NVARCHAR(500),
          IsActive BIT DEFAULT 1,
          CreatedAt DATETIME DEFAULT GETDATE()
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

    const result = await pool.request().query(`
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
    const formData = await request.formData();
    const title = formData.get("title")?.toString();
    const description = formData.get("description")?.toString() || "";
    const courseId = formData.get("courseId")?.toString();
    const file = formData.get("file") as File | null;

    if (!title || !file) {
      return NextResponse.json({ success: false, message: "Title and File are required" }, { status: 400 });
    }

    const pool = await getConnection();
    await ensureTable(pool);

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeFilename = Date.now() + "_" + file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    
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

    await pool.request()
      .input("CourseID", courseId ? Number(courseId) : null)
      .input("Title", title)
      .input("Description", description)
      .input("FilePath", dbPath)
      .query(`
        INSERT INTO InteractiveManuals (CourseID, Title, Description, FilePath)
        VALUES (@CourseID, @Title, @Description, @FilePath)
      `);

    return NextResponse.json({ success: true, message: "Manual uploaded successfully" });
  } catch (error: any) {
    console.error('Error uploading manual:', error);
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}
