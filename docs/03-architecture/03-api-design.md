# HirePro – API Design & REST Contract

| Field        | Value                      |
| ------------ | -------------------------- |
| Project      | HirePro                    |
| Document     | API Design & REST Contract |
| Version      | 1.0                        |
| Status       | Draft                      |
| Author       | Karthik Reddy              |
| Last Updated | August 2026                |

---

# 1. Purpose

This document defines the REST API contract for HirePro Phase 1.

It establishes a consistent API design that enables independent frontend and backend development while maintaining a predictable interface.

The API follows RESTful principles and is versioned to support future evolution without breaking existing clients.

---

# 2. API Design Principles

The API follows these principles:

- RESTful resource design
- Versioned endpoints
- Stateless requests
- Consistent JSON responses
- Secure by default
- Predictable error handling
- Idempotent operations where applicable
- Validation before business logic
- Clear HTTP status codes

---

# 3. Base URL

```text
/api/v1
```

Future versions:

```text
/api/v2
```

---

# 4. Authentication

Authentication uses:

- Access Token (JWT)
- Refresh Token
- HTTP-only Cookies

Protected endpoints require an authenticated user.

---

# 5. Standard Response Format

## Success

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

---

## Error

```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": []
}
```

---

# 6. HTTP Status Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Resource Created      |
| 204  | No Content            |
| 400  | Bad Request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 422  | Validation Failed     |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |

---

# 7. API Resources

Phase 1 exposes the following resources:

- Authentication
- Users
- Candidate Profiles
- Organizations
- Organization Members
- Resumes
- Jobs
- Applications
- AI Evaluations

---

# 8. Authentication APIs

| Method | Endpoint              | Description            | Auth |
| ------ | --------------------- | ---------------------- | ---- |
| POST   | /auth/register        | Register account       | No   |
| POST   | /auth/login           | Login                  | No   |
| POST   | /auth/logout          | Logout                 | Yes  |
| POST   | /auth/refresh         | Refresh access token   | Yes  |
| GET    | /auth/me              | Current user           | Yes  |
| POST   | /auth/verify-email    | Verify email           | No   |
| POST   | /auth/forgot-password | Request password reset | No   |
| POST   | /auth/reset-password  | Reset password         | No   |

---

# 9. User APIs

| Method | Endpoint  |
| ------ | --------- |
| GET    | /users/me |
| PATCH  | /users/me |

---

# 10. Candidate Profile APIs

| Method | Endpoint           |
| ------ | ------------------ |
| GET    | /candidate/profile |
| PATCH  | /candidate/profile |

---

# 11. Resume APIs

| Method | Endpoint                    |
| ------ | --------------------------- |
| GET    | /resumes                    |
| POST   | /resumes                    |
| GET    | /resumes/{resumeId}         |
| PATCH  | /resumes/{resumeId}         |
| DELETE | /resumes/{resumeId}         |
| PATCH  | /resumes/{resumeId}/default |

---

# 12. Organization APIs

| Method | Endpoint                        |
| ------ | ------------------------------- |
| POST   | /organizations                  |
| GET    | /organizations/me               |
| PATCH  | /organizations/{organizationId} |

Phase 1 supports one organization per owner.

---

# 13. Organization Member APIs

| Method | Endpoint                                |
| ------ | --------------------------------------- |
| GET    | /organizations/{organizationId}/members |

Future versions will include:

- Invite member
- Remove member
- Change role

---

# 14. Job APIs

| Method | Endpoint              |
| ------ | --------------------- |
| GET    | /jobs                 |
| GET    | /jobs/{jobId}         |
| POST   | /jobs                 |
| PATCH  | /jobs/{jobId}         |
| DELETE | /jobs/{jobId}         |
| PATCH  | /jobs/{jobId}/publish |
| PATCH  | /jobs/{jobId}/close   |

---

# 15. Application APIs

| Method | Endpoint                               |
| ------ | -------------------------------------- |
| POST   | /jobs/{jobId}/apply                    |
| GET    | /applications/me                       |
| GET    | /applications/{applicationId}          |
| PATCH  | /applications/{applicationId}/withdraw |

Recruiters:

| Method | Endpoint                      |
| ------ | ----------------------------- |
| GET    | /jobs/{jobId}/applications    |
| GET    | /applications/{applicationId} |

---

# 16. AI Evaluation APIs

| Method | Endpoint                                 |
| ------ | ---------------------------------------- |
| GET    | /applications/{applicationId}/evaluation |

Future:

| Method | Endpoint                                  |
| ------ | ----------------------------------------- |
| POST   | /applications/{applicationId}/re-evaluate |

---

# 17. Authorization Matrix

| Resource            | Candidate | Organization Owner  |
| ------------------- | --------- | ------------------- |
| Browse Jobs         | ✅        | ✅                  |
| Apply Job           | ✅        | ❌                  |
| Upload Resume       | ✅        | ✅                  |
| Create Organization | ✅        | ✅                  |
| Create Job          | ❌        | ✅                  |
| Review Applicants   | ❌        | ✅                  |
| View Own ATS Report | ✅        | ✅ (Applicant View) |

---

# 18. Pagination

Collection endpoints should support:

```text
?page=1
&limit=20
```

Optional future support:

```text
?cursor=
```

---

# 19. Filtering

Examples:

```text
/jobs?location=Remote

/jobs?experience=2

/jobs?type=Full-Time

/jobs?status=Published
```

---

# 20. Sorting

Examples:

```text
?sort=createdAt

?order=desc
```

---

# 21. Search

Examples:

```text
/jobs?search=Backend

/jobs?search=React
```

---

# 22. Validation Strategy

All requests are validated before reaching business logic.

Validation includes:

- Required fields
- Email format
- Password strength
- File size
- File type
- UUID format
- Business rules

---

# 23. Error Handling

Every endpoint returns a consistent error structure.

Errors should never expose:

- Database details
- Stack traces
- Internal implementation

---

# 24. Rate Limiting

Future implementation:

Authentication endpoints:

- Strict limits

Public APIs:

- Moderate limits

Protected APIs:

- Higher limits

---

# 25. Idempotency

Operations that should be idempotent:

- Logout
- Refresh Token
- Resume Default Selection

Future payment APIs should support idempotency keys.

---

# 26. API Versioning

Current version:

```text
/api/v1
```

Breaking changes will introduce:

```text
/api/v2
```

Older versions remain supported for a defined deprecation period.

---

# 27. API Security

Security measures include:

- JWT authentication
- Refresh tokens
- HTTP-only cookies
- Request validation
- Authorization checks
- File upload validation
- CORS configuration
- Secure headers
- Future CSRF protection
- Future rate limiting

---

# 28. Future APIs

The following APIs are planned for future releases:

- Recruiter Invitations
- AI Screening Calls
- AI Interview Sessions
- Interview Scheduling
- Candidate Notes
- Email Notifications
- Organization Analytics
- Audit Logs
- Billing & Subscriptions
- Platform Administration

---

# 29. API Lifecycle

Typical request flow:

```text
Client
   │
   ▼
Route
   │
   ▼
Middleware
(Authentication)
   │
   ▼
Validation
(Zod)
   │
   ▼
Controller
   │
   ▼
Service
(Business Logic)
   │
   ▼
Repository
   │
   ▼
Prisma ORM
   │
   ▼
PostgreSQL
```

---

# 30. Summary

The HirePro API is designed around RESTful principles with a focus on consistency, security, and maintainability.

Each endpoint represents a business resource, follows a predictable request and response structure, and is protected through centralized authentication, authorization, validation, and error handling.

The API is intentionally versioned and modular, allowing future expansion without breaking existing integrations.
