# Yokogawa Training Services LMS - Master QA Testing Guide

This guide reflects the exact current implementation of the Yokogawa Training Services LMS. It provides detailed, step-by-step instructions for verifying all 30 modules, the end-to-end workflow, and a final QA checklist.

---

## 1. Public Website
- **Prerequisites**: Server running (`npm run dev` or `start`).
- **Test account(s)**: Guest.
- **Starting URL**: `/`
- **Exact navigation path**: Open browser → Navigate to `/`
- **Test data required**: None.
- **Step-by-step actions**:
  1. Scroll through the landing page.
  2. Verify all hero images, course catalogs, and footer links are visible.
- **Expected result**: Page loads smoothly without console errors. Images and CSS load properly.
- **Database changes**: None.
- **APIs invoked**: None (Static/SSR page).
- **Common failure cases**: Missing CSS, broken links.
- **Pass/Fail criteria**: UI renders perfectly.

## 2. Registration
- **Prerequisites**: None.
- **Test account(s)**: Guest.
- **Starting URL**: `/register`
- **Exact navigation path**: `/` → Click "Register"
- **Test data required**: Unique Email (`teststudent@example.com`), Password, Name, Company.
- **Step-by-step actions**:
  1. Enter valid details in all required fields.
  2. Click Submit.
- **Expected result**: User is redirected to Login page with a success message.
- **Database changes**: New record in `LMS_Users` (Role: `Student`). Password hashed.
- **APIs invoked**: `POST /api/auth/register`
- **Common failure cases**: Email already exists, weak password.
- **Pass/Fail criteria**: User successfully created in DB.

## 3. Login
- **Prerequisites**: Existing user account.
- **Test account(s)**: `teststudent@example.com`
- **Starting URL**: `/login`
- **Exact navigation path**: `/` → Click "Login"
- **Test data required**: Valid credentials.
- **Step-by-step actions**:
  1. Enter Email and Password.
  2. Click Login.
- **Expected result**: Redirected to respective dashboard (`/student` in this case). JWT stored in cookies.
- **Database changes**: New session stored in `LMS_Sessions`.
- **APIs invoked**: `POST /api/auth/login`
- **Common failure cases**: Invalid credentials, account locked.
- **Pass/Fail criteria**: Successful login with valid JWT.

## 4. Student Portal
- **Prerequisites**: Authenticated as Student.
- **Test account(s)**: Student.
- **Starting URL**: `/student`
- **Exact navigation path**: Login as Student.
- **Test data required**: Student must have enrollments.
- **Step-by-step actions**:
  1. View Dashboard.
  2. Check "My Registrations" and "My Courses".
- **Expected result**: Dashboard populates with registered courses, pending assessments, and certificates.
- **Database changes**: None.
- **APIs invoked**: `GET /api/student/dashboard`, `GET /api/student/my-registrations`
- **Common failure cases**: Empty states not showing correctly.
- **Pass/Fail criteria**: Accurate data display.

## 5. Trainer Portal
- **Prerequisites**: Authenticated as Trainer.
- **Test account(s)**: Trainer (`trainer@yokogawa.com`).
- **Starting URL**: `/trainer`
- **Exact navigation path**: Login as Trainer.
- **Test data required**: Trainer assigned to batches.
- **Step-by-step actions**:
  1. View upcoming batches.
  2. Click "View Participants".
- **Expected result**: Displays list of students enrolled in trainer's batches.
- **Database changes**: None.
- **APIs invoked**: `GET /api/trainer/dashboard`, `GET /api/trainer/participants`
- **Common failure cases**: Batches from other trainers visible.
- **Pass/Fail criteria**: Only assigned batches are visible.

## 6. Training Manager Portal
- **Prerequisites**: Authenticated as Training Manager.
- **Test account(s)**: TM (`manager@yokogawa.com`).
- **Starting URL**: `/admin` (RBAC filters for TM).
- **Exact navigation path**: Login as Training Manager.
- **Test data required**: Pending course approvals.
- **Step-by-step actions**:
  1. Navigate to Approvals.
  2. Approve a pending student registration.
- **Expected result**: Registration status changes from "Pending" to "Approved".
- **Database changes**: `Registrations` table `Status` updated to `Approved`.
- **APIs invoked**: `POST /api/admin/approvals`
- **Common failure cases**: Unauthorized access error.
- **Pass/Fail criteria**: Registration successfully approved.

## 7. Finance Portal
- **Prerequisites**: Authenticated as Finance.
- **Test account(s)**: Finance (`finance@yokogawa.com`).
- **Starting URL**: `/admin` (RBAC filters for Finance).
- **Exact navigation path**: Login as Finance.
- **Test data required**: Pending payments.
- **Step-by-step actions**:
  1. Navigate to Payments/Invoices.
  2. Mark payment as "Paid".
- **Expected result**: Payment status updates to "Paid", triggering enrollment.
- **Database changes**: `Payments` table updated. `Enrollments` table inserted.
- **APIs invoked**: `POST /api/payment`, `GET /api/finance/dashboard`
- **Common failure cases**: Incorrect amount displayed.
- **Pass/Fail criteria**: Payment confirmed and enrollment triggered.

## 8. Admin Portal
- **Prerequisites**: Authenticated as Admin.
- **Test account(s)**: Admin (`admin@yokogawa.com`).
- **Starting URL**: `/admin`
- **Exact navigation path**: Login as Admin.
- **Test data required**: None.
- **Step-by-step actions**:
  1. View System Overview.
  2. Access all modules (Users, Courses, Settings).
- **Expected result**: Full access to all CRUD operations without restrictions.
- **Database changes**: N/A
- **APIs invoked**: All `/api/admin/*`
- **Common failure cases**: Module access denied.
- **Pass/Fail criteria**: 100% unrestricted access.

## 9. Affiliate Portal
- **Prerequisites**: Authenticated as Affiliate.
- **Test account(s)**: Affiliate (`affiliate@example.com`).
- **Starting URL**: `/affiliate`
- **Exact navigation path**: Login as Affiliate.
- **Test data required**: Referrals made by affiliate.
- **Step-by-step actions**:
  1. View Dashboard.
  2. Check Referral links and earnings.
- **Expected result**: Displays accurate count of users registered via affiliate link.
- **Database changes**: None.
- **APIs invoked**: `GET /api/affiliate/dashboard`
- **Common failure cases**: Referrals not tracking.
- **Pass/Fail criteria**: Accurate referral tracking.

## 10. Calendar
- **Prerequisites**: Authenticated as Admin/Trainer/Student.
- **Test account(s)**: Any role.
- **Starting URL**: `/training-calender`
- **Exact navigation path**: Dashboard → Calendar
- **Test data required**: Scheduled batches in `LMS_Courses`.
- **Step-by-step actions**:
  1. Open Calendar view.
  2. Change month/week view.
- **Expected result**: Batches display accurately on scheduled dates.
- **Database changes**: None.
- **APIs invoked**: `GET /api/calendar`
- **Common failure cases**: Timezone misalignment.
- **Pass/Fail criteria**: Events map to correct dates.

## 11. Attendance
- **Prerequisites**: Authenticated as Trainer.
- **Test account(s)**: Trainer.
- **Starting URL**: `/trainer/participants`
- **Exact navigation path**: Dashboard → Manage Batch → Attendance
- **Test data required**: Enrolled students in a batch.
- **Step-by-step actions**:
  1. Mark "Present" for Student A.
  2. Mark "Absent" for Student B.
  3. Submit.
- **Expected result**: Attendance percentages update.
- **Database changes**: `Attendance` table updated.
- **APIs invoked**: `POST /api/trainer/attendance`
- **Common failure cases**: Saving fails due to missing ID.
- **Pass/Fail criteria**: DB reflects exact attendance marked.

## 12. Assessments
- **Prerequisites**: Student enrolled, Trainer available to grade.
- **Test account(s)**: Student & Trainer.
- **Starting URL**: `/trainer/assessment/[id]`
- **Exact navigation path**: Trainer Dashboard → Assessments
- **Test data required**: Submitted assessments by student.
- **Step-by-step actions**:
  1. Trainer inputs Grade (e.g., 85).
  2. Clicks "Save Grade".
- **Expected result**: Grade is saved. If > Passing Score, course is marked "Completed".
- **Database changes**: `Assessments` grade updated. `Enrollments` status to "Completed".
- **APIs invoked**: `POST /api/trainer/assessment`
- **Common failure cases**: Invalid grade format.
- **Pass/Fail criteria**: Grade triggers completion correctly.

## 13. Feedback
- **Prerequisites**: Student completed course.
- **Test account(s)**: Student.
- **Starting URL**: `/student/feedback`
- **Exact navigation path**: Student Dashboard → Leave Feedback
- **Test data required**: Completed course ID.
- **Step-by-step actions**:
  1. Submit 5-star rating and comment.
- **Expected result**: Feedback saved and visible in Admin Portal.
- **Database changes**: `Feedback` table inserted.
- **APIs invoked**: `POST /api/student/feedback`, `GET /api/admin/feedback`
- **Common failure cases**: Duplicate feedback submission.
- **Pass/Fail criteria**: Successfully submitted and queryable.

## 14. Certificates
- **Prerequisites**: Student completed course.
- **Test account(s)**: Student / Admin.
- **Starting URL**: `/admin/certificates` or `/student`
- **Exact navigation path**: Dashboard → Certificates
- **Test data required**: Completed `Enrollments`.
- **Step-by-step actions**:
  1. Admin clicks "Generate Certificate" for student.
  2. Student downloads PDF.
- **Expected result**: PDF generated with QR Code and Verification Hash.
- **Database changes**: `Certificates` table inserted with unique `VerificationHash`.
- **APIs invoked**: `POST /api/certificates/generate`, `GET /api/certificates/download`
- **Common failure cases**: PDF-lib rendering error.
- **Pass/Fail criteria**: Valid PDF generated with dynamic text.

## 15. Certificate Verification
- **Prerequisites**: Generated Certificate.
- **Test account(s)**: Guest.
- **Starting URL**: `/verify/[certId]`
- **Exact navigation path**: Scan QR Code or go to URL.
- **Test data required**: Valid `VerificationHash`.
- **Step-by-step actions**:
  1. Load verification URL.
- **Expected result**: Page displays "Valid Certificate" with Student Name and Course.
- **Database changes**: None.
- **APIs invoked**: `GET /api/certificates/verify?hash=[certId]`
- **Common failure cases**: "Invalid/Revoked" shown incorrectly.
- **Pass/Fail criteria**: Accurately validates genuine certificates and rejects fake ones.

## 16. Reports
- **Prerequisites**: Admin/TM access.
- **Test account(s)**: Admin.
- **Starting URL**: `/admin/reports`
- **Exact navigation path**: Admin Dashboard → Reports
- **Test data required**: Platform activity.
- **Step-by-step actions**:
  1. Generate "Monthly Revenue Report".
  2. Export to CSV.
- **Expected result**: Clean CSV downloaded.
- **Database changes**: None.
- **APIs invoked**: `GET /api/admin/reports`
- **Common failure cases**: Empty CSV.
- **Pass/Fail criteria**: Data accuracy in exported file.

## 17. Search
- **Prerequisites**: None.
- **Test account(s)**: Any.
- **Starting URL**: Top Navbar.
- **Exact navigation path**: Global Search Input.
- **Test data required**: Existing Course Title.
- **Step-by-step actions**:
  1. Type "Centum VP".
- **Expected result**: Autocomplete suggestions show matching courses/materials.
- **Database changes**: None.
- **APIs invoked**: `GET /api/search?q=Centum`
- **Common failure cases**: Slow debounce.
- **Pass/Fail criteria**: Accurate and fast search results.

## 18. Messaging
- **Prerequisites**: Authenticated users.
- **Test account(s)**: Student & Trainer.
- **Starting URL**: Navbar Message Icon.
- **Exact navigation path**: Messages → New Message
- **Test data required**: Target User ID.
- **Step-by-step actions**:
  1. Student sends message to Trainer.
  2. Trainer checks inbox.
- **Expected result**: Message appears in Trainer inbox unread.
- **Database changes**: `Messages` table inserted.
- **APIs invoked**: `POST /api/messages`
- **Common failure cases**: Message not arriving.
- **Pass/Fail criteria**: Real-time or DB-backed delivery successful.

## 19. Announcements
- **Prerequisites**: Admin access.
- **Test account(s)**: Admin.
- **Starting URL**: `/admin/announcements`
- **Exact navigation path**: Admin Dashboard → Announcements
- **Test data required**: None.
- **Step-by-step actions**:
  1. Create Global Announcement.
- **Expected result**: All users see banner on next login.
- **Database changes**: `Announcements` table inserted.
- **APIs invoked**: `POST /api/admin/announcements`
- **Common failure cases**: Banner dismiss fails.
- **Pass/Fail criteria**: Visible to intended roles only.

## 20. Notifications
- **Prerequisites**: System event triggers (e.g., Course Assigned).
- **Test account(s)**: Trainer.
- **Starting URL**: `/trainer`
- **Exact navigation path**: Notification Bell.
- **Test data required**: Admin assigns course to Trainer.
- **Step-by-step actions**:
  1. Click Notification Bell.
  2. Click "Mark as Read".
- **Expected result**: Badge counter decreases.
- **Database changes**: `Notifications` table `IsRead` updated.
- **APIs invoked**: `POST /api/admin/notifications`
- **Common failure cases**: Bell count desync.
- **Pass/Fail criteria**: Read status persists.

## 21. Bulk Import
- **Prerequisites**: Admin access.
- **Test account(s)**: Admin.
- **Starting URL**: `/admin/users`
- **Exact navigation path**: Admin → Users → "Bulk Import"
- **Test data required**: Valid `.xlsx` or `.csv` file.
- **Step-by-step actions**:
  1. Upload CSV with 5 valid user rows.
  2. Click Import.
- **Expected result**: 5 new users created.
- **Database changes**: 5 inserts in `LMS_Users`.
- **APIs invoked**: `POST /api/admin/bulk-import`
- **Common failure cases**: Invalid email format throws 400.
- **Pass/Fail criteria**: Valid rows imported, invalid rows logged.

## 22. Bulk Export
- **Prerequisites**: Admin access.
- **Test account(s)**: Admin.
- **Starting URL**: `/admin/users`
- **Exact navigation path**: Admin → Users → "Export to Excel"
- **Test data required**: Populated `LMS_Users` table.
- **Step-by-step actions**:
  1. Click Export.
- **Expected result**: Browser downloads `.xlsx` file.
- **Database changes**: None.
- **APIs invoked**: `GET /api/admin/bulk-export?type=users`
- **Common failure cases**: Payload too large timeout.
- **Pass/Fail criteria**: Downloaded XLSX opens cleanly.

## 23. Password Reset
- **Prerequisites**: Existing User.
- **Test account(s)**: Guest.
- **Starting URL**: `/login`
- **Exact navigation path**: Login → "Forgot Password"
- **Test data required**: Valid email.
- **Step-by-step actions**:
  1. Enter email, submit.
  2. Take token from DB (simulating email receipt).
  3. Navigate to `/reset-password?token=XYZ`.
  4. Enter new password.
- **Expected result**: Password updated, token invalidated.
- **Database changes**: `PasswordResetTokens` token deleted/burned. `LMS_Users` password hashed & updated.
- **APIs invoked**: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- **Common failure cases**: Expired token bypass.
- **Pass/Fail criteria**: Token works exactly once and respects 30m expiry.

## 24. User Management
- **Prerequisites**: Admin access.
- **Test account(s)**: Admin.
- **Starting URL**: `/admin/users`
- **Exact navigation path**: Admin → Users
- **Test data required**: Existing users.
- **Step-by-step actions**:
  1. Edit user role from "Student" to "Trainer".
- **Expected result**: User gains Trainer portal access.
- **Database changes**: `LMS_Users` role updated.
- **APIs invoked**: `PUT /api/admin/users`
- **Common failure cases**: Cannot edit self.
- **Pass/Fail criteria**: RBAC dynamically updates based on role.

## 25. Course Management
- **Prerequisites**: Admin access.
- **Test account(s)**: Admin.
- **Starting URL**: `/admin/courses`
- **Exact navigation path**: Admin → Courses
- **Test data required**: None.
- **Step-by-step actions**:
  1. Create new course "Safety Training 101".
  2. Upload Syllabus document.
- **Expected result**: Course active, document versioned in `CourseMaterialVersions`.
- **Database changes**: `LMS_Courses` inserted, `CourseMaterials` inserted.
- **APIs invoked**: `POST /api/admin/courses`, `POST /api/materials`
- **Common failure cases**: Missing required fields.
- **Pass/Fail criteria**: Course visible in Public Website catalog.

## 26. Settings
- **Prerequisites**: Admin access.
- **Test account(s)**: Admin.
- **Starting URL**: `/admin/settings`
- **Exact navigation path**: Admin → Settings
- **Test data required**: None.
- **Step-by-step actions**:
  1. Change Organization Logo URL and Primary Color.
- **Expected result**: Platform theme immediately updates.
- **Database changes**: `OrganizationBranding` updated.
- **APIs invoked**: `POST /api/admin/branding`
- **Common failure cases**: Invalid hex color.
- **Pass/Fail criteria**: Theme fully reactive to DB state.

## 27. System Health
- **Prerequisites**: Admin access.
- **Test account(s)**: Admin.
- **Starting URL**: `/admin`
- **Exact navigation path**: Admin Dashboard
- **Test data required**: None.
- **Step-by-step actions**:
  1. Observe System Health widget.
- **Expected result**: CPU, Memory, DB Latency, and Active Sessions display.
- **Database changes**: Query to `LMS_Sessions`.
- **APIs invoked**: `GET /api/admin/system-health`
- **Common failure cases**: DB Latency ping timeout.
- **Pass/Fail criteria**: Metrics resolve accurately in <1s.

## 28. Analytics Dashboard
- **Prerequisites**: Admin/TM access.
- **Test account(s)**: Admin.
- **Starting URL**: `/admin`
- **Exact navigation path**: Admin Dashboard
- **Test data required**: Populated enrollments and revenue data.
- **Step-by-step actions**:
  1. View Recharts line graph for "Revenue over last 6 months".
- **Expected result**: Graph accurately reflects DB aggregates.
- **Database changes**: None.
- **APIs invoked**: `GET /api/analytics`
- **Common failure cases**: Data arrays mismatched in chart.
- **Pass/Fail criteria**: Chart tooltips match actual DB records.

## 29. Security
- **Prerequisites**: Tools like Postman.
- **Test account(s)**: None.
- **Starting URL**: Any API.
- **Exact navigation path**: N/A
- **Test data required**: Invalid JWTs, high-frequency requests.
- **Step-by-step actions**:
  1. Spam `/api/auth/login` 50 times in 1 second.
  2. Pass malformed JWT to `/api/admin/users`.
- **Expected result**: Rate Limiter returns 429 Too Many Requests. Middleware blocks invalid JWT with 401.
- **Database changes**: Failed logins logged to `ErrorLogs`.
- **APIs invoked**: All.
- **Common failure cases**: Rate limiter bypassing.
- **Pass/Fail criteria**: Security middlewares properly intercept.

## 30. Error Logging
- **Prerequisites**: Admin access.
- **Test account(s)**: Admin.
- **Starting URL**: `/admin/error-logs`
- **Exact navigation path**: Admin → Error Logs
- **Test data required**: Trigger a forced error (e.g., bad bulk import).
- **Step-by-step actions**:
  1. Trigger error.
  2. View Error Logs UI.
- **Expected result**: Stack trace and timestamp visible in dashboard.
- **Database changes**: `ErrorLogs` inserted via `logger.ts`.
- **APIs invoked**: `GET /api/admin/error-logs`
- **Common failure cases**: DB connection failure logs failing to write.
- **Pass/Fail criteria**: All unhandled API rejections properly captured.

---

## Complete End-to-End Workflow Testing

**Goal**: Validate the complete lifecycle of a student taking a course.

1. **[Registration]**: Guest registers as `E2E_Student`.
2. **[Finance]**: Admin (Finance) approves offline payment, triggering `Enrollment`.
3. **[Training Manager]**: TM verifies `E2E_Student` is in `LMS_Courses` batch.
4. **[Admin]**: Admin assigns a `Trainer` to that batch.
5. **[Student]**: Student logs in, sees course in "My Registrations".
6. **[Attendance]**: Trainer logs in, marks Student as "Present".
7. **[Assessment]**: Trainer submits a Passing Grade (90) for Student.
8. **[Feedback]**: Student logs in, sees Course "Completed", submits 5-star Feedback.
9. **[Certificate]**: Student navigates to Certificates, clicks "Download".
10. **[Certificate Verification]**: Scan QR code on PDF, opens Public Verification Portal proving "Valid Certificate".

---

## QA Checklist

| Module | Feature | Pass/Fail | Notes |
|---|---|---|---|
| 1 | Public Website | `[ ]` | |
| 2 | Registration | `[ ]` | |
| 3 | Login | `[ ]` | |
| 4 | Student Portal | `[ ]` | |
| 5 | Trainer Portal | `[ ]` | |
| 6 | Training Manager Portal | `[ ]` | |
| 7 | Finance Portal | `[ ]` | |
| 8 | Admin Portal | `[ ]` | |
| 9 | Affiliate Portal | `[ ]` | |
| 10 | Calendar | `[ ]` | |
| 11 | Attendance | `[ ]` | |
| 12 | Assessments | `[ ]` | |
| 13 | Feedback | `[ ]` | |
| 14 | Certificates | `[ ]` | |
| 15 | Certificate Verification | `[ ]` | |
| 16 | Reports | `[ ]` | |
| 17 | Search | `[ ]` | |
| 18 | Messaging | `[ ]` | |
| 19 | Announcements | `[ ]` | |
| 20 | Notifications | `[ ]` | |
| 21 | Bulk Import | `[ ]` | |
| 22 | Bulk Export | `[ ]` | |
| 23 | Password Reset | `[ ]` | |
| 24 | User Management | `[ ]` | |
| 25 | Course Management | `[ ]` | |
| 26 | Settings | `[ ]` | |
| 27 | System Health | `[ ]` | |
| 28 | Analytics Dashboard | `[ ]` | |
| 29 | Security | `[ ]` | |
| 30 | Error Logging | `[ ]` | |
| **E2E** | Full Lifecycle Workflow | `[ ]` | |

**Document Generated**: Based exclusively on exact current project APIs, Database schema, and Router configurations of the Yokogawa Training Services LMS platform.
