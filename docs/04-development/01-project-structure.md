# Project Structure & Development Setup

## Purpose

This document explains the purpose of every important file and folder created during the project initialization.

The goal is to document not only **what exists**, but **why it exists** and how it contributes to a scalable, production-ready monorepo.

---

# Root Directory

```
HirePro/
```

The repository root contains all applications, shared packages, documentation, and workspace configuration.

---

## apps/

Contains all runnable applications.

```
apps/
├── api
└── web
```

### apps/web

Next.js frontend application.

Responsibilities:

- User Interface
- Authentication Pages
- Recruiter Dashboard
- Candidate Dashboard
- Job Search
- Resume Upload
- ATS Report UI

Technology:

- Next.js
- React
- TypeScript

---

### apps/api

Express backend application.

Responsibilities:

- REST API
- Authentication
- Business Logic
- Database Access
- AI Integration
- Email Service
- File Upload

Technology:

- Express
- TypeScript

---

## docs/

Contains all project documentation.

Documentation is treated as a first-class part of the project.

It includes:

- Vision
- Product Requirements
- User Personas
- User Journeys
- Domain Model
- Architecture
- Database Design
- API Design

Future documents will include:

- ADRs
- Deployment
- Monitoring
- Security
- Testing Strategy

---

## packages/

Contains reusable workspace packages.

Currently:

```
packages/
└── config
```

Future:

```
packages/
config
types
ui
validation
utils
```

---

# packages/config

Shared configuration package.

Purpose:

Avoid duplication of configuration across applications.

Contains:

- Shared TypeScript configuration

Future:

- ESLint
- Shared constants
- Build configuration

---

# TypeScript Configuration

```
packages/config/tsconfig
```

Contains reusable compiler configurations.

---

## base.json

Base TypeScript rules shared by every application.

Includes:

- strict mode
- exact optional property types
- no unchecked indexed access

Purpose:

Ensure consistent type safety across the repository.

---

## nextjs.json

Extends base configuration.

Contains configuration specific to Next.js.

Examples:

- JSX configuration
- Bundler module resolution

---

## node.json

Extends base configuration.

Contains configuration specific to Node.js.

Examples:

- NodeNext module system
- Node types

---

# Root Configuration Files

## package.json

Workspace package manifest.

Responsibilities:

- Workspace scripts
- Development scripts
- Shared developer dependencies

Examples:

- turbo
- prettier
- husky
- lint-staged

---

## pnpm-workspace.yaml

Defines the workspace packages managed by pnpm.

Current workspace:

```
apps/*
packages/*
```

Without this file, pnpm would treat every folder as an independent project.

---

## turbo.json

Configuration for Turborepo.

Defines:

- Build pipeline
- Development pipeline
- Task dependencies
- Caching behavior

Purpose:

Coordinate builds across the monorepo.

---

## pnpm-lock.yaml

Dependency lock file.

Purpose:

Ensures every developer installs the exact same dependency versions.

Should always be committed.

---

## .gitignore

Specifies files Git should ignore.

Examples:

- node_modules
- dist
- .next
- .env

---

## .editorconfig

Defines editor behavior.

Examples:

- indentation
- line endings
- final newline

Purpose:

Provide consistent formatting regardless of IDE.

---

## .prettierrc

Prettier formatting rules.

Ensures code formatting remains consistent across the project.

---

## .prettierignore

Specifies files ignored by Prettier.

Examples:

- build output
- generated files
- dependencies

---

# Husky

```
.husky/
```

Git hook configuration.

Purpose:

Automatically execute quality checks before commits.

Current hook:

pre-commit

Future:

- lint
- type check
- tests
- formatting

This prevents broken code from entering the repository.

---

# Frontend Structure

```
apps/web
```

Contains the Next.js application.

Important files:

---

## app/

App Router entry point.

Contains:

- Pages
- Layouts
- Route Groups

---

## public/

Static assets.

Examples:

- Images
- Icons
- Logos

---

## next.config.ts

Next.js application configuration.

Future:

- Security headers
- Image domains
- Performance optimization

---

## tsconfig.json

Frontend-specific TypeScript configuration.

Extends the shared configuration.

---

## eslint.config.mjs

Frontend linting rules.

Currently uses the Next.js recommended configuration.

---

# Backend Structure

```
apps/api
```

Contains the Express application.

---

## src/

Application source code.

Current structure:

```
src/
config/
routes/
app.ts
server.ts
```

---

## server.ts

Application entry point.

Responsibilities:

- Load environment
- Start HTTP server

---

## app.ts

Express application configuration.

Responsibilities:

- Middleware registration
- Route registration

---

## config/

Application configuration.

Current:

- environment variables
- logger

Future:

- database
- email
- cloudinary
- AI providers

---

## routes/

HTTP route definitions.

Currently:

- health endpoint

Future:

- auth
- users
- organizations
- jobs
- resumes

---

# Design Philosophy

HirePro follows several engineering principles.

- Monorepo architecture
- Shared configuration
- Type safety
- Documentation first
- Feature-based development
- Production-first mindset
- Scalability over quick prototypes
- Maintainability through separation of concerns

These principles guide future architectural decisions throughout the project.
