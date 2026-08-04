# HirePro - Domain Model & Business Rules

| Field        | Value                         |
| ------------ | ----------------------------- |
| Project      | HirePro                       |
| Document     | Domain Model & Business Rules |
| Version      | 1.0                           |
| Status       | Draft                         |
| Author       | Karthik Reddy                 |
| Last Updated | August 2026                   |

---

# 1. Purpose

This document defines the core business domain of HirePro.

Rather than focusing on database tables or implementation details, it describes the business entities, their responsibilities, ownership, relationships, and the business rules that govern them.

This document serves as the foundation for:

- Database schema design
- REST API design
- Authorization (RBAC)
- Business logic implementation
- System architecture
- Automated testing

---

# 2. Domain Overview

HirePro is an AI-assisted hiring platform that helps organizations efficiently evaluate candidates while providing applicants with actionable feedback on their resumes.

The platform follows a **single identity model**.

Every person has one account. Additional capabilities are granted as they interact with the platform instead of requiring separate account types.

Examples:

- A user can browse jobs.
- Uploading resumes enables candidate capabilities.
- Creating an organization enables recruiter capabilities.
- The same account may apply for jobs while also managing an organization.

Identity remains constant while permissions evolve.

---

# 3. Core Domain Principles

## 3.1 Single Identity

Every person owns exactly one user account.

Roles are represented through capabilities and organization membership rather than separate account types.

---

## 3.2 Organizations Own Hiring

Organizations own:

- Job postings
- Recruiter memberships
- Hiring activities

Individual users never own jobs directly.

---

## 3.3 Applications Are Historical Records

An application represents a completed business event.

Once submitted:

- The selected resume never changes.
- AI evaluation never changes automatically.
- Historical information is preserved.

---

## 3.4 AI Evaluation Runs Once

Every application receives exactly one AI evaluation.

The evaluation contains:

- Parsed resume data
- ATS score
- AI feedback

Results are stored permanently.

---

## 3.5 Resume Independence

Candidates may maintain multiple resumes.

Each application references exactly one resume.

Editing a resume after submitting an application does not modify previous applications.

---

# 4. Core Domain Entities

---

# 4.1 User

## Purpose

Represents the identity of every person using HirePro.

## Responsibilities

- Authentication
- Account management
- Email verification
- Profile ownership

## Owned By

HirePro Platform

## Relationships

- One Candidate Profile
- One Organization (optional)
- Many Organization Memberships (future)

---

# 4.2 Candidate Profile

## Purpose

Stores career-related information for a user.

## Responsibilities

- Candidate information
- Resume management
- Job applications
- Career preferences

## Owned By

User

## Relationships

- Belongs to one User
- Owns many Resumes
- Owns many Applications

---

# 4.3 Organization

## Purpose

Represents a company hiring through HirePro.

## Responsibilities

- Organization information
- Job postings
- Recruiter management
- Hiring activities

## Owned By

Organization Owner

## Relationships

- Has many Jobs
- Has many Members
- Has one Owner

---

# 4.4 Organization Member

## Purpose

Represents membership inside an organization.

This entity enables future support for invitations, role-based permissions, and multiple recruiters.

## Responsibilities

- Membership
- Authorization
- Organization permissions

## Owned By

Organization

## Relationships

- Belongs to one User
- Belongs to one Organization

---

# 4.5 Resume

## Purpose

Represents a candidate resume.

## Responsibilities

- Resume storage
- Resume metadata
- Resume versions
- Default resume selection

## Owned By

Candidate

## Relationships

- Belongs to one Candidate Profile
- Referenced by many Applications

---

# 4.6 Job

## Purpose

Represents an open hiring position.

## Responsibilities

- Job details
- Hiring requirements
- Application collection
- Publication status

## Owned By

Organization

## Relationships

- Belongs to one Organization
- Has many Applications

---

# 4.7 Application

## Purpose

Represents a candidate's application to a job.

Applications are immutable historical records.

## Responsibilities

- Selected resume
- Application status
- Submission timestamp
- AI evaluation reference

## Owned By

Candidate

## Relationships

- Belongs to one Candidate
- Belongs to one Job
- References one Resume
- Has one AI Evaluation

---

# 4.8 AI Evaluation

## Purpose

Stores the results of AI analysis for an application.

## Responsibilities

- Resume parsing
- ATS scoring
- Resume feedback
- Structured AI output

## Owned By

Application

## Relationships

- Belongs to one Application

---

# 5. Entity Relationships

```text
User
│
├── CandidateProfile
│      │
│      ├── Resume
│      │
│      └── Application
│              │
│              └── AIEvaluation
│
└── OrganizationMember
       │
       ▼
Organization
       │
       └── Job
              │
              └── Application
```

---

# 6. Ownership Matrix

| Entity              | Owner              |
| ------------------- | ------------------ |
| User                | Platform           |
| Candidate Profile   | User               |
| Organization        | Organization Owner |
| Organization Member | Organization       |
| Resume              | Candidate          |
| Job                 | Organization       |
| Application         | Candidate          |
| AI Evaluation       | Application        |

---

# 7. Aggregate Boundaries

## Candidate Aggregate

```text
Candidate Profile
│
├── Resumes
└── Applications
```

The Candidate aggregate is responsible for all candidate-related operations.

---

## Organization Aggregate

```text
Organization
│
├── Members
└── Jobs
```

The Organization aggregate manages all recruiter operations.

---

## Application Aggregate

```text
Application
│
└── AI Evaluation
```

An Application and its AI Evaluation should be treated as a single business unit.

---

# 8. Core Business Rules

## User Rules

- Every person has exactly one account.
- Email verification is required before applying for jobs or creating an organization.
- A user may be both a candidate and an organization owner.

---

## Organization Rules

- One organization per owner during Phase 1.
- Organization names should be unique (implementation decision).
- Only the owner can manage the organization during Phase 1.

---

## Resume Rules

- Candidates may upload multiple resumes.
- Only supported document formats are accepted.
- One resume can be marked as the default.
- Resumes remain available even after applications are submitted.

---

## Job Rules

- Jobs belong to organizations.
- Closed jobs cannot receive applications.
- Draft jobs are not visible publicly.

---

## Application Rules

- A candidate cannot submit duplicate applications to the same job while an existing application is active.
- Every application references exactly one resume.
- Applications are immutable once submitted.
- Candidates may withdraw applications instead of deleting them.
- Withdrawn applications remain part of the audit history.
- Reapplying after withdrawal creates a new application.

---

## AI Evaluation Rules

- AI evaluation runs exactly once per application.
- ATS scores are stored permanently.
- AI evaluations are never regenerated automatically.
- Recruiters and candidates view the same stored evaluation.

---

# 9. Future Domain Expansion

The domain model has been designed to support future enhancements without major architectural changes.

Potential future entities include:

- Interview
- Screening Session
- Interview Question Bank
- Organization Invitation
- Recruiter Roles
- Hiring Pipeline
- Candidate Notes
- Email Notifications
- Subscription & Billing
- Audit Logs
- Analytics
- Platform Administration

---

# 10. Design Decisions

The following architectural decisions guide the implementation of HirePro:

- Identity is separated from capabilities.
- Organizations own hiring resources.
- Recruiter permissions are granted through organization membership.
- Applications are immutable historical records.
- AI evaluations are generated once and stored.
- Business entities are modeled independently of database implementation.
- The domain model is designed to evolve incrementally as new features are introduced.

---

# 11. Open Questions

These topics are intentionally deferred to future phases:

- Multiple organizations per user
- Recruiter invitation workflow
- Organization role hierarchy
- Multi-region deployments
- Resume version history
- Asynchronous AI evaluation pipeline
- Interview scheduling and management
- Billing and subscription management

These decisions will be revisited as HirePro evolves beyond Phase 1.
