# HirePro - User Personas

| Field        | Value         |
| ------------ | ------------- |
| Project      | HirePro       |
| Document     | User Personas |
| Version      | 1.0           |
| Status       | Draft         |
| Author       | Karthik Reddy |
| Last Updated | August 2026   |

---

# 1. Purpose

This document defines the primary user personas within HirePro.

The objective is to clearly describe who uses the platform, what problems they are trying to solve, what permissions they require, and how they interact with the system.

These personas guide product design, database modeling, authorization, API design, and user experience decisions.

---

# 2. Core Product Principle

HirePro follows a **single identity model**.

Every person has exactly one user account.

Capabilities are added based on actions performed by the user rather than selecting an account type during registration.

Examples:

- A new user can browse jobs.
- Uploading a resume enables candidate functionality.
- Creating an organization unlocks recruiter functionality.
- Joining an organization grants recruiter permissions.
- The same account can both apply for jobs and recruit candidates.

Identity remains constant while permissions evolve over time.

---

# 3. Product Personas

The platform currently defines four personas.

| Persona                | Phase   |
| ---------------------- | ------- |
| Candidate              | Phase 1 |
| Organization Owner     | Phase 1 |
| Recruiter Member       | Phase 2 |
| Platform Administrator | Future  |

---

# 4. Candidate

## Description

A candidate is a registered user seeking employment opportunities through HirePro.

Candidates use the platform to discover jobs, submit applications, receive AI-generated ATS evaluations, and improve their resumes based on personalized feedback.

---

## Primary Goals

- Find relevant job opportunities.
- Submit applications efficiently.
- Tailor resumes for different positions.
- Understand ATS compatibility.
- Improve resume quality using AI feedback.
- Track application progress.

---

## Pain Points

- Lack of feedback after applying.
- Difficulty understanding ATS requirements.
- Maintaining different resumes for different roles.
- Tracking multiple job applications.

---

## Primary Actions

- Register
- Verify email
- Complete profile
- Upload multiple resumes
- Set a default resume
- Browse jobs
- Search jobs
- View job details
- Apply for jobs
- View ATS scores
- Read AI-generated feedback
- Track application history

---

## Permissions

Can:

- Manage personal profile
- Manage resumes
- Apply for jobs
- View own applications
- View AI evaluations

Cannot:

- Create organizations
- Create jobs
- View other candidates
- Manage organization data

---

## Success Criteria

A candidate successfully:

- Creates an account.
- Uploads resumes.
- Applies for jobs.
- Receives meaningful ATS feedback.
- Improves future applications.

---

# 5. Organization Owner

## Description

An Organization Owner is a user responsible for managing hiring activities for an organization.

During Phase 1, the Organization Owner is the sole recruiter within an organization.

---

## Primary Goals

- Create an organization.
- Publish job openings.
- Receive applications.
- Quickly identify qualified candidates.
- Reduce manual resume screening effort.

---

## Pain Points

- Reviewing large numbers of resumes.
- Inconsistent candidate evaluation.
- Limited hiring resources.
- Time spent on repetitive screening tasks.

---

## Primary Actions

- Create organization
- Update organization information
- Create job postings
- Edit jobs
- Close jobs
- View applicants
- Review ATS scores
- Review AI feedback
- Shortlist candidates

---

## Permissions

Can:

- Manage organization
- Manage jobs
- View applicants
- Access recruiter dashboard

Cannot:

- Access other organizations
- Manage platform-wide settings

---

## Success Criteria

An Organization Owner successfully:

- Creates an organization.
- Publishes job openings.
- Reviews ranked applicants.
- Identifies qualified candidates efficiently.

---

# 6. Recruiter Member (Phase 2)

## Description

A Recruiter Member is invited into an existing organization to assist with hiring.

This role is not implemented during Phase 1 but is considered during database and authorization design.

---

## Responsibilities

- Assist in hiring
- Review applicants
- Participate in recruitment workflow

---

## Permissions

Can:

- View assigned jobs
- Review applicants
- Leave hiring notes (Future)

Cannot:

- Delete organization
- Transfer ownership
- Manage billing

---

# 7. Platform Administrator (Future)

## Description

Platform Administrators manage the HirePro platform itself rather than individual organizations.

---

## Responsibilities

- User moderation
- Organization moderation
- Platform analytics
- Feature management
- Platform security
- System health monitoring

---

## Permissions

Full platform access.

---

# 8. Persona Relationships

```text
Visitor
    │
    ▼
Registered User
    │
    ▼
Verified User
    │
    ├──────────────┐
    ▼              ▼
Candidate   Create Organization
                    │
                    ▼
          Organization Owner
                    │
                    ▼
          Recruiter Member (Phase 2)
```

Users never change identity.

They gain additional capabilities as they interact with the platform.

---

# 9. Product Decisions

The following product decisions are derived from these personas:

- Every person has a single account.
- Users are not required to choose between candidate and recruiter during registration.
- Creating an organization grants recruiter capabilities.
- A user may simultaneously be both a candidate and an organization owner.
- Organizations own job postings.
- Job applications belong to candidates.
- AI assists recruiters rather than replacing hiring decisions.

---

# 10. Future Evolution

Future versions of HirePro may introduce additional personas, including:

- Hiring Manager
- Interview Panel Member
- HR Administrator
- Billing Administrator
- Organization Administrator
- External Interviewer
- Candidate Referrals

The authorization model should remain flexible enough to accommodate these personas without requiring major architectural changes.
