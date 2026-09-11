-- 00_backup_tables.sql
-- Run this script to backup essential tables before migration.
-- This creates backup tables containing the existing data.

USE LMS_DB;
GO

PRINT '--- Backing up LMS_Courses ---';
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[LMS_Courses_Backup_PreMigration]') AND type in (N'U'))
BEGIN
    SELECT * INTO LMS_Courses_Backup_PreMigration FROM LMS_Courses;
    PRINT 'Backup created: LMS_Courses_Backup_PreMigration';
END
ELSE
BEGIN
    PRINT 'Backup table LMS_Courses_Backup_PreMigration already exists.';
END
GO

PRINT '--- Backing up TrainingCalendar ---';
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TrainingCalendar_Backup_PreMigration]') AND type in (N'U'))
BEGIN
    SELECT * INTO TrainingCalendar_Backup_PreMigration FROM TrainingCalendar;
    PRINT 'Backup created: TrainingCalendar_Backup_PreMigration';
END
ELSE
BEGIN
    PRINT 'Backup table TrainingCalendar_Backup_PreMigration already exists.';
END
GO

PRINT '--- Backing up Registrations ---';
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Registrations_Backup_PreMigration]') AND type in (N'U'))
BEGIN
    SELECT * INTO Registrations_Backup_PreMigration FROM Registrations;
    PRINT 'Backup created: Registrations_Backup_PreMigration';
END
ELSE
BEGIN
    PRINT 'Backup table Registrations_Backup_PreMigration already exists.';
END
GO
