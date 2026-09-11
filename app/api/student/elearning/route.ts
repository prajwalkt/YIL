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
    const enrollments = await pool.request()
      .input('UserID', user!.userId)
      .query(`
        SELECT 
          e.EnrollmentID, e.CourseID, e.Status as EnrollmentStatus, e.ProgressPercent,
          c.Title as CourseTitle, c.Description as CourseDescription, c.ThumbnailPath,
          c.Duration, c.Code as CourseCode,
          ISNULL(r.TrainingMode, c.Mode) as Mode
        FROM Enrollments e
        JOIN LMS_Courses c ON e.CourseID = c.CourseID
        LEFT JOIN Registrations r ON e.RegistrationID = r.Id
        WHERE e.StudentID = @UserID AND e.Status != 'DROPPED'
        ORDER BY e.EnrolledAt DESC
      `);

    if (enrollments.recordset.length === 0) {
      return NextResponse.json({ success: true, courses: [] });
    }

    // For each enrollment, get E-Learning content and progress
    const courses = [];
    for (const enrollment of enrollments.recordset) {
      // Get content for this course
      let content: any[] = [];
      try {
        const contentResult = await pool.request()
          .input('CourseID', enrollment.CourseID)
          .input('UserID', user!.userId)
          .query(`
            SELECT ec.ContentID, ec.Title, ec.ContentType, ec.FilePath, ec.DurationSec,
                   ec.SortOrder, ec.IsRequired, ec.Description, ec.ThumbnailPath,
                   ISNULL(ep.WatchedSeconds, 0) as WatchedSeconds,
                   ISNULL(ep.IsCompleted, 0) as IsCompleted,
                   ISNULL(ep.LastPosition, 0) as LastPosition
            FROM ELearningContent ec
            LEFT JOIN ELearningProgress ep ON ep.ContentID = ec.ContentID AND ep.UserID = @UserID
            WHERE ec.CourseID = @CourseID
            ORDER BY ec.SortOrder, ec.ContentID
          `);
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
    await pool.request()
      .input('UserID', user!.userId)
      .input('ContentID', Number(contentId))
      .input('WatchedSeconds', watchedSeconds || 0)
      .input('TotalSeconds', totalSeconds || 0)
      .input('IsCompleted', isCompleted ? 1 : 0)
      .input('LastPosition', lastPosition || 0)
      .input('CompletedAt', isCompleted ? new Date() : null)
      .query(`
        IF EXISTS (SELECT 1 FROM ELearningProgress WHERE UserID = @UserID AND ContentID = @ContentID)
          UPDATE ELearningProgress
          SET WatchedSeconds = @WatchedSeconds, TotalSeconds = @TotalSeconds,
              IsCompleted = CASE WHEN @IsCompleted = 1 THEN 1 ELSE IsCompleted END,
              LastPosition = @LastPosition,
              CompletedAt = CASE WHEN @IsCompleted = 1 AND CompletedAt IS NULL THEN GETDATE() ELSE CompletedAt END,
              UpdatedAt = GETDATE()
          WHERE UserID = @UserID AND ContentID = @ContentID
        ELSE
          INSERT INTO ELearningProgress (UserID, ContentID, WatchedSeconds, TotalSeconds, IsCompleted, LastPosition, CompletedAt)
          VALUES (@UserID, @ContentID, @WatchedSeconds, @TotalSeconds, @IsCompleted, @LastPosition, CASE WHEN @IsCompleted = 1 THEN GETDATE() ELSE NULL END)
      `);

    // Recalculate course completion progress
    try {
      const contentInfo = await pool.request()
        .input('ContentID', Number(contentId))
        .query(`SELECT CourseID FROM ELearningContent WHERE ContentID = @ContentID`);

      if (contentInfo.recordset.length > 0) {
        const courseId = contentInfo.recordset[0].CourseID;

        const progressCalc = await pool.request()
          .input('UserID', user!.userId)
          .input('CourseID', courseId)
          .query(`
            SELECT 
              COUNT(*) as Total,
              SUM(CASE WHEN ISNULL(ep.IsCompleted, 0) = 1 THEN 1 ELSE 0 END) as Completed
            FROM ELearningContent ec
            LEFT JOIN ELearningProgress ep ON ep.ContentID = ec.ContentID AND ep.UserID = @UserID
            WHERE ec.CourseID = @CourseID AND ec.IsRequired = 1
          `);

        if (progressCalc.recordset.length > 0) {
          const { Total, Completed } = progressCalc.recordset[0];
          const progressPct = Total > 0 ? Math.round((Completed / Total) * 100) : 0;

          await pool.request()
            .input('UserID', user!.userId)
            .input('CourseID', courseId)
            .input('Progress', progressPct)
            .input('Status', progressPct >= 100 ? 'COMPLETED' : 'IN_PROGRESS')
            .query(`
              UPDATE Enrollments
              SET ProgressPercent = @Progress,
                  Status = @Status,
                  CompletedAt = CASE WHEN @Status = 'COMPLETED' AND CompletedAt IS NULL THEN GETDATE() ELSE CompletedAt END
              WHERE StudentID = @UserID AND CourseID = @CourseID
            `);
        }
      }
    } catch { /* Progress recalculation is best-effort */ }

    return NextResponse.json({ success: true, message: 'Progress saved' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
