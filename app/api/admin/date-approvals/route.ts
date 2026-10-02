import { NextRequest, NextResponse } from "next/server";
import { getConnection } from "../../../library/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        r.Id, r.Name, r.Email, r.Course, r.TrainingMode, 
        r.OriginalStartDate, r.OriginalEndDate,
        r.FinalStartDate, r.FinalEndDate,
        r.DateApprovalStatus, r.TMRemarks
      FROM Registrations r
      WHERE r.DateApprovalStatus IN ('PENDING', 'APPROVED', 'REJECTED')
      ORDER BY 
        CASE WHEN r.DateApprovalStatus = 'PENDING' THEN 1 ELSE 2 END,
        r.Id DESC
    `);
    
    return NextResponse.json({ success: true, requests: result.recordset });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch date requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { registrationId, action, finalStartDate, finalEndDate, remarks, tmUserId } = body;
    
    if (!registrationId || !action) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    const pool = await getConnection();
    
    let newStatus = 'PENDING';
    if (action === 'APPROVE' || action === 'MODIFY') newStatus = 'APPROVED';
    if (action === 'REJECT') newStatus = 'REJECTED';

    if (action === 'MODIFY' && finalStartDate && finalEndDate) {
      // Allow flexible date allocation, bypassing strict duration check
    }



    const updateResult = await pool.request()
      .input('Id', registrationId)
      .input('Status', newStatus)
      .input('FinalStart', finalStartDate || null)
      .input('FinalEnd', finalEndDate || null)
      .input('Remarks', remarks || null)
      .input('TMId', tmUserId || null)
      .query(`
        UPDATE Registrations 
        SET 
          DateApprovalStatus = @Status,
          FinalStartDate = CASE WHEN @Status = 'APPROVED' THEN @FinalStart ELSE NULL END,
          FinalEndDate = CASE WHEN @Status = 'APPROVED' THEN @FinalEnd ELSE NULL END,
          TMRemarks = @Remarks,
          TMReviewedBy = @TMId,
          TMReviewDate = GETDATE()
        WHERE Id = @Id
      `);
      
    if (updateResult.rowsAffected[0] === 0) {
      return NextResponse.json({ success: false, message: 'Registration not found or no changes made' }, { status: 404 });
    }

    if (action === 'APPROVE' || action === 'MODIFY') {
      const regRes = await pool.request().input('Id', registrationId).query(`SELECT SelectedSlotID FROM Registrations WHERE Id = @Id`);
      if (regRes.recordset.length > 0 && regRes.recordset[0].SelectedSlotID) {
        await pool.request()
          .input('SlotID', regRes.recordset[0].SelectedSlotID)
          .input('FinalStart', finalStartDate)
          .input('FinalEnd', finalEndDate)
          .query(`UPDATE TrainingCalendar SET StartDate = @FinalStart, EndDate = @FinalEnd WHERE CalendarID = @SlotID`);
      }
    }
      
    // Create new calendar entry if approved and none exists (simplified logic for now)
    // Normally we check if a matching batch exists and link it to SelectedSlotID
    
    return NextResponse.json({ success: true, message: 'Date request updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to update date request' }, { status: 500 });
  }
}
