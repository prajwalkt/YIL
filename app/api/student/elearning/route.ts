import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';

// GET — Get E-Learning content for enrolled courses (Student & Affiliate)
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'STUDENT', 'AFFILIATE', 'ADMIN')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const pool = await getConnection();

    // Get E-Learning enrolled courses for this user
    const enrollments = await pool.query(`
        SELECT 
          e.EnrollmentID, e.CourseID, e.Status as EnrollmentStatus, e.ProgressPercent,
          c.Title as CourseTitle, c.Description as CourseDescription, c.ThumbnailPath,
          c.Duration, c.Code as CourseCode,
          COALESCE(r.TrainingMode, c.Mode) as Mode
        FROM Enrollments e
        JOIN LMS_Courses c ON e.CourseID = c.CourseID
        LEFT JOIN Registrations r ON e.RegistrationID = r.Id
        WHERE e.StudentID = $1 AND e.Status != 'DROPPED'
        ORDER BY e.EnrolledAt DESC
      `, [user!.userId]);

    if (enrollments.recordset.length === 0) {
      return NextResponse.json({ success: true, courses: [] });
    }

    // For each enrollment, get E-Learning content and progress
    const courses = [];
    for (const enrollment of enrollments.recordset) {
      // Get content for this course
      let content: any[] = [];
      try {
        const contentResult = await pool.query(`
            SELECT ec.ContentID, ec.Title, ec.ContentType, ec.FilePath, ec.DurationSec,
                   ec.SortOrder, ec.IsRequired, ec.Description, ec.ThumbnailPath,
                   COALESCE(ep.WatchedSeconds, 0) as WatchedSeconds,
                   COALESCE(ep.IsCompleted, 0) as IsCompleted,
                   COALESCE(ep.LastPosition, 0) as LastPosition
            FROM ELearningContent ec
            LEFT JOIN ELearningProgress ep ON ep.ContentID = ec.ContentID AND ep.UserID = $1
            WHERE ec.CourseID = $2
            ORDER BY ec.SortOrder, ec.ContentID
          `, [user!.userId, enrollment.CourseID]);
        content = contentResult.recordset;
      } catch {
        // Table may not exist yet — return empty content
        content = [];
      }

      // Inject Synthesia modules for specific courses and E-Learning mode
      const isTargetCourse = enrollment.CourseTitle === 'VPOP – CENTUM VP DCS Operation' || 
                             enrollment.CourseTitle === 'VPOP - CENTUM VP DCS Operation' ||
                             enrollment.CourseTitle === 'CENTUM VP TEST';
      const isELearning = enrollment.Mode === 'E-Learning (Self-Paced)' || enrollment.Mode === 'E-Learning';
      
      if (isTargetCourse && isELearning) {
        content.push(
          { ContentID: 9001, Title: 'Module-1', ContentType: 'SYNTHESIA', FilePath: 'https://share.synthesia.io/9ea2428d-df38-4674-a289-9f6e63897e18', DurationSec: 0, SortOrder: 9001, IsRequired: 0, Description: 'Synthesia Video', IsCompleted: 0, LastPosition: 0 },
          { ContentID: 9002, Title: 'Module-2', ContentType: 'SYNTHESIA', FilePath: 'https://share.synthesia.io/d833a527-9586-4985-85f6-11029a7c434d', DurationSec: 0, SortOrder: 9002, IsRequired: 0, Description: 'Synthesia Video', IsCompleted: 0, LastPosition: 0 },
          { ContentID: 9003, Title: 'Module-3', ContentType: 'SYNTHESIA', FilePath: 'https://share.synthesia.io/d52fd2fb-b3a0-4ac7-92a8-446fddcf2e8a', DurationSec: 0, SortOrder: 9003, IsRequired: 0, Description: 'Synthesia Video', IsCompleted: 0, LastPosition: 0 }
        );
      }

      // Calculate overall progress from content completion
      const required = content.filter(c => c.IsRequired);
      const completed = required.filter(c => c.IsCompleted);
      const contentProgress = required.length > 0 ? Math.round((completed.length / required.length) * 100) : 0;

      courses.push({
        ...enrollment,
        content,
        contentProgress,
        totalContent: content.length,
        completedContent: content.filter(c => c.IsCompleted).length,
      });
    }

    return NextResponse.json({ success: true, courses });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

// POST — Save video watch progress
export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'STUDENT', 'AFFILIATE')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const body = await parseAndSanitizeBody(request);
    const { contentId, watchedSeconds, totalSeconds, isCompleted, lastPosition } = body;

    if (!contentId) {
      return NextResponse.json({ success: false, message: 'contentId is required' }, { status: 400 });
    }

    const pool = await getConnection();

    // Upsert progress record
    await pool.query(`
        IF EXISTS (SELECT 1 FROM ELearningProgress WHERE UserID = $1 AND ContentID = $2)
          UPDATE ELearningProgress
          SET WatchedSeconds = $3, TotalSeconds = $4,
              IsCompleted = CASE WHEN $5 = 1 THEN 1 ELSE IsCompleted END,
              LastPosition = $6,
              CompletedAt = CASE WHEN $7 = 1 AND CompletedAt IS NULL THEN CURRENT_TIMESTAMP ELSE CompletedAt END,
              UpdatedAt = CURRENT_TIMESTAMP
          WHERE UserID = $8 AND ContentID = $9
        ELSE
          INSERT INTO ELearningProgress (UserID, ContentID, WatchedSeconds, TotalSeconds, IsCompleted, LastPosition, CompletedAt)
          VALUES ($10, $11, $12, $13, $14, $15, CASE WHEN $16 = 1 THEN CURRENT_TIMESTAMP ELSE NULL END)
      `, [user!.userId, Number(contentId), watchedSeconds || 0, totalSeconds || 0, isCompleted ? 1 : 0, lastPosition || 0, isCompleted ? 1 : 0, user!.userId, Number(contentId), user!.userId, Number(contentId), watchedSeconds || 0, totalSeconds || 0, isCompleted ? 1 : 0, lastPosition || 0, isCompleted ? 1 : 0]);

    // Recalculate course completion progress
    try {
      const contentInfo = await pool.query(`SELECT CourseID FROM ELearningContent WHERE ContentID = $1`, [Number(contentId)]);

      if (contentInfo.recordset.length > 0) {
        const courseId = contentInfo.recordset[0].CourseID;

        const progressCalc = await pool.query(`
            SELECT 
              COUNT(*) as Total,
              SUM(CASE WHEN COALESCE(ep.IsCompleted, 0) = 1 THEN 1 ELSE 0 END) as Completed
            FROM ELearningContent ec
            LEFT JOIN ELearningProgress ep ON ep.ContentID = ec.ContentID AND ep.UserID = $1
            WHERE ec.CourseID = $2 AND ec.IsRequired = 1
          `, [user!.userId, courseId]);

        if (progressCalc.recordset.length > 0) {
          const { Total, Completed } = progressCalc.recordset[0];
          const progressPct = Total > 0 ? Math.round((Completed / Total) * 100) : 0;

          await pool.query(`
              UPDATE Enrollments
              SET ProgressPercent = $1,
                  Status = $2,
                  CompletedAt = CASE WHEN $3 = 'COMPLETED' AND CompletedAt IS NULL THEN CURRENT_TIMESTAMP ELSE CompletedAt END
              WHERE StudentID = $4 AND CourseID = $5
            `, [progressPct, progressPct >= 100 ? 'COMPLETED' : 'IN_PROGRESS', progressPct >= 100 ? 'COMPLETED' : 'IN_PROGRESS', user!.userId, courseId]);
        }
      }
    } catch { /* Progress recalculation is best-effort */ }

    return NextResponse.json({ success: true, message: 'Progress saved' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
