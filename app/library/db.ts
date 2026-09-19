import { Pool } from '@neondatabase/serverless';

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

function quoteTables(sql: string) {
  let processed = sql;
  for (const table of KNOWN_TABLES) {
    // Only quote if it's not already quoted and matches exactly as a word
    const regex = new RegExp(`\\b(?<!")(${table})(?!")\\b`, 'g');
    processed = processed.replace(regex, '"$1"');
  }
  return processed;
}

const KNOWN_COLUMNS = ["TrainerName","Organization","Currency","ApprovalRemarks","PrimaryColor","Channel","TrainingDate","Status","AttemptedAt","Company","Layout","Message","QuestionText","ProfileID","CreatedAt","UserEmail","SettingKey","CourseID","CourseName","ImagePath","Country","Email","StartDate","VMID","Description","FilePath","OptionD","FinanceApprovedAt","UpdatedBy","Department","IPAddress","CreatedBy","LastName","InstanceName","LogID","IsUsed","PassMarks","ResultID","Marks","PortalBranding","FeeUSD","IsActive","TrainerRating","VersionID","Action","DurationDays","DueDate","OptionA","EnrollmentID","Priority","Designation","Timestamp","Type","SelectedSlotID","Body","SecondaryColor","Biography","EnrolledAt","TriggerEvent","InvoiceNo","ExpiresAt","TMReviewedBy","BrandID","IssuedDate","AdminApprovedAt","Percentage","UserID","MaxParticipants","EmployeeID","QuestionID","VersionNumber","Code","RecipientName","UpdatedAt","EndDate","ParticipantName","TestimonialID","NotificationID","PaymentMethod","TransactionID","SessionID","TMConfirmed","Score","PasswordHash","AttendancePercentage","Title","TokenHash","AccessEndDate","PaidDate","OriginalStartDate","ErrorMessage","Question","StudentID","PaymentProofPath","ThumbnailPath","TrainingType","SenderID","AnnouncementID","MessageContent","PreferredEndDate","LockoutUntil","JoinedAt","EmailTemplate","UploadDate","PreferredStartDate","CertificateID","CalendarID","RecipientID","CourseInterest","Rating","Details","WatchedSeconds","OptionC","WaitListID","TargetAudience","AccessStartDate","UserAgent","Phone","StudentName","Certifications","EmailBranding","DurationMinutes","Mode","Remarks","ExperienceYears","TrainerScore","Name","RegionID","FeeINR","ResponseID","LastLogin","CorrectAnswer","Answer","VerificationHash","Role","AdminApprovedBy","SponsoredBy","IsApproved","TMRemarks","PaymentID","ExpiryDate","AssessmentID","TokenID","DateApprovalStatus","FacilityScore","TMReviewDate","IssueDate","TMApprovedAt","Location","Passed","Region","ProviderType","SpecialInstructions","EnquiryID","TrainerID","TimeTakenMins","Duration","FeedbackID","Expertise","RegistrationID","TemplateID","DurationSec","LinkedUserID","ProgressPercent","LastPosition","FileType","IsRequired","Response","Id","ProfilePicture","AffiliateID","VerifiedAt","RegistrationType","ReceiverID","ResetToken","StartedAt","Category","MustChangePassword","MaterialID","SoftwareConfig","ProviderData","TMApprovedBy","VerifiedBy","AssignedTo","FiltersJSON","GraduationYear","MarkedBy","CurrentEnrolled","PDFPath","StackTrace","ContentScore","MessageID","TMConfirmedAt","EndedAt","ActiveSessionToken","TrainingMode","ContentID","SortBy","UploadedBy","WhatsAppTemplate","ValidUntil","Feedback","IssuedBy","TrainerId","ContentType","TemplateName","RecipientRole","TMConfirmedBy","OptionB","FinanceApprovedBy","Module","TotalSeconds","SubmittedAt","IsVisibleToStudent","CertificateNo","Subject","Theme","ConfigID","InvoiceID","FileSize","HolidayFlag","IsRead","ResetTokenExpiry","AttendanceID","OverallScore","SessionDate","FinalEndDate","Notes","OriginalEndDate","TotalMarks","ProgressID","WhatsAppEnabled","LogoPath","Course","Amount","SettingValue","FinalStartDate","Success","Severity","OutputType","PaidAt","Comment","LinkedInURL","OpenDate","AgendaPDFPath","FailedLoginAttempts","EmailEnabled","IsCompleted","CompletedAt","ReadAt","FirstName","SortOrder","AttemptID","CloseDate"];
function quoteColumns(sql: string) {
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

export async function getConnection() {
  return {
    query: async (sqlStr: string, values?: any[]) => {
      const res = await pool.query(quoteColumns(quoteTables(sqlStr)), values);
      return { recordset: res.rows, rowsAffected: [res.rowCount] };
    },
    connect: async () => {
      const client = await pool.connect();
      return {
        query: async (sqlStr: string, values?: any[]) => {
          const res = await client.query(quoteColumns(quoteTables(sqlStr)), values);
          return { recordset: res.rows, rowsAffected: [res.rowCount] };
        },
        release: () => client.release()
      };
    },
    request: () => {
      const inputs: Record<string, any> = {};
      return {
        input: function(name: string, value: any) {
          inputs[name] = value;
          return this;
        },
        query: async function(sqlStr: string) {
          let pgSql = sqlStr;
          const values: any[] = [];
          let index = 1;
          for (const [key, val] of Object.entries(inputs)) {
            const regex = new RegExp(`@${key}\\b`, 'g');
            if (regex.test(pgSql)) {
              pgSql = pgSql.replace(regex, `$${index}`);
              values.push(val);
              index++;
            }
          }
          const res = await pool.query(quoteColumns(quoteTables(pgSql)), values);
          return { recordset: res.rows, rowsAffected: [res.rowCount] };
        }
      };
    },
    transaction: () => {
      let client: any = null;
      return {
        begin: async () => {
          client = await pool.connect();
          await client.query('BEGIN');
        },
        query: async (sqlStr: string, values?: any[]) => {
          if (!client) throw new Error("Transaction not started");
          const res = await client.query(quoteColumns(quoteTables(sqlStr)), values);
          return { recordset: res.rows, rowsAffected: [res.rowCount] };
        },
        commit: async () => {
          if (client) {
            await client.query('COMMIT');
            client.release();
          }
        },
        rollback: async () => {
          if (client) {
            await client.query('ROLLBACK');
            client.release();
          }
        }
      };
    }
  };
}