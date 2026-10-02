require('dotenv').config({ path: '.env.neon' });
const { Pool } = require('@neondatabase/serverless');

const KNOWN_TABLES = [
  'Announcements', 'TrainingCalendar', 'Messages', 'Enrollments', 'CourseMaterials',
  'Certificates', 'WaitingList', 'Feedback', 'Assessments', 'AssessmentQuestions',
  'AssessmentResults', 'ErrorLogs', 'Testimonials', 'OrganizationBranding', 'Invoices',
  'CourseMaterialVersions', 'NotificationConfig', 'PasswordResetTokens', 'AuditLog',
  'Registrations', 'ReportTemplates', 'LoginAttempts', 'TrainingEnquiries', 'AffiliateRegions',
  'LMS_Sessions', 'VMTemplates', 'PaymentTracking', 'VMInstances', 'Notifications',
  'AssessmentResponses', 'FeedbackResponses', 'VMSessions', 'SystemSettings', 'Attendance',
  'NotificationLog', 'CourseModes', 'ELearningContent', 'LMS_Users', 'ELearningProgress',
  'TrainerProfiles', 'LMS_Courses'
];

function quoteTables(sql) {
  let processed = sql;
  for (const table of KNOWN_TABLES) {
    const regex = new RegExp(`\\b(?<!")(${table})(?!")\\b`, 'g');
    processed = processed.replace(regex, '"$1"');
  }
  return processed;
}

const KNOWN_COLUMNS = ["TrainerName","Organization","Currency","ApprovalRemarks","PrimaryColor","Channel","TrainingDate","Status","AttemptedAt","Company","Layout","Message","QuestionText","ProfileID","CreatedAt","UserEmail","SettingKey","CourseID","CourseName","ImagePath","Country","Email","StartDate","VMID","Description","FilePath","OptionD","FinanceApprovedAt","UpdatedBy","Department","IPAddress","CreatedBy","LastName","InstanceName","LogID","IsUsed","PassMarks","ResultID","Marks","PortalBranding","FeeUSD","IsActive","TrainerRating","VersionID","Action","DurationDays","DueDate","OptionA","EnrollmentID","Priority","Designation","Timestamp","Type","SelectedSlotID","Body","SecondaryColor","Biography","EnrolledAt","TriggerEvent","InvoiceNo","ExpiresAt","TMReviewedBy","BrandID","IssuedDate","AdminApprovedAt","Percentage","UserID","MaxParticipants","EmployeeID","QuestionID","VersionNumber","Code","RecipientName","UpdatedAt","EndDate","ParticipantName","TestimonialID","NotificationID","PaymentMethod","TransactionID","SessionID","TMConfirmed","Score","PasswordHash","AttendancePercentage","Title","TokenHash","AccessEndDate","PaidDate","OriginalStartDate","ErrorMessage","Question","StudentID","PaymentProofPath","ThumbnailPath","TrainingType","SenderID","AnnouncementID","MessageContent","PreferredEndDate","LockoutUntil","JoinedAt","EmailTemplate","UploadDate","PreferredStartDate","CertificateID","CalendarID","RecipientID","CourseInterest","Rating","Details","WatchedSeconds","OptionC","WaitListID","TargetAudience","AccessStartDate","UserAgent","Phone","StudentName","Certifications","EmailBranding","DurationMinutes","Mode","Remarks","ExperienceYears","TrainerScore","Name","RegionID","FeeINR","ResponseID","LastLogin","CorrectAnswer","Answer","VerificationHash","Role","AdminApprovedBy","SponsoredBy","IsApproved","TMRemarks","PaymentID","ExpiryDate","AssessmentID","TokenID","DateApprovalStatus","FacilityScore","TMReviewDate","IssueDate","TMApprovedAt","Location","Passed","Region","ProviderType","SpecialInstructions","EnquiryID","TrainerID","TimeTakenMins","Duration","FeedbackID","Expertise","RegistrationID","TemplateID","DurationSec","LinkedUserID","ProgressPercent","LastPosition","FileType","IsRequired","Response","Id","ProfilePicture","AffiliateID","VerifiedAt","RegistrationType","ReceiverID","ResetToken","StartedAt","Category","MustChangePassword","MaterialID","SoftwareConfig","ProviderData","TMApprovedBy","VerifiedBy","AssignedTo","FiltersJSON","GraduationYear","MarkedBy","CurrentEnrolled","PDFPath","StackTrace","ContentScore","MessageID","TMConfirmedAt","EndedAt","ActiveSessionToken","TrainingMode","ContentID","SortBy","UploadedBy","WhatsAppTemplate","ValidUntil","Feedback","IssuedBy","TrainerId","ContentType","TemplateName","RecipientRole","TMConfirmedBy","OptionB","FinanceApprovedBy","Module","TotalSeconds","SubmittedAt","IsVisibleToStudent","CertificateNo","Subject","Theme","ConfigID","InvoiceID","FileSize","HolidayFlag","IsRead","ResetTokenExpiry","AttendanceID","OverallScore","SessionDate","FinalEndDate","Notes","OriginalEndDate","TotalMarks","ProgressID","WhatsAppEnabled","LogoPath","Course","Amount","SettingValue","FinalStartDate","Success","Severity","OutputType","PaidAt","Comment","LinkedInURL","OpenDate","AgendaPDFPath","FailedLoginAttempts","EmailEnabled","IsCompleted","CompletedAt","ReadAt","FirstName","SortOrder","AttemptID","CloseDate"];
function quoteColumns(sql) {
  let processed = sql;
  for (const col of KNOWN_COLUMNS) {
    const regex = new RegExp(`\\b(?<!")(${col})(?!")\\b`, "g");
    processed = processed.replace(regex, `"$1"`);
  }
  return processed;
}

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

async function run() {
  const sql = `
      SELECT 
        CourseID as "id",
        Title as "name", 
        Code as "code", 
        COALESCE(DurationDays, 3) as "days", 
        COALESCE(AgendaPDFPath, '#') as "agendaPath" 
      FROM LMS_Courses 
      WHERE Status = 'ACTIVE' 
      ORDER BY Title ASC
    `;
  
  const processedSql = quoteColumns(quoteTables(sql));
  console.log("PROCESSED SQL:");
  console.log(processedSql);

  try {
    const res = await pool.query(processedSql);
    console.log("RESULT ROWS COUNT:", res.rows.length);
    if(res.rows.length > 0) {
      console.log("FIRST ROW:", res.rows[0]);
    }
  } catch (e) {
    console.error("QUERY ERROR:", e);
  } finally {
    pool.end();
  }
}

run();
