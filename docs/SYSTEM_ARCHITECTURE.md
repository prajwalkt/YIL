# System Architecture

## Overview
Yokogawa Training Services (YTS) LMS is a monolithic Next.js application leveraging the App Router. It serves as both the frontend client and backend API, interacting with a Microsoft SQL Server database.

## Architecture Tiers
1. **Presentation Layer (Frontend)**
   - **Framework**: Next.js (React 19)
   - **Styling**: Tailwind CSS
   - **Components**: Reusable UI components (Modals, Tables, Charts via Recharts).
2. **Application Layer (Backend API)**
   - **Framework**: Next.js API Routes (`app/api/*`)
   - **Authentication**: JWT-based stateless authentication with Session validation in DB.
   - **Rate Limiting**: Custom in-memory rate limiter per IP/Context.
3. **Data Layer**
   - **Database**: Microsoft SQL Server
   - **Driver**: `mssql` npm package
   - **File Storage**: Local File System (`public/galleryImages`, `public/manuals_repo`)

## Security Architecture
- **Authentication**: JWT stored in `httpOnly` secure cookies.
- **Session Management**: Single-device session enforcement for Students/Affiliates using `LMS_Sessions` table.
- **Authorization**: Role-Based Access Control (RBAC) middleware verifying JWT payload.
- **Audit Logging**: Sensitive actions logged to `AuditLog`.
- **Error Handling**: Centralized `ErrorLogs` logging via `logger.ts`.
