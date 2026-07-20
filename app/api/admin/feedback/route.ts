import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM', 'TRAINER')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const trainerId = searchParams.get('trainerId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let query = `
      SELECT f.*, c.Title as CourseTitle
      FROM Feedback f
      LEFT JOIN LMS_Courses c ON f.CourseID = c.CourseID
      WHERE 1=1
    `;
    const req = pool.request();

    if (courseId) { query += ` AND f.CourseID = @CourseID`; req.input('CourseID', Number(courseId)); }
    if (trainerId) { query += ` AND f.TrainerID = @TrainerID`; req.input('TrainerID', Number(trainerId)); }
    if (dateFrom) { query += ` AND f.TrainingDate >= @DateFrom`; req.input('DateFrom', dateFrom); }
    if (dateTo) { query += ` AND f.TrainingDate <= @DateTo`; req.input('DateTo', dateTo); }

    // Trainer can only see their own feedback
    if (user!.role === 'TRAINER') {
      query += ` AND f.TrainerID = @TrainerUserID`;
      req.input('TrainerUserID', user!.userId);
    }

    query += ` ORDER BY f.SubmittedAt DESC`;
    const result = await req.query(query);

    // Compute averages
    const avgResult = await pool.request().query(`
      SELECT 
        AVG(CAST(OverallScore AS FLOAT)) as AvgOverall,
        AVG(CAST(ContentScore AS FLOAT)) as AvgContent,
        AVG(CAST(TrainerScore AS FLOAT)) as AvgTrainer,
        AVG(CAST(FacilityScore AS FLOAT)) as AvgFacility,
        COUNT(*) as TotalResponses
      FROM Feedback
    `);

    return NextResponse.json({ 
      success: true, 
      feedback: result.recordset,
      analytics: avgResult.recordset[0]
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, message: 'Auth required' }, { status: 401 });

  try {
    const body = await request.json();
    const { participantName, courseId, trainerId, trainerName, overallScore, contentScore, trainerScore, facilityScore, remarks, trainingDate } = body;

    if (!overallScore) return NextResponse.json({ success: false, message: 'Overall score required' }, { status: 400 });

    const pool = await getConnection();
    await pool.request()
      .input('StudentID', user.userId).input('ParticipantName', participantName || `${user.firstName} ${user.lastName}`)
      .input('CourseID', courseId || null).input('TrainerID', trainerId || null)
      .input('TrainerName', trainerName || '').input('OverallScore', Number(overallScore))
      .input('ContentScore', Number(contentScore) || null).input('TrainerScore', Number(trainerScore) || null)
      .input('FacilityScore', Number(facilityScore) || null).input('Remarks', remarks || '')
      .input('TrainingDate', trainingDate || null)
      .query(`INSERT INTO Feedback (StudentID,ParticipantName,CourseID,TrainerID,TrainerName,OverallScore,ContentScore,TrainerScore,FacilityScore,Remarks,TrainingDate) VALUES (@StudentID,@ParticipantName,@CourseID,@TrainerID,@TrainerName,@OverallScore,@ContentScore,@TrainerScore,@FacilityScore,@Remarks,@TrainingDate)`);

    return NextResponse.json({ success: true, message: 'Feedback submitted' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
