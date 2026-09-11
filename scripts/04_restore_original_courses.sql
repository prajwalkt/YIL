-- Restore Original 32 Courses (Non-Destructive)
USE LMS_DB;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @NewCourseID INT;
    DECLARE @TargetCourseID INT;

    -- Handle existing course: CENTUM VP DCS Operation (Code: CENTUM-VP-OPS)
    SELECT @TargetCourseID = CourseID FROM LMS_Courses WHERE Code = 'CENTUM-VP-OPS';
    IF @TargetCourseID IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'CILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'CILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'SITE')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'SITE');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'VILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'VILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'ELEARNING')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'ELEARNING');
    END

    -- Handle existing course: CENTUM VP DCS Fundamentals (Code: CENT215)
    SELECT @TargetCourseID = CourseID FROM LMS_Courses WHERE Code = 'CENT215';
    IF @TargetCourseID IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'CILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'CILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'SITE')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'SITE');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'VILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'VILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'ELEARNING')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'ELEARNING');
    END

    -- Handle existing course: CENTUM VP DCS Engineering (Code: CENT323)
    SELECT @TargetCourseID = CourseID FROM LMS_Courses WHERE Code = 'CENT323';
    IF @TargetCourseID IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'CILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'CILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'SITE')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'SITE');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'VILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'VILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'ELEARNING')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'ELEARNING');
    END

    -- Handle existing course: CENTUM VP DCS Fundamentals & Engineering (Code: CENTUM-VP-FUND)
    SELECT @TargetCourseID = CourseID FROM LMS_Courses WHERE Code = 'CENTUM-VP-FUND';
    IF @TargetCourseID IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'CILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'CILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'SITE')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'SITE');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'VILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'VILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'ELEARNING')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'ELEARNING');
    END

    -- Handle existing course: CENTUM VP DCS Engineering & Maintenance (Code: CENTUM-VP-ENG)
    SELECT @TargetCourseID = CourseID FROM LMS_Courses WHERE Code = 'CENTUM-VP-ENG';
    IF @TargetCourseID IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'CILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'CILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'SITE')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'SITE');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'VILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'VILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'ELEARNING')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'ELEARNING');
    END

    -- Handle missing course: CENTUM VP DCS Maintenance (Code: VPMN)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'VPMN')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('CENTUM VP DCS Maintenance', 'VPMN', 3, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle existing course: CENTUM VP DCS Advanced Engineering (Code: CENT674)
    SELECT @TargetCourseID = CourseID FROM LMS_Courses WHERE Code = 'CENT674';
    IF @TargetCourseID IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'CILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'CILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'SITE')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'SITE');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'VILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'VILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'ELEARNING')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'ELEARNING');
    END

    -- Handle missing course: CENTUM VP DCS Batch Engineering (Code: VBEG)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'VBEG')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('CENTUM VP DCS Batch Engineering', 'VBEG', 5, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle missing course: CENTUM VP DCS AD Suite Engineering (Code: VPAD)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'VPAD')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('CENTUM VP DCS AD Suite Engineering', 'VPAD', 5, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle missing course: Consolidated Alarm Management System (Code: CAMS)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'CAMS')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('Consolidated Alarm Management System', 'CAMS', 2, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle missing course: SEBOL Programming (Code: SEBL)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'SEBL')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('SEBOL Programming', 'SEBL', 3, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle existing course: STARDOM NCS with FAST/TOOLS SCADA (Code: STAR432)
    SELECT @TargetCourseID = CourseID FROM LMS_Courses WHERE Code = 'STAR432';
    IF @TargetCourseID IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'CILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'CILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'SITE')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'SITE');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'VILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'VILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'ELEARNING')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'ELEARNING');
    END

    -- Handle existing course: STARDOM NCS with CI Server (Code: STAR743)
    SELECT @TargetCourseID = CourseID FROM LMS_Courses WHERE Code = 'STAR743';
    IF @TargetCourseID IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'CILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'CILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'SITE')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'SITE');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'VILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'VILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'ELEARNING')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'ELEARNING');
    END

    -- Handle existing course: STARDOM NCS Engineering (Code: STARDOM-ENG)
    SELECT @TargetCourseID = CourseID FROM LMS_Courses WHERE Code = 'STARDOM-ENG';
    IF @TargetCourseID IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'CILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'CILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'SITE')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'SITE');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'VILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'VILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'ELEARNING')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'ELEARNING');
    END

    -- Handle missing course: FAST/TOOLS SCADA Operations (Code: FTOP)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'FTOP')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('FAST/TOOLS SCADA Operations', 'FTOP', 2, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle missing course: FAST/TOOLS SCADA Engineering (Code: FTEG)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'FTEG')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('FAST/TOOLS SCADA Engineering', 'FTEG', 5, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle missing course: CI Server Operations (Code: CIOP)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'CIOP')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('CI Server Operations', 'CIOP', 2, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle missing course: CI Server Engineering (Code: CIEG)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'CIEG')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('CI Server Engineering', 'CIEG', 5, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle missing course: Field Bus basics & Engineering (Code: FFEG)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'FFEG')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('Field Bus basics & Engineering', 'FFEG', 3, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle missing course: Field Bus Engineering & PRM (Code: FPRM)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'FPRM')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('Field Bus Engineering & PRM', 'FPRM', 5, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle missing course: PROFIBUS Basics and Engineering (Code: PBUS)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'PBUS')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('PROFIBUS Basics and Engineering', 'PBUS', 2, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle existing course: Industrial Communication Protocols (Code: IND-COMM)
    SELECT @TargetCourseID = CourseID FROM LMS_Courses WHERE Code = 'IND-COMM';
    IF @TargetCourseID IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'CILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'CILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'SITE')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'SITE');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'VILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'VILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'ELEARNING')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'ELEARNING');
    END

    -- Handle missing course: Field Instruments for Process Control (Code: FIPC)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'FIPC')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('Field Instruments for Process Control', 'FIPC', 5, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
    END

    -- Handle missing course: Asset Management Software- PRM (Code: PRMB)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'PRMB')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('Asset Management Software- PRM', 'PRMB', 3, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle missing course: Cyber Security for Industrial Control System (Code: CSIC)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'CSIC')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('Cyber Security for Industrial Control System', 'CSIC', 3, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle missing course: PROSAFE RS Operations (Code: RSOP)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'RSOP')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('PROSAFE RS Operations', 'RSOP', 2, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle missing course: PROSAFE-RS Engineering with FAST/TOOLS SCADA (Code: RSFT)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'RSFT')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('PROSAFE-RS Engineering with FAST/TOOLS SCADA', 'RSFT', 5, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle missing course: PROSAFE-RS Engineering with CI Server (Code: RSCI)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'RSCI')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('PROSAFE-RS Engineering with CI Server', 'RSCI', 5, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle existing course: PROSAFE RS Engineering (Code: PROS966)
    SELECT @TargetCourseID = CourseID FROM LMS_Courses WHERE Code = 'PROS966';
    IF @TargetCourseID IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'CILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'CILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'SITE')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'SITE');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'VILT')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'VILT');
        IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @TargetCourseID AND TrainingMode = 'ELEARNING')
            INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@TargetCourseID, 'ELEARNING');
    END

    -- Handle missing course: PROSAFE-RS Advanced Engineering (Code: RSAE)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'RSAE')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('PROSAFE-RS Advanced Engineering', 'RSAE', 5, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle missing course: PROSAFE-RS with ADsuite Engineering (Code: RSAD)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'RSAD')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('PROSAFE-RS with ADsuite Engineering', 'RSAD', 2, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'VILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'ELEARNING');
    END

    -- Handle missing course: Functional Safety for End Users (Code: FSUS)
    IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'FSUS')
    BEGIN
        INSERT INTO LMS_Courses (Title, Code, DurationDays, TemplateID, Status)
        VALUES ('Functional Safety for End Users', 'FSUS', 2, 1, 'ACTIVE');
        
        SET @NewCourseID = SCOPE_IDENTITY();
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'CILT');
        INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@NewCourseID, 'SITE');
    END

    COMMIT TRANSACTION;
    PRINT 'Restoration complete. All changes committed.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
        
    PRINT 'Error occurred during restoration. Transaction rolled back.';
    PRINT ERROR_MESSAGE();
END CATCH
GO
