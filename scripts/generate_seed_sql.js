const fs = require('fs');

const courses = [
  { Code: 'VPOP', Title: 'CENTUM VP DCS Operation', Days: '3', online: true },
  { Code: 'VPFD', Title: 'CENTUM VP DCS Fundamentals', Days: '5', online: true },
  { Code: 'VPEG', Title: 'CENTUM VP DCS Engineering', Days: '5', online: true },
  { Code: 'VPFE', Title: 'CENTUM VP DCS Fundamentals & Engineering', Days: '5', online: true },
  { Code: 'VPEM', Title: 'CENTUM VP DCS Engineering & Maintenance', Days: '10', online: true },
  { Code: 'VPMN', Title: 'CENTUM VP DCS Maintenance', Days: '3', online: true },
  { Code: 'VPAE', Title: 'CENTUM VP DCS Advanced Engineering', Days: '5', online: true },
  { Code: 'VBEG', Title: 'CENTUM VP DCS Batch Engineering', Days: '5', online: true },
  { Code: 'VPAD', Title: 'CENTUM VP DCS AD Suite Engineering', Days: '5', online: true },
  { Code: 'CAMS', Title: 'Consolidated Alarm Management System', Days: '2', online: true },
  { Code: 'SEBL', Title: 'SEBOL Programming', Days: '3', online: true },
  { Code: 'STFT', Title: 'STARDOM NCS with FAST/TOOLS SCADA', Days: '5', online: true },
  { Code: 'STCI', Title: 'STARDOM NCS with CI Server', Days: '5', online: true },
  { Code: 'STEG', Title: 'STARDOM NCS Engineering', Days: '5', online: true },
  { Code: 'FTOP', Title: 'FAST/TOOLS SCADA Operations', Days: '2', online: true },
  { Code: 'FTEG', Title: 'FAST/TOOLS SCADA Engineering', Days: '5', online: true },
  { Code: 'CIOP', Title: 'CI Server Operations', Days: '2', online: true },
  { Code: 'CIEG', Title: 'CI Server Engineering', Days: '5', online: true },
  { Code: 'FFEG', Title: 'Field Bus basics & Engineering', Days: '3', online: true },
  { Code: 'FPRM', Title: 'Field Bus Engineering & PRM', Days: '5', online: true },
  { Code: 'PBUS', Title: 'PROFIBUS Basics and Engineering', Days: '2', online: true },
  { Code: 'INCP', Title: 'Industrial Communication Protocols', Days: '3', online: true },
  { Code: 'FIPC', Title: 'Field Instruments for Process Control', Days: '5', online: false },
  { Code: 'PRMB', Title: 'Asset Management Software- PRM', Days: '3', online: true },
  { Code: 'CSIC', Title: 'Cyber Security for Industrial Control System', Days: '3', online: true },
  { Code: 'RSOP', Title: 'PROSAFE RS Operations', Days: '2', online: true },
  { Code: 'RSFT', Title: 'PROSAFE-RS Engineering with FAST/TOOLS SCADA', Days: '5', online: true },
  { Code: 'RSCI', Title: 'PROSAFE-RS Engineering with CI Server', Days: '5', online: true },
  { Code: 'PPRS', Title: 'PROSAFE RS Engineering', Days: '5', online: true },
  { Code: 'RSAE', Title: 'PROSAFE-RS Advanced Engineering', Days: '5', online: true },
  { Code: 'RSAD', Title: 'PROSAFE-RS with ADsuite Engineering', Days: '2', online: true },
  { Code: 'FSUS', Title: 'Functional Safety for End Users', Days: '2', online: false },
];

let sql = `-- 03_seed_courses.sql
-- Idempotent seeding script for 32 historical courses + CENTUM VP TEST
USE LMS_DB;
GO

DECLARE @CurrentCourseID INT;

`;

for (const c of courses) {
    sql += `
PRINT '--- Seeding ${c.Code} ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = '${c.Code}')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('${c.Title}', '${c.Code}', '${c.Days} Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = '${c.Code}';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');
`;
    
    if (c.online) {
        sql += `
IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');
`;
    }
}

sql += `
PRINT '--- Seeding CENTUM VP TEST ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE CourseID = 21)
BEGIN
    SET IDENTITY_INSERT LMS_Courses ON;
    INSERT INTO LMS_Courses (CourseID, Title, Code, Duration, Status, Mode)
    VALUES (21, 'CENTUM VP TEST', 'TEST-21', '10 Minutes', 'ACTIVE', 'CILT');
    SET IDENTITY_INSERT LMS_Courses OFF;
    SET @CurrentCourseID = 21;
END
ELSE
BEGIN
    -- If CourseID 21 already exists but is a different course, we do NOT overwrite it.
    -- However, we must ensure we get its ID or handle it.
    -- For safety, we assume CourseID 21 is indeed available or is already the TEST course.
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE CourseID = 21;
END

-- Ensure TEST course has all 4 modes
IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');
IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');
IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'SITE')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'SITE');
IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'ELEARNING')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'ELEARNING');

PRINT '--- Seeding Complete ---';
GO
`;

fs.writeFileSync('d:\\YTS_FULL_PROJECT\\yts_platform\\scripts\\03_seed_courses.sql', sql);
