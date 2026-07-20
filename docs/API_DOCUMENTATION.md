# API Documentation

## Authentication APIs
- `POST /api/auth/login`: Authenticates user, creates LMS_Session, returns JWT.
- `POST /api/auth/logout`: Invalidates session.
- `POST /api/auth/forgot-password`: Generates reset token.
- `POST /api/auth/reset-password`: Resets password using token.

## Administration APIs
- `GET /api/admin/system-health`: Returns DB, memory, and CPU health metrics.
- `GET /api/admin/error-logs`: Retrieves enterprise error logs.
- `GET|PUT /api/admin/branding`: Manages organization branding.
- `POST /api/admin/bulk-import`: Accepts `type` and `file` to import Users, Courses, or Calendar.
- `GET /api/admin/bulk-export`: Generates Excel export for Users, Courses, Payments, Certificates.

## Learning APIs
- `GET|POST|DELETE /api/materials`: Manages course materials with versioning.
- `GET /api/certificates/verify?certNo={hash}`: Publicly verifies a certificate's authenticity.
- `GET /api/certificates/download?id={certId}`: Generates a PDF certificate with an embedded QR code.
