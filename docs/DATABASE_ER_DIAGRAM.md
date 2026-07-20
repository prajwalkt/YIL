# Database ER Diagram

## Core Tables and Relationships

- **LMS_Users** (UserID PK)
  - 1:M with **LMS_Sessions** (SessionID PK)
  - 1:M with **AuditLog**
  - 1:M with **PasswordResetTokens**

- **LMS_Courses** (CourseID PK)
  - 1:M with **CourseMaterials**
  - 1:M with **CourseMaterialVersions**
  - 1:M with **TrainingCalendar**
  - 1:M with **Assessments**
  - 1:M with **Feedback**

- **TrainingCalendar** (CalendarID PK)
  - M:1 with **LMS_Courses**
  - 1:M with **Enrollments**
  - 1:M with **Attendance**

- **Registrations** (Id PK)
  - 1:M with **Enrollments**
  - 1:M with **Invoices**
  - 1:M with **PaymentTracking**

- **Certificates** (CertificateID PK)
  - M:1 with **LMS_Users** (StudentID)
  - M:1 with **LMS_Courses**
  - Unique Hash: `VerificationHash`

- **System tables**
  - **ErrorLogs**: Stores application errors.
  - **SystemSettings**: Stores global configs.
  - **OrganizationBranding**: Stores logos, colors, themes.
