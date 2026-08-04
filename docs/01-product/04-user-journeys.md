# HirePro - User Journeys

| Field        | Value         |
| ------------ | ------------- |
| Project      | HirePro       |
| Document     | User Journeys |
| Version      | 1.0           |
| Status       | Draft         |
| Author       | Karthik Reddy |
| Last Updated | August 2026   |

---

# 1. Purpose

This document defines the primary user journeys within HirePro.

A user journey describes how a user achieves a business goal by interacting with the system. These journeys serve as the foundation for designing the database schema, REST APIs, frontend routing, authorization rules, and automated test cases.

The workflows described here focus on **Phase 1** of the product.

---

# 2. User Journey Overview

| Journey ID | Journey                             | Persona            |
| ---------- | ----------------------------------- | ------------------ |
| UJ-01      | User Registration                   | User               |
| UJ-02      | Candidate Onboarding                | Candidate          |
| UJ-03      | Create Organization                 | Organization Owner |
| UJ-04      | Create Job Posting                  | Organization Owner |
| UJ-05      | Browse Jobs                         | Candidate          |
| UJ-06      | Apply for Job                       | Candidate          |
| UJ-07      | AI Resume Evaluation                | System             |
| UJ-08      | Review Applicants                   | Organization Owner |
| UJ-09      | View ATS Score & Feedback           | Candidate          |
| UJ-10      | Authentication & Session Management | User               |

---

# UJ-01 — User Registration

## Goal

Allow a visitor to create a HirePro account.

### Preconditions

- User is not logged in.
- Email address is not already registered.

### Main Flow

1. User opens the registration page.
2. User enters personal information.
3. User submits the registration form.
4. System validates the input.
5. User account is created.
6. Verification email is sent.
7. User verifies the email.
8. User is redirected to the dashboard.

### Failure Scenarios

- Invalid email.
- Weak password.
- Email already exists.
- Email delivery failure.

### Postconditions

- User account exists.
- Email is verified.
- User can access HirePro.

---

# UJ-02 — Candidate Onboarding

## Goal

Prepare a new user to apply for jobs.

### Preconditions

- User is authenticated.

### Main Flow

1. User completes profile information.
2. User uploads one or more resumes.
3. User selects a default resume.
4. Candidate dashboard is available.

### Failure Scenarios

- Unsupported file type.
- Resume exceeds size limit.
- Resume upload failure.

### Postconditions

- Candidate profile is complete.
- Resume is available for future applications.

---

# UJ-03 — Create Organization

## Goal

Enable a user to start hiring.

### Preconditions

- User is authenticated.
- User does not already own an organization.

### Main Flow

1. User clicks **Start Hiring**.
2. System checks organization membership.
3. User creates an organization.
4. System creates the organization.
5. User becomes the Organization Owner.
6. Organization dashboard is displayed.

### Failure Scenarios

- Organization name already exists (if uniqueness is enforced).
- Validation errors.
- Database failure.

### Postconditions

- Organization exists.
- User has recruiter capabilities.

---

# UJ-04 — Create Job Posting

## Goal

Publish a job opening.

### Preconditions

- User is Organization Owner.

### Main Flow

1. User opens the organization dashboard.
2. User selects **Create Job**.
3. User enters job details.
4. System validates the input.
5. Job is published.
6. Job becomes visible to candidates.

### Failure Scenarios

- Missing required fields.
- Invalid salary range.
- Database failure.

### Postconditions

- Job is available for applications.

---

# UJ-05 — Browse Jobs

## Goal

Allow candidates to discover job opportunities.

### Preconditions

- User is authenticated.

### Main Flow

1. User opens the Jobs page.
2. System loads available jobs.
3. User searches or filters jobs.
4. User views job details.
5. User selects a job to apply.

### Failure Scenarios

- No jobs available.
- Search returns no results.
- Network failure.

### Postconditions

- Candidate identifies a job of interest.

---

# UJ-06 — Apply for Job

## Goal

Submit an application.

### Preconditions

- Candidate is authenticated.
- Candidate has at least one resume.
- Job is open for applications.

### Main Flow

1. Candidate opens a job.
2. Candidate selects an existing resume or uploads a new one.
3. Candidate submits the application.
4. Application record is created.
5. AI evaluation begins.
6. Candidate receives confirmation.

### Failure Scenarios

- Duplicate application.
- Resume missing.
- Job closed.
- AI service unavailable.
- Validation failure.

### Postconditions

- Application is stored.
- AI evaluation is triggered.

---

# UJ-07 — AI Resume Evaluation

## Goal

Evaluate a candidate's resume against the selected job.

### Preconditions

- Application exists.

### Main Flow

1. Resume is validated.
2. Resume is parsed.
3. Candidate information is extracted.
4. Job description is analyzed.
5. ATS score is generated.
6. AI feedback is generated.
7. Evaluation results are stored.

### Failure Scenarios

- Resume parsing failure.
- AI timeout.
- AI API error.
- Invalid response format.

### Postconditions

- ATS score is stored.
- Feedback is stored.
- Recruiter and candidate can access the results.

---

# UJ-08 — Review Applicants

## Goal

Help recruiters evaluate candidates efficiently.

### Preconditions

- Recruiter owns the organization.
- Job has applications.

### Main Flow

1. Recruiter opens the organization dashboard.
2. Recruiter selects a job.
3. System loads applicants.
4. Applicants are sorted by ATS score.
5. Recruiter reviews AI feedback.
6. Recruiter shortlists candidates (future enhancement).

### Failure Scenarios

- No applicants.
- Failed data retrieval.

### Postconditions

- Recruiter identifies promising candidates.

---

# UJ-09 — View ATS Score & Feedback

## Goal

Allow candidates to understand their resume evaluation.

### Preconditions

- Application evaluation has completed.

### Main Flow

1. Candidate opens the dashboard.
2. Candidate selects an application.
3. ATS score is displayed.
4. AI-generated feedback is displayed.

### Failure Scenarios

- Evaluation incomplete.
- AI processing failed.

### Postconditions

- Candidate understands resume strengths and weaknesses.

---

# UJ-10 — Authentication & Session Management

## Goal

Provide secure access to the platform.

### Main Flow

- Login
- Logout
- Session validation
- Token refresh
- Forgot password
- Password reset

### Failure Scenarios

- Invalid credentials.
- Expired session.
- Invalid token.
- Password reset token expired.

### Postconditions

- User authentication state is updated securely.

---

# 3. Common Business Rules

- Every user has exactly one account.
- A user may be both a candidate and an organization owner.
- One organization per owner during Phase 1.
- Candidates may maintain multiple resumes.
- Each application references the specific resume used.
- AI evaluation is generated exactly once per application.
- ATS scores are stored and never recalculated automatically.
- Organizations own job postings.
- Candidates cannot apply to closed jobs.
- Duplicate applications for the same job are not allowed.

---

# 4. Future Journey Enhancements

Future releases may introduce additional journeys, including:

- Invite Recruiter
- Join Organization
- AI Screening Calls
- AI Interview Generation
- Interview Scheduling
- Offer Management
- Email Notifications
- Billing & Subscription
- Team Collaboration
- Platform Administration

---

# 5. Design Notes

The user journeys documented here will be used as the source of truth for:

- Database schema design
- Entity relationships
- REST API design
- Authorization rules
- Frontend routing
- State management
- Integration testing
- End-to-end testing
- Sequence diagrams
- System architecture documentation
