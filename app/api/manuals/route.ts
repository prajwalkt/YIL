import { NextRequest, NextResponse } from "next/server";
import { getConnection } from '../../library/db';
import { getUserFromRequest } from '../../library/auth';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);

  try {
    const pool = await getConnection();

    if (!user) {
      // Public access: return only manuals without CourseID (publicly available)
      const publicResult = await pool.request().query(`
        SELECT m.*, c.Title as CourseName 
        FROM InteractiveManuals m
        LEFT JOIN LMS_Courses c ON m.CourseID = c.CourseID
        WHERE m.IsActive = 1 AND m.CourseID IS NULL
        ORDER BY m.CreatedAt DESC
      `);
      return NextResponse.json({ success: true, manuals: publicResult.recordset, isAuthenticated: false });
    }

    // Authenticated: return manuals for enrolled courses + public manuals
    const result = await pool.request()
      .input('UserID', user.userId)
      .query(`
        SELECT DISTINCT m.*, c.Title as CourseName 
        FROM InteractiveManuals m
        LEFT JOIN LMS_Courses c ON m.CourseID = c.CourseID
        WHERE m.IsActive = 1
          AND (
            m.CourseID IS NULL  -- public manuals
            OR EXISTS (
              SELECT 1 FROM Enrollments e 
              WHERE e.CourseID = m.CourseID 
                AND e.StudentID = @UserID
                AND e.Status IN ('ENROLLED','IN_PROGRESS','COMPLETED')
            )
          )
        ORDER BY m.CreatedAt DESC
      `);

    return NextResponse.json({ success: true, manuals: result.recordset, isAuthenticated: true });
  } catch (error: any) {
    console.error('Manuals GET error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
