const CaseMap: Record<string, string> = {
  "calendarid": "CalendarID",
  "courseid": "CourseID",
  "title": "Title",
  "trainingtype": "TrainingType",
  "startdate": "StartDate",
  "enddate": "EndDate",
  "trainerid": "TrainerId",
  "trainername": "TrainerName",
  "location": "Location",
  "maxparticipants": "MaxParticipants",
  "currentenrolled": "CurrentEnrolled",
  "status": "Status",
  "notes": "Notes",
  "createdat": "CreatedAt",
  "holidayflag": "HolidayFlag",
  "tmconfirmed": "TMConfirmed",
  "tmconfirmedat": "TMConfirmedAt",
  "tmconfirmedby": "TMConfirmedBy",
  "messageid": "MessageID",
  "senderid": "SenderID",
  "receiverid": "ReceiverID",
  "subject": "Subject",
  "body": "Body",
  "isread": "IsRead",
  "readat": "ReadAt",
  "enrollmentid": "EnrollmentID",
  "studentid": "StudentID",
  "registrationid": "RegistrationID",
  "enrolledat": "EnrolledAt",
  "progresspercent": "ProgressPercent",
  "completedat": "CompletedAt",
  "attendancepercentage": "AttendancePercentage",
  "accessstartdate": "AccessStartDate",
  "accessenddate": "AccessEndDate",
  "durationdays": "DurationDays",
  "brandid": "BrandID",
  "logopath": "LogoPath",
  "primarycolor": "PrimaryColor",
  "secondarycolor": "SecondaryColor",
  "theme": "Theme",
  "emailbranding": "EmailBranding",
  "portalbranding": "PortalBranding",
  "updatedat": "UpdatedAt",
  "updatedby": "UpdatedBy",
  "configid": "ConfigID",
  "triggerevent": "TriggerEvent",
  "emailenabled": "EmailEnabled",
  "whatsappenabled": "WhatsAppEnabled",
  "emailtemplate": "EmailTemplate",
  "whatsapptemplate": "WhatsAppTemplate",
  "isactive": "IsActive",
  "logid": "LogID",
  "userid": "UserID",
  "useremail": "UserEmail",
  "action": "Action",
  "module": "Module",
  "details": "Details",
  "ipaddress": "IPAddress",
  "useragent": "UserAgent",
  "attemptid": "AttemptID",
  "email": "Email",
  "success": "Success",
  "attemptedat": "AttemptedAt",
  "sessionid": "SessionID",
  "expiresat": "ExpiresAt",
  "templateid": "TemplateID",
  "name": "Name",
  "description": "Description",
  "softwareconfig": "SoftwareConfig",
  "paymentid": "PaymentID",
  "studentname": "StudentName",
  "coursename": "CourseName",
  "amount": "Amount",
  "currency": "Currency",
  "transactionid": "TransactionID",
  "paymentmethod": "PaymentMethod",
  "paymentproofpath": "PaymentProofPath",
  "verifiedby": "VerifiedBy",
  "verifiedat": "VerifiedAt",
  "paidat": "PaidAt",
  "vmid": "VMID",
  "instancename": "InstanceName",
  "providertype": "ProviderType",
  "providerdata": "ProviderData",
  "id": "Id",
  "phone": "Phone",
  "organization": "Organization",
  "country": "Country",
  "graduationyear": "GraduationYear",
  "course": "Course",
  "trainingmode": "TrainingMode",
  "sponsoredby": "SponsoredBy",
  "specialinstructions": "SpecialInstructions",
  "financeapprovedby": "FinanceApprovedBy",
  "financeapprovedat": "FinanceApprovedAt",
  "tmapprovedby": "TMApprovedBy",
  "tmapprovedat": "TMApprovedAt",
  "adminapprovedby": "AdminApprovedBy",
  "adminapprovedat": "AdminApprovedAt",
  "approvalremarks": "ApprovalRemarks",
  "linkeduserid": "LinkedUserID",
  "registrationtype": "RegistrationType",
  "selectedslotid": "SelectedSlotID",
  "preferredstartdate": "PreferredStartDate",
  "preferredenddate": "PreferredEndDate",
  "originalstartdate": "OriginalStartDate",
  "originalenddate": "OriginalEndDate",
  "finalstartdate": "FinalStartDate",
  "finalenddate": "FinalEndDate",
  "dateapprovalstatus": "DateApprovalStatus",
  "tmreviewedby": "TMReviewedBy",
  "tmreviewdate": "TMReviewDate",
  "tmremarks": "TMRemarks",
  "settingkey": "SettingKey",
  "settingvalue": "SettingValue",
  "type": "Type",
  "channel": "Channel",
  "errormessage": "ErrorMessage",
  "messagecontent": "MessageContent",
  "recipientname": "RecipientName",
  "contentid": "ContentID",
  "contenttype": "ContentType",
  "filepath": "FilePath",
  "filesize": "FileSize",
  "durationsec": "DurationSec",
  "sortorder": "SortOrder",
  "isrequired": "IsRequired",
  "thumbnailpath": "ThumbnailPath",
  "createdby": "CreatedBy",
  "passwordhash": "PasswordHash",
  "role": "Role",
  "firstname": "FirstName",
  "lastname": "LastName",
  "isapproved": "IsApproved",
  "mustchangepassword": "MustChangePassword",
  "failedloginattempts": "FailedLoginAttempts",
  "lockoutuntil": "LockoutUntil",
  "lastlogin": "LastLogin",
  "profilepicture": "ProfilePicture",
  "resettoken": "ResetToken",
  "resettokenexpiry": "ResetTokenExpiry",
  "activesessiontoken": "ActiveSessionToken",
  "progressid": "ProgressID",
  "watchedseconds": "WatchedSeconds",
  "totalseconds": "TotalSeconds",
  "iscompleted": "IsCompleted",
  "lastposition": "LastPosition",
  "profileid": "ProfileID",
  "employeeid": "EmployeeID",
  "department": "Department",
  "expertise": "Expertise",
  "experienceyears": "ExperienceYears",
  "trainerrating": "TrainerRating",
  "certifications": "Certifications",
  "biography": "Biography",
  "linkedinurl": "LinkedInURL",
  "code": "Code",
  "duration": "Duration",
  "feeinr": "FeeINR",
  "feeusd": "FeeUSD",
  "mode": "Mode",
  "opendate": "OpenDate",
  "closedate": "CloseDate",
  "agendapdfpath": "AgendaPDFPath",
  "category": "Category",
  "activecourses": "ActiveCourses",
  "batchtitle": "BatchTitle",
  "calendarstatus": "CalendarStatus",
  "calendartitle": "CalendarTitle",
  "certificatesissued": "CertificatesIssued",
  "colorstatus": "ColorStatus",
  "coursecode": "CourseCode",
  "coursetitle": "CourseTitle",
  "creatorname": "CreatorName",
  "daysattended": "DaysAttended",
  "enrollmentstatus": "EnrollmentStatus",
  "financeapproved": "FinanceApproved",
  "fullname": "FullName",
  "fullyapproved": "FullyApproved",
  "month": "Month",
  "monthlyrevenue": "MonthlyRevenue",
  "openenquiries": "OpenEnquiries",
  "overdueinvoices": "OverdueInvoices",
  "paidinvoices": "PaidInvoices",
  "participantname": "ParticipantName",
  "paymentstatus": "PaymentStatus",
  "pendingapprovals": "PendingApprovals",
  "pendinginvoices": "PendingInvoices",
  "pendingpayments": "PendingPayments",
  "pendingpaymentsamount": "PendingPaymentsAmount",
  "pendingpaymentscount": "PendingPaymentsCount",
  "questioncount": "QuestionCount",
  "receivername": "ReceiverName",
  "regcount": "RegCount",
  "registrationcount": "RegistrationCount",
  "registrationstatus": "RegistrationStatus",
  "revenue": "Revenue",
  "seededenrolled": "SeededEnrolled",
  "sendername": "SenderName",
  "studentemail": "StudentEmail",
  "total": "Total",
  "totalaffiliates": "TotalAffiliates",
  "totalfeedback": "TotalFeedback",
  "totalpayments": "TotalPayments",
  "totalregistrations": "TotalRegistrations",
  "totalresponses": "TotalResponses",
  "totalrevenue": "TotalRevenue",
  "totalstudents": "TotalStudents",
  "totaltrainers": "TotalTrainers",
  "trainerfullname": "TrainerFullName",
  "transactions": "Transactions",
  "uploadedbyname": "UploadedByName",
  "userrole": "UserRole",
  "verifiedpayments": "VerifiedPayments",
  "vmname": "VMName",
  "count": "count"
};
import { query } from './db_pg';

class SqlServerToPgRequest {
  private inputs: Record<string, any> = {};

  input(name: string, typeOrValue: any, value?: any) {
    this.inputs[name] = value !== undefined ? value : typeOrValue;
    return this;
  }

  async query(sqlString: string) {
    // Basic MSSQL -> PG translations
    let pgSql = sqlString
      .replace(/GETDATE\(\)/gi, 'NOW()')
      .replace(/ISNULL\(/gi, 'COALESCE(')
      .replace(/OUTPUT INSERTED\.([a-zA-Z0-9_]+)/gi, 'RETURNING $1');

    const outputMatch = sqlString.match(/OUTPUT\s+INSERTED\.([a-zA-Z0-9_]+)/i);
    if (outputMatch) {
      // It was already replaced by 'RETURNING $1' inline, so we remove the inline RETURNING
      pgSql = pgSql.replace(/RETURNING\s+[a-zA-Z0-9_]+/i, '').trim();
      if (pgSql.endsWith(';')) pgSql = pgSql.slice(0, -1);
      pgSql += ` RETURNING ${outputMatch[1]}`;
    }

    // Replace @Param with $N and build values array
    const paramsArray: any[] = [];
    let paramIndex = 1;

    // Sort keys by length descending to prevent substring matching (e.g. @Id vs @Id_Course)
    const keys = Object.keys(this.inputs).sort((a, b) => b.length - a.length);

    for (const key of keys) {
      const regex = new RegExp(`@${key}\\b`, 'gi');
      if (pgSql.match(regex)) {
        pgSql = pgSql.replace(regex, `$${paramIndex}`);
        paramsArray.push(this.inputs[key]);
        paramIndex++;
      }
    }

    // Edge cases for specific queries that might fail
    pgSql = pgSql.replace(/BIT/gi, 'BOOLEAN');
    pgSql = pgSql.replace(/DATETIME/gi, 'TIMESTAMP');
    pgSql = pgSql.replace(/IDENTITY\(1,1\)/gi, 'SERIAL');
    
    // Quick fix for SQL Server TOP 1 -> LIMIT 1
    if (pgSql.match(/SELECT\s+TOP\s+(\d+)/i)) {
       const limit = pgSql.match(/SELECT\s+TOP\s+(\d+)/i)![1];
       pgSql = pgSql.replace(/SELECT\s+TOP\s+\d+/i, 'SELECT');
       pgSql += ` LIMIT ${limit}`;
    }

    const res = await query(pgSql, paramsArray);

        const caseInsensitiveRows = res.rows.map((row: any) => {
      if (!row) return row;
      const newRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        const lowerKey = key.toLowerCase();
        
        // Preserve intentional SQL aliases before global CaseMap override
        const aliasMatch = sqlString.match(new RegExp('\\bAS\\s+(' + lowerKey + ')\\b', 'i'));
        if (aliasMatch) {
          newRow[aliasMatch[1]] = value;
          continue;
        }

        const mappedKey = CaseMap[lowerKey] || key;
        newRow[mappedKey] = value;
      }
      return newRow;
    });

    return {
      recordset: caseInsensitiveRows,
      rowsAffected: [res.rowCount]
    };
  }
}

export async function getConnection() {
  return {
    request: () => new SqlServerToPgRequest(),
    query: async (sqlString: string) => (new SqlServerToPgRequest()).query(sqlString),
    close: async () => {}, // Mock close
    transaction: () => ({
      begin: async () => {},
      commit: async () => {},
      rollback: async () => {},
      request: () => new SqlServerToPgRequest(),
    })
  };
}