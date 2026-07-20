-- ============================================================
-- Phase 2 Migration: TM Confirmation + Slot Selection
-- Run against LMS_DB
-- ============================================================

USE LMS_DB;

-- Add TMConfirmed columns to TrainingCalendar
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('TrainingCalendar') AND name = 'TMConfirmed')
BEGIN
  ALTER TABLE TrainingCalendar 
    ADD TMConfirmed BIT DEFAULT 0,
        TMConfirmedAt DATETIME NULL,
        TMConfirmedBy INT NULL;
  PRINT 'Added TMConfirmed columns to TrainingCalendar';
END

-- Add SelectedSlotID to Registrations
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Registrations') AND name = 'SelectedSlotID')
BEGIN
  ALTER TABLE Registrations ADD SelectedSlotID INT NULL;
  PRINT 'Added SelectedSlotID to Registrations';
END

-- Add ColorStatus computed column helper view
IF OBJECT_ID('CalendarColorView', 'V') IS NOT NULL DROP VIEW CalendarColorView;
GO
CREATE VIEW CalendarColorView AS
SELECT 
  tc.CalendarID,
  tc.Title,
  tc.TrainingType,
  tc.StartDate,
  tc.EndDate,
  tc.TrainerName,
  tc.Location,
  tc.MaxParticipants,
  tc.CurrentEnrolled,
  tc.Status,
  ISNULL(tc.TMConfirmed, 0) as TMConfirmed,
  CASE 
    WHEN tc.EndDate < CAST(GETDATE() AS DATE) THEN 'COMPLETED'
    WHEN ISNULL(tc.TMConfirmed, 0) = 1 THEN 'CONFIRMED'
    WHEN EXISTS (
      SELECT 1 FROM Registrations r 
      WHERE r.SelectedSlotID = tc.CalendarID 
        AND r.Status IN ('FINANCE_APPROVED', 'TM_APPROVED')
    ) THEN 'APPROVAL_ONGOING'
    WHEN EXISTS (
      SELECT 1 FROM Registrations r 
      WHERE r.SelectedSlotID = tc.CalendarID 
        AND r.Status = 'PENDING'
    ) THEN 'PAYMENT_PENDING'
    ELSE 'OPEN'
  END as ColorStatus
FROM TrainingCalendar tc;
GO

PRINT '=== Phase 2 Migration Complete ===';
