# HirePro - Product Requirements Document (PRD)

| Field        | Value                               |
| ------------ | ----------------------------------- |
| Project      | HirePro                             |
| Document     | Product Requirements Document (PRD) |
| Version      | 1.0                                 |
| Status       | Draft                               |
| Author       | Karthik Reddy                       |
| Last Updated | August 2026                         |

---

# 1. Overview

HirePro is an AI-assisted hiring platform that simplifies the early stages of recruitment by helping recruiters efficiently evaluate candidates while providing applicants with meaningful and actionable resume feedback.

The platform is designed to reduce manual effort during resume screening, improve consistency in candidate evaluation, and create a transparent hiring experience.

Phase 1 focuses on building an AI-powered ATS scoring platform that allows recruiters to publish jobs, candidates to apply using resumes, and AI to generate compatibility scores and personalized feedback.

---

# 2. Goals

## Business Goals

- Reduce recruiter effort during resume screening.
- Improve the candidate application experience.
- Provide transparent and actionable AI feedback.
- Increase consistency in resume evaluation.
- Build a scalable foundation for future AI hiring features.

## Engineering Goals

- Build a production-ready application.
- Follow clean architecture and modular design.
- Maintain high code quality through testing and linting.
- Design scalable REST APIs.
- Ensure security by default.
- Build reliable and fault-tolerant services.
- Maintain comprehensive documentation.
- Follow industry-standard software engineering practices.

---

# 3. Stakeholders

## Primary Stakeholders

### Candidates

Individuals searching for jobs and applying using their resumes.

### Recruiters

Users responsible for creating organizations, posting jobs, and reviewing applicants.

---

## Secondary Stakeholders

### Organization Owners

Users responsible for managing an organization's hiring process.

### Future Platform Administrators

Responsible for platform management, moderation, and analytics.

---

# 4. Business Requirements

The system shall allow recruiters to:

- Create organizations.
- Create and manage job postings.
- Receive job applications.
- View ranked candidates.
- Review AI-generated ATS scores.
- Review AI-generated resume feedback.

The system shall allow candidates to:

- Register and authenticate.
- Manage multiple resumes.
- Browse job openings.
- Apply for jobs.
- View ATS scores.
- Receive AI-generated resume feedback.
- Track submitted applications.

---

# 5. Functional Requirements

## Authentication

- User Registration
- Login
- Logout
- Email Verification
- Forgot Password
- Password Reset
- JWT Authentication
- Refresh Tokens
- Session Management

---

## User Profile

- Update Profile
- Upload Profile Picture (Future)
- Manage Contact Information

---

## Resume Management

- Upload Multiple Resumes
- Update Resume
- Delete Resume
- Set Default Resume
- Select Resume During Job Application

---

## Organization

- Create Organization
- View Organization
- Update Organization Information

---

## Recruiter

- Create Job Posting
- Edit Job
- Close Job
- View Applicants
- View Candidate Scores

---

## Candidate

- Browse Jobs
- Search Jobs
- View Job Details
- Apply for Jobs
- View Applied Jobs
- Track Application Status

---

## AI Evaluation

- Resume Validation
- Resume Parsing
- Skill Extraction
- Education Extraction
- Experience Extraction
- ATS Compatibility Score
- Resume Feedback Generation
- Store Evaluation Results

---

## Dashboard

### Recruiter Dashboard

- Organization Overview
- Job Listings
- Applicants
- Candidate Rankings
- Resume Scores

### Candidate Dashboard

- Applied Jobs
- ATS Scores
- AI Feedback
- Resume Management

---

# 6. Non-Functional Requirements

## Security

- Password hashing
- Secure JWT authentication
- HTTP-only cookies
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection
- File upload validation
- Secure environment variables

---

## Performance

- Fast API response times
- Optimized database queries
- Efficient resume parsing
- Pagination for large datasets

---

## Reliability

- Graceful error handling
- Retry mechanisms for AI failures
- Consistent AI evaluation results
- Data integrity

---

## Scalability

- Modular architecture
- Stateless backend
- Database indexing
- Horizontal scalability support

---

## Maintainability

- Clean Architecture
- Modular codebase
- SOLID principles
- Repository Pattern
- Service Layer
- DTO Validation

---

## Observability

- Structured logging
- Error logging
- Request logging
- Health check endpoint

---

## Testing

- Unit Tests
- Integration Tests
- End-to-End Tests
- API Testing

---

## Deployment

- Docker
- Docker Compose
- Environment configuration
- Database migrations

---

# 7. User Roles

## User

Base identity of every registered account.

A user can become both a candidate and a recruiter using the same account.

---

## Candidate

Can:

- Upload resumes
- Apply for jobs
- Receive AI feedback
- View ATS scores

---

## Recruiter

Can:

- Create organizations
- Create job postings
- Review applicants
- View AI evaluations

---

## Organization Owner

Can:

- Manage organization
- Manage job postings
- View applicants

---

## Platform Admin (Future)

Responsible for platform management.

---

# 8. User Journeys

## Candidate Journey

Register

↓

Verify Email

↓

Complete Profile

↓

Upload Resume

↓

Browse Jobs

↓

Apply

↓

AI Evaluation

↓

View ATS Score

↓

Receive Feedback

---

## Recruiter Journey

Register

↓

Create Organization

↓

Create Job Posting

↓

Receive Applications

↓

View AI Scores

↓

Review Candidates

↓

Shortlist

---

# 9. User Stories

### Candidate

As a candidate, I want to upload multiple resumes so that I can tailor applications for different jobs.

As a candidate, I want AI feedback so that I can improve my resume.

As a candidate, I want to track my applications.

---

### Recruiter

As a recruiter, I want to create job postings.

As a recruiter, I want candidates ranked automatically.

As a recruiter, I want AI-generated resume analysis.

---

# 10. MVP Scope (Phase 1)

Included:

- User Authentication
- Candidate Profile
- Resume Management
- Organization Creation
- Job Posting
- Job Browsing
- Job Application
- Resume Parsing
- ATS Score Generation
- AI Resume Feedback
- Recruiter Dashboard
- Candidate Dashboard
- Dockerized Deployment
- Automated Testing
- Documentation

---

# 11. Out of Scope

The following features are excluded from Phase 1:

- AI Screening Calls
- AI Interview Generation
- AI Interview Evaluation
- Recruiter Invitations
- Multiple Recruiters per Organization
- Subscription & Billing
- Payments
- Calendar Integration
- Chat System
- Recommendation Engine
- Mobile Application
- Advanced Analytics

---

# 12. Assumptions

- Users upload PDF resumes.
- AI provider remains available.
- Organizations initially contain only one owner.
- Resume evaluation occurs once per application.
- Candidates may maintain multiple resumes.
- Internet connectivity is available.
- Email service is operational.

---

# 13. Constraints

- Single developer project.
- Approximately three-week timeline for Phase 1.
- Limited AI budget using free-tier APIs.
- Limited cloud infrastructure budget.
- First large-scale TypeScript project.
- PostgreSQL selected as the primary database.

---

# 14. Success Metrics

Phase 1 will be successful when:

- Recruiters can create organizations.
- Recruiters can publish jobs.
- Candidates can upload multiple resumes.
- Candidates can apply using a selected resume.
- AI generates ATS scores successfully.
- AI generates meaningful feedback.
- Recruiters can review ranked applicants.
- Candidates can access stored evaluation results.
- The application is deployable using Docker.
- Core functionality is covered by automated tests.

---

# 15. Risks

- AI API rate limits.
- AI response inconsistency.
- Resume parsing failures.
- Large file uploads.
- Third-party service outages.
- Learning curve for new technologies.
- Scope creep.
- Security vulnerabilities.

---

# 16. Future Enhancements

- Recruiter Invitations
- Multi-member Organizations
- AI Screening Calls
- AI Interview Generation
- AI Interview Evaluation
- Candidate Skill Gap Analysis
- Resume Version Comparison
- Advanced Analytics
- Email Automation
- Notifications
- Audit Logs
- Recommendation Engine
- Subscription & Billing
- Mobile Application

---

# 17. Engineering Decisions

| Decision                                       | Rationale                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| Single User model                              | One identity can act as both candidate and recruiter.                   |
| Separate CandidateProfile and RecruiterProfile | Keeps domain models flexible and extensible.                            |
| Organizations own jobs                         | Supports future collaboration and multi-tenancy.                        |
| OrganizationMember table from Phase 1          | Enables future recruiter invitations without redesign.                  |
| Multiple resumes per candidate                 | Allows job-specific resume customization.                               |
| AI evaluation generated once per application   | Improves consistency, reduces cost, and increases performance.          |
| PostgreSQL                                     | Strong relational modeling, transactions, indexing, and data integrity. |
| REST APIs                                      | Simple, well-understood architecture for Phase 1.                       |
| JWT Authentication                             | Stateless authentication with secure session management.                |

---

# 18. Acceptance Criteria

Phase 1 is considered complete when:

- Users can register, verify their email, log in, and log out.
- Recruiters can create an organization.
- Recruiters can create and manage job postings.
- Candidates can upload and manage multiple resumes.
- Candidates can browse and apply for jobs.
- AI performs resume parsing, ATS scoring, and feedback generation once per application.
- Recruiters can view applicants ranked by AI score.
- Candidates can view stored ATS scores and AI feedback.
- Core workflows are covered by automated tests.
- The application is fully documented and deployable using Docker.
