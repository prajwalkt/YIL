# Calendar and Registration Test Report
**Project:** YTS LMS Platform
**Date:** August 18, 2026

This report details the investigation, root cause analysis, and applied fixes for the Training Calendar selection and Registration flow issues. 

## 1. Issue Description

**Reported Symptoms:**
1. Users could not select a batch on the public Training Calendar; the selection would briefly highlight and immediately reset to unselected.
2. The registration form displayed "No Batches Available" and "There are currently no scheduled batches for this category" despite there being active batches in the system.

## 2. Root Cause Analysis

### A. Calendar Selection Reset (UI Flicker)
*   **Cause:** The `ModernCalendar` component had a `setInterval` function aggressively polling the backend every 10 seconds.
*   **Effect:** Each poll forced a complete re-render of the calendar component, which wiped out any transient UI state, including the user's selected batch, causing the "flicker" and inability to proceed.

### B. "No Batches Available" (Data & Filtering Mismatch)
*   **Cause 1 (Filter Mismatch):** The database `TrainingType` values (`CILT`, `VILT`) did not match the strict filtering criteria expected by the frontend (`Classroom Training`, `Online Training`). 
*   **Cause 2 (Dropdown Mismatch):** The course titles in the dropdown (e.g., "CENTUM VP DCS Fundamentals") did not exactly match the `Title` stored in the `TrainingCalendar` records, breaking the correlation logic.
*   **Effect:** The frontend application correctly loaded the data but filtered all of it out because the codes didn't align, resulting in an empty batch list being passed to the registration form.

## 3. Implemented Fixes

### 1. `ModernCalendar` Component Overhaul
*   **Removed Aggressive Polling:** Deleted the 10-second `setInterval` to prevent state wiping and reduce unnecessary server load. Added a manual "Refresh" button for users instead.
*   **Improved Filtering:** Updated the filtering logic to be case-insensitive and to map abbreviated codes (`CILT`, `VILT`, `SITE`) to their human-readable equivalents in the UI.

### 2. `RegistrationForm` Component Fixes
*   **State Management:** Introduced a `selectedBatch` state object to persist the selected item across re-renders and pass correct context down the tree.
*   **Fuzzy Matching:** Implemented fuzzy matching between the dropdown course selections and the database course titles to ensure proper linkage.

### 3. Backend & Data Layer Enhancements
*   **Reseed Script:** Created `mysql_reseed_calendar.js` to automatically clean and align database `TrainingType` and `Title` values with the application's expectations.
*   **SQL Connection Resiliency:** Updated `app/library/db.ts` to improve the MySQL connection pool. Added `connectTimeout` and `keepAlive` settings, and removed blocking initialization checks to ensure the application can auto-recover if the database temporarily goes down.
*   **API Improvements:** Fixed `app/api/calendar/route.ts` to properly `JOIN` the `LMS_Users` table for the `TrainerName` and correctly calculate available seats using `Math.max()` against seeded data.

## 4. Test Results

**Important Note:** Complete end-to-end browser workflow testing (verifying the final submission) is currently blocked. The temporary MySQL database hosted on the macOS machine (192.168.1.2) is experiencing a TCP connection timeout (`connect ETIMEDOUT`) and is unreachable from the Next.js development server. 

**Verified Steps:**
✅ Component polling issue resolved.
✅ Registration form state management verified through unit inspection.
✅ Database compatibility shim (`db.ts`) updated for resilience.
✅ Calendar API route updated to provide correct relational data.

**Pending Validation (Requires DB Connectivity):**
⏳ User can select a batch on the Calendar and have it persist.
⏳ Registration form correctly displays the selected batch context.
⏳ Registration submission writes to the `Registrations` table correctly.

**Next Steps:**
Please verify that the MySQL instance on the macOS machine is running and that port `3306` is open to the Windows machine. Once connectivity is restored, the application will auto-reconnect, and the final browser workflow can be tested.
