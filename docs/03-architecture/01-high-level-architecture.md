# HirePro – High-Level System Architecture

| Field        | Value                          |
| ------------ | ------------------------------ |
| Project      | HirePro                        |
| Document     | High-Level System Architecture |
| Version      | 1.0                            |
| Status       | Draft                          |
| Author       | Karthik Reddy                  |
| Last Updated | August 2026                    |

---

# 1. Purpose

This document describes the high-level architecture of HirePro.

Its objective is to define how the major components of the system interact while remaining independent of implementation details.

This architecture serves as the blueprint for backend development, frontend development, database design, API design, deployment, testing, and future scalability.

---

# 2. Architecture Goals

The architecture has been designed with the following goals:

- Maintainability
- Scalability
- Reliability
- Security
- Testability
- Extensibility
- Fault Tolerance
- Clear Separation of Concerns
- Production Readiness

---

# 3. Architectural Style

HirePro follows a **Layered Monolithic Architecture**.

During Phase 1, all business logic resides within a single backend application while maintaining clear architectural boundaries.

This allows rapid development without sacrificing maintainability.

As the application grows, individual modules can be extracted into independent services without major redesign.

---

# 4. High-Level Architecture

```text
                          Client Browser
                                │
                                │ HTTPS
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                  Presentation Layer                          │
│                                                              │
│ Next.js                                                      │
│ TypeScript                                                   │
│ Tailwind CSS                                                 │
│ shadcn/ui                                                    │
│ React Query                                                  │
│ React Hook Form                                              │
│ Zod                                                          │
└──────────────────────────────────────────────────────────────┘
                                │
                           REST API
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                 Reverse Proxy (Nginx)                        │
│                                                              │
│ SSL Termination                                              │
│ Reverse Proxy                                                │
│ Compression                                                  │
│ Static Asset Delivery                                        │
│ Future Rate Limiting                                         │
└──────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                 Backend API (Express)                        │
│                                                              │
│ Node.js                                                      │
│ TypeScript                                                   │
│                                                              │
│ Layers                                                       │
│ • Routes                                                     │
│ • Controllers                                                │
│ • Services                                                   │
│ • Repositories                                               │
│ • Middleware                                                 │
│ • Validation                                                 │
└──────────────────────────────────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
 Authentication          Business Logic         Observability
 JWT + Cookies           Hiring Workflow        Logging & Metrics
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                  Persistence Layer                           │
│                                                              │
│ Prisma ORM                                                   │
│ PostgreSQL                                                   │
└──────────────────────────────────────────────────────────────┘
                                │
     ┌──────────────────────────┼───────────────────────────┐
     │                          │                           │
     ▼                          ▼                           ▼
 Storage Service          AI Service Layer          Email Service
 Cloudinary               AI Provider               Resend
                           Abstraction
```

---

# 5. Layer Responsibilities

## 5.1 Presentation Layer

Responsible for providing the user interface and interacting with backend APIs.

### Technology

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Query
- React Hook Form
- Zod

### Responsibilities

- Authentication UI
- Dashboard
- Job browsing
- Resume management
- Organization management
- Form validation
- API communication
- Error presentation

---

## 5.2 Reverse Proxy Layer

Acts as the entry point for incoming HTTP requests.

### Technology

- Nginx

### Responsibilities

- HTTPS termination
- Reverse proxy
- Response compression
- Static asset delivery
- Future rate limiting
- Security headers

---

## 5.3 Backend Application Layer

Responsible for implementing business logic.

### Technology

- Node.js
- Express
- TypeScript

### Layers

#### Routes

Receive HTTP requests.

#### Controllers

Handle request/response mapping.

#### Services

Implement business logic.

#### Repositories

Interact with the database.

#### Middleware

Authentication

Authorization

Validation

Logging

Error handling

---

## 5.4 Persistence Layer

Responsible for data storage.

### Technology

- PostgreSQL
- Prisma ORM

### Responsibilities

- Data persistence
- Transactions
- Database constraints
- Indexes
- Migrations

---

# 6. External Services

---

## 6.1 AI Service

Purpose

Provide AI-powered resume evaluation.

Current Providers

- OpenRouter
- Gemini
- Groq

Future Providers

- OpenAI
- Claude
- Local LLM

Responsibilities

- Resume parsing
- ATS scoring
- Resume feedback
- Structured AI response

The backend communicates only with an internal AI Provider abstraction.

Business logic never depends directly on a specific AI vendor.

---

## 6.2 Storage Service

Purpose

Store candidate resumes.

Current Provider

- Cloudinary

Future Providers

- AWS S3
- Azure Blob Storage
- Google Cloud Storage

Responsibilities

- Resume upload
- Resume retrieval
- Resume deletion
- Secure file access

Storage providers remain replaceable through an abstraction layer.

---

## 6.3 Email Service

Purpose

Send transactional emails.

Current Provider

- Resend

Future Providers

- SendGrid
- Amazon SES
- SMTP

Responsibilities

- Email verification
- Password reset
- Future notifications

Email providers are abstracted from business logic.

---

# 7. Security Architecture

HirePro follows a security-first approach.

Measures include:

- JWT Authentication
- Refresh Tokens
- HTTP-only Cookies
- Password Hashing (bcrypt)
- Request Validation (Zod)
- Secure HTTP Headers
- SQL Injection Protection (Prisma)
- CORS Configuration
- File Validation
- Future Rate Limiting

---

# 8. Cross-Cutting Concerns

These concerns apply across the entire application.

## Authentication

JWT

Refresh Tokens

Session Validation

---

## Authorization

Organization ownership

Protected routes

Role-based permissions

---

## Validation

Request validation

Business rule validation

Input sanitization

---

## Error Handling

Global error handler

Consistent API responses

Meaningful error messages

---

## Logging

Application logging

Request logging

Error logging

Audit logging (future)

---

## Monitoring

Health endpoints

Readiness checks

Performance metrics

Future alerting

---

## Configuration

Environment variables

Secrets management

Environment-specific configuration

---

# 9. Development Tooling

Frontend

- Next.js
- TypeScript
- ESLint
- Prettier

Backend

- Node.js
- Express
- TypeScript
- Prisma

Testing

- Vitest
- Supertest
- React Testing Library
- Playwright (Future)

Development

- Docker
- Docker Compose
- Husky
- lint-staged
- Commitlint
- GitHub Actions (CI)

---

# 10. Reliability Strategy

To improve reliability, HirePro follows these principles:

- AI providers are abstracted and replaceable.
- External service failures are handled gracefully.
- Business logic is isolated from third-party vendors.
- Validation occurs before database operations.
- Transactions protect critical operations.
- Health endpoints expose application status.
- Future retry mechanisms can be added without redesign.

---

# 11. Scalability Strategy

Although Phase 1 uses a monolithic architecture, the design supports future growth.

Possible future improvements include:

- Background job processing
- Distributed caching
- CDN integration
- Object storage migration
- AI processing queues
- Horizontal backend scaling
- Database read replicas
- Multi-region deployments
- Microservice extraction

---

# 12. Testing Strategy Overview

Testing is integrated throughout the architecture.

### Unit Testing

- Services
- Utilities
- Business rules

### Integration Testing

- API endpoints
- Database interactions
- Authentication

### Frontend Testing

- Components
- Forms
- User interactions

### End-to-End Testing (Future)

- Critical user journeys
- Authentication flow
- Job application flow

---

# 13. Architecture Principles

HirePro follows these engineering principles:

- Separation of Concerns
- Single Responsibility Principle
- Dependency Inversion
- Provider Abstraction
- Security by Default
- Testability
- Maintainability
- Scalability
- Observability
- Fail Gracefully

---

# 14. Future Architecture Evolution

Future versions of HirePro may introduce:

- Background workers
- Message queues
- Redis caching
- Distributed tracing
- Event-driven architecture
- AI orchestration services
- Multiple backend services
- Kubernetes deployment
- Advanced monitoring
- Feature flags

The current architecture intentionally keeps these possibilities open while avoiding unnecessary complexity during Phase 1.

---

# 15. Summary

HirePro adopts a production-oriented layered monolithic architecture that emphasizes clean separation of concerns, modularity, and maintainability.

External services such as AI providers, file storage, and email delivery are accessed through abstraction layers, reducing vendor lock-in and improving testability.

The architecture is intentionally designed to evolve incrementally, enabling future scalability without requiring major architectural rewrites.
