-- ============================================================
-- Bug #3 Fix Migration: NotificationLog RecipientName
-- Run once against LMS_DB
-- ============================================================

USE LMS_DB;

-- Step 1: Ensure NotificationLog table exists
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NotificationLog' AND xtype='U')
BEGIN
    CREATE TABLE NotificationLog (
        LogID           INT IDENTITY(1,1) PRIMARY KEY,
        UserID          INT NULL,
        Type            NVARCHAR(100) NOT NULL,
        Channel         NVARCHAR(30) NOT NULL,
        Status          NVARCHAR(20) NOT NULL,
        ErrorMessage    NVARCHAR(MAX) NULL,
        MessageContent  NVARCHAR(MAX) NULL,
        RecipientName   NVARCHAR(200) NULL,
        RegistrationID  INT NULL,
        CreatedAt       DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created NotificationLog table';
END

-- Step 2: Add RecipientName column if missing
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('NotificationLog') AND name = 'RecipientName'
)
BEGIN
    ALTER TABLE NotificationLog ADD RecipientName NVARCHAR(200) NULL;
    PRINT 'Added RecipientName column to NotificationLog';
END
ELSE
    PRINT 'RecipientName column already exists';

-- Step 3: Add RegistrationID column for direct linkage
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('NotificationLog') AND name = 'RegistrationID'
)
BEGIN
    ALTER TABLE NotificationLog ADD RegistrationID INT NULL;
    PRINT 'Added RegistrationID column to NotificationLog';
END
ELSE
    PRINT 'RegistrationID column already exists';

-- Step 4: Backfill RecipientName for legacy NULL rows
UPDATE nl
SET nl.RecipientName = r.Name
FROM NotificationLog nl
INNER JOIN (
    SELECT 
        r.LinkedUserID,
        r.Name,
        ROW_NUMBER() OVER (PARTITION BY r.LinkedUserID ORDER BY r.CreatedAt DESC) AS rn
    FROM Registrations r
    WHERE r.LinkedUserID IS NOT NULL AND r.Status = 'APPROVED'
) r ON r.LinkedUserID = nl.UserID AND r.rn = 1
WHERE nl.RecipientName IS NULL AND nl.UserID IS NOT NULL;

DECLARE @updated INT = @@ROWCOUNT;
PRINT CAST(@updated AS NVARCHAR) + ' rows backfilled';

-- Step 5: Verification
SELECT 
    COUNT(*) AS TotalLogs,
    SUM(CASE WHEN RecipientName IS NOT NULL THEN 1 ELSE 0 END) AS LogsWithName,
    SUM(CASE WHEN RecipientName IS NULL THEN 1 ELSE 0 END) AS LogsStillNull
FROM NotificationLog;

PRINT '=== Bug #3 Fix Migration Complete ===';
GO
