import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    const req = pool.request();
    req.input('TrainerUserID', user!.userId);

    // Get trainer profile details
    let profile = null;
    try {
      const profileResult = await req.query(`SELECT * FROM TrainerProfiles WHERE UserID = @TrainerUserID`);
      profile = profileResult.recordset[0] || null;
    } catch (e) { console.error("Error fetching trainer profile", e); }
    
    // Get upcoming schedule
    let upcomingSchedule: any[] = [];
    try {
      const scheduleResult = await req.query(`
        SELECT tc.*, c.Title as CourseTitle 
        FROM TrainingCalendar tc
        LEFT JOIN LMS_Courses c ON tc.CourseID = c.CourseID
        WHERE tc.TrainerID = @TrainerUserID AND tc.StartDate >= CAST(GETDATE() AS DATE)
        ORDER BY tc.StartDate ASC
      `);
      upcomingSchedule = scheduleResult.recordset;
    } catch (e) { console.error("Error fetching upcoming schedule", e); }

    // Get past schedule
    let pastSchedule: any[] = [];
    try {
      const pastResult = await req.query(`
        SELECT tc.*, c.Title as CourseTitle 
        FROM TrainingCalendar tc
        LEFT JOIN LMS_Courses c ON tc.CourseID = c.CourseID
        WHERE tc.TrainerID = @TrainerUserID AND tc.StartDate < CAST(GETDATE() AS DATE)
        ORDER BY tc.StartDate DESC
      `);
      pastSchedule = pastResult.recordset;
    } catch (e) { console.error("Error fetching past schedule", e); }

    // Get feedback summary
    let feedbackSummary = { AvgTrainerScore: 0, TotalFeedback: 0 };
    try {
      const feedbackResult = await req.query(`
        SELECT 
          AVG(CAST(TrainerScore AS FLOAT)) as AvgTrainerScore,
          COUNT(*) as TotalFeedback
        FROM Feedback 
        WHERE TrainerID = @TrainerUserID
      `);
      if (feedbackResult.recordset.length > 0) {
        feedbackSummary = feedbackResult.recordset[0];
      }
    } catch (e) { console.error("Error fetching feedback summary", e); }

    // Get basic stats
    let stats = { TotalStudents: 0, TodaySessions: 0, PendingAssessments: 0 };
    try {
      const statsResult = await req.query(`
        SELECT 
          (SELECT COUNT(*) FROM Enrollments e JOIN TrainingCalendar tc ON e.CalendarID = tc.CalendarID WHERE tc.TrainerID = @TrainerUserID AND e.Status != 'DROPPED') as TotalStudents,
          (SELECT COUNT(*) FROM TrainingCalendar WHERE TrainerID = @TrainerUserID AND CAST(StartDate AS DATE) <= CAST(GETDATE() AS DATE) AND CAST(EndDate AS DATE) >= CAST(GETDATE() AS DATE)) as TodaySessions,
          (SELECT COUNT(*) FROM Enrollments e JOIN TrainingCalendar tc ON e.CalendarID = tc.CalendarID WHERE tc.TrainerID = @TrainerUserID AND e.Status = 'ENROLLED' AND CAST(tc.EndDate AS DATE) < CAST(GETDATE() AS DATE)) as PendingAssessments
      `);
      if (statsResult.recordset.length > 0) stats = statsResult.recordset[0];
    } catch (e) { console.error("Error fetching trainer stats", e); }

    return NextResponse.json({ 
      success: true, 
      profile,
      upcomingSchedule,
      pastSchedule,
      feedbackSummary,
      stats
    });
  } catch (e: any) {
    console.error("Trainer Dashboard Error:", e);
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
