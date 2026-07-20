-- =====================================================
-- YTS LMS Security Migration
-- Phase: Security Hardening
-- Date: 2026-07-10
-- Purpose: Add columns for password reset, brute force
--          protection, and session management
-- Run this script ONCE against LMS_DB
-- =====================================================

-- 1. Add Password Reset Token columns to LMS_Users
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'LMS_Users' AND COLUMN_NAME = 'PasswordResetToken')
BEGIN
    ALTER TABLE LMS_Users ADD PasswordResetToken NVARCHAR(64) NULL;
    PRINT 'Added PasswordResetToken column';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'LMS_Users' AND COLUMN_NAME = 'PasswordResetExpiry')
BEGIN
    ALTER TABLE LMS_Users ADD PasswordResetExpiry DATETIME NULL;
    PRINT 'Added PasswordResetExpiry column';
END

-- 2. Ensure FailedLoginAttempts and LockoutUntil exist
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'LMS_Users' AND COLUMN_NAME = 'FailedLoginAttempts')
BEGIN
    ALTER TABLE LMS_Users ADD FailedLoginAttempts INT NOT NULL DEFAULT 0;
    PRINT 'Added FailedLoginAttempts column';
END

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'LMS_Users' AND COLUMN_NAME = 'LockoutUntil')
BEGIN
    ALTER TABLE LMS_Users ADD LockoutUntil DATETIME NULL;
    PRINT 'Added LockoutUntil column';
END

-- 3. Ensure LastLogin column exists
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'LMS_Users' AND COLUMN_NAME = 'LastLogin')
BEGIN
    ALTER TABLE LMS_Users ADD LastLogin DATETIME NULL;
    PRINT 'Added LastLogin column';
END

-- 4. Ensure ActiveSessionToken exists (for single-device enforcement)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'LMS_Users' AND COLUMN_NAME = 'ActiveSessionToken')
BEGIN
    ALTER TABLE LMS_Users ADD ActiveSessionToken NVARCHAR(1000) NULL;
    PRINT 'Added ActiveSessionToken column';
END

-- 5. Ensure MustChangePassword exists
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'LMS_Users' AND COLUMN_NAME = 'MustChangePassword')
BEGIN
    ALTER TABLE LMS_Users ADD MustChangePassword BIT NOT NULL DEFAULT 0;
    PRINT 'Added MustChangePassword column';
END

-- 6. Ensure LoginAttempts table exists
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'LoginAttempts')
BEGIN
    CREATE TABLE LoginAttempts (
        ID BIGINT IDENTITY(1,1) PRIMARY KEY,
        Email NVARCHAR(255) NOT NULL,
        Success BIT NOT NULL DEFAULT 0,
        IPAddress NVARCHAR(50),
        UserAgent NVARCHAR(500),
        AttemptedAt DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX IX_LoginAttempts_Email ON LoginAttempts(Email);
    CREATE INDEX IX_LoginAttempts_IPAddress ON LoginAttempts(IPAddress);
    PRINT 'Created LoginAttempts table';
END

-- 7. Ensure AuditLog table exists
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AuditLog')
BEGIN
    CREATE TABLE AuditLog (
        LogID BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NULL,
        UserEmail NVARCHAR(255),
        Action NVARCHAR(200) NOT NULL,
        Module NVARCHAR(100),
        Details NVARCHAR(2000),
        IPAddress NVARCHAR(50),
        Status NVARCHAR(20) DEFAULT 'SUCCESS',
        CreatedAt DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX IX_AuditLog_UserID ON AuditLog(UserID);
    CREATE INDEX IX_AuditLog_Action ON AuditLog(Action);
    CREATE INDEX IX_AuditLog_CreatedAt ON AuditLog(CreatedAt);
    PRINT 'Created AuditLog table';
END

-- 8. Index on PasswordResetToken for performance
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_LMS_Users_ResetToken')
BEGIN
    CREATE INDEX IX_LMS_Users_ResetToken ON LMS_Users(PasswordResetToken) WHERE PasswordResetToken IS NOT NULL;
    PRINT 'Created index on PasswordResetToken';
END

-- 9. Cleanup: Remove expired password reset tokens (run periodically)
-- UPDATE LMS_Users SET PasswordResetToken = NULL, PasswordResetExpiry = NULL WHERE PasswordResetExpiry < GETDATE();

PRINT '=====================================================';
PRINT 'Security migration completed successfully.';
PRINT '=====================================================';
