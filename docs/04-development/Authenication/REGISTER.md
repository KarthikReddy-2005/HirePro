# Register API

## Endpoint

```http
POST /api/v1/auth/register
```

## Purpose

Creates a new user account, securely hashes the password, creates an email-verification token, and sends a verification email.

A newly registered user cannot log in until their email address is verified.

## Authentication

Not required.

## Request Body

```json
{
  "username": "karthik",
  "displayName": "Karthik",
  "email": "karthik@example.com",
  "password": "Password123"
}
```

## Validation Rules

### `username`

- Required.
- Must be a string.
- Trimmed before processing.
- Converted to lowercase.
- Must contain at least 3 characters.
- Must be unique.

Example:

```text
" Karthik_123 " → "karthik_123"
```

### `displayName`

- Required.
- Must be a string.
- Trimmed before processing.
- Must contain at least 3 characters.

### `email`

- Required.
- Must be a valid email address.
- Trimmed before processing.
- Converted to lowercase.
- Must be unique.

Example:

```text
" Karthik@Example.com " → "karthik@example.com"
```

### `password`

- Required.
- Must be a string.
- Must contain at least 8 characters.
- Never stored as plain text.
- Hashed using bcrypt before database storage.

## Request Flow

```text
Client request
    ↓
Registration rate limiter
    ↓
Zod request validation
    ↓
Username and email normalization
    ↓
Registration controller
    ↓
Registration service
    ↓
Check existing username
    ↓
Check existing email
    ↓
Hash password
    ↓
Generate random verification token
    ↓
Hash verification token
    ↓
Create user and verification record
    ↓
Send verification email
    ↓
Return 201 response
```

## Layer Responsibilities

### Route

The route defines:

- HTTP method and path.
- Registration rate limiter.
- Validation middleware.
- Controller.

Conceptual route:

```ts
router.post(
  "/register",
  registerRateLimiter,
  validate(registerSchema),
  registerUser,
);
```

### Controller

The controller:

- Reads validated registration data.
- Calls `registerService`.
- Returns a consistent API response.
- Does not contain Prisma queries.

### Service

The service:

- Checks for duplicate username.
- Checks for duplicate email.
- Hashes the password.
- Generates the raw verification token.
- Hashes the verification token.
- Calls the repository.
- Sends the verification email.
- Maps known persistence errors to safe API errors.

### Repository

The repository:

- Performs Prisma queries.
- Creates the user.
- Creates the email-verification record.
- Uses a transaction when both operations must succeed together.

## Database Records

Registration creates a `User` record:

```text
User
├── id
├── username
├── displayName
├── email
├── hashedPassword
├── avatarUrl
├── isEmailVerified = false
├── createdAt
└── updatedAt
```

It also creates an `EmailVerification` record:

```text
EmailVerification
├── id
├── userId
├── tokenHash
├── expiresAt
├── usedAt = null
└── createdAt
```

The raw verification token is not stored. Only its hash is stored:

```text
SHA-256(raw verification token)
```

## Success Response

Status:

```http
201 Created
```

Example:

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Account created. Please verify your email.",
  "data": {
    "id": "user-id",
    "username": "karthik",
    "displayName": "Karthik",
    "email": "karthik@example.com",
    "isEmailVerified": false
  }
}
```

The response must not expose:

- Plain password.
- Hashed password.
- Verification-token hash.

## Error Responses

### Invalid Input

Status:

```http
400 Bad Request
```

Example:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "data": {
    "email": "Invalid email address",
    "password": "Password must be at least 8 characters"
  }
}
```

### Duplicate Username

Status:

```http
409 Conflict
```

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Username already exists",
  "data": null
}
```

### Duplicate Email

Status:

```http
409 Conflict
```

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Email already exists",
  "data": null
}
```

### Database Unique-Constraint Race

Application-level duplicate checks improve the response, but PostgreSQL unique constraints remain the final protection against concurrent duplicate requests.

A Prisma `P2002` error should be mapped to:

```http
409 Conflict
```

Example:

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Username or email already exists",
  "data": null
}
```

### Verification Email Failure

The final behavior depends on the selected service contract.

A resilient implementation creates the account and allows the user to request another verification email through the resend-verification endpoint.

A strict implementation may return:

```http
500 Internal Server Error
```

```json
{
  "success": false,
  "statusCode": 500,
  "message": "Unable to send verification email",
  "data": null
}
```

## Security Decisions

- Passwords are hashed with bcrypt.
- Plain passwords are never stored.
- Email verification is required before login.
- Raw verification tokens are never stored.
- Email and username uniqueness are enforced by PostgreSQL.
- Registration requests are rate limited.
- Input validation runs before business logic.
- Sensitive fields are excluded from responses.
- Database errors are converted to safe API errors.

## Tests

### Service Tests

The service tests cover:

- Successful registration.
- Duplicate username rejection.
- Duplicate email rejection.
- Password hashing.
- Verification-token generation.
- Verification-token hashing.
- Repository invocation.
- Verification-email invocation.
- Email-provider failure handling.
- Repository error propagation.

### Repository Tests

The repository tests cover:

- Username lookup.
- Email lookup.
- User creation.
- Verification-record creation.
- Transaction behavior.
- Prisma error propagation.

### Integration Tests

The integration tests cover:

- Successful registration.
- Invalid input.
- Duplicate email.
- Duplicate username.
- Email normalization.
- Username normalization.
- Password hashing.
- Verification-record creation.
- Verification-email invocation.
- Rejection before persistence when validation fails.

## Definition of Done

- [x] Input is validated.
- [x] Email and username are normalized.
- [x] Duplicate usernames are rejected.
- [x] Duplicate emails are rejected.
- [x] Passwords are hashed.
- [x] Users are created as unverified.
- [x] Verification tokens are generated.
- [x] Only token hashes are stored.
- [x] Verification emails are triggered.
- [x] Service tests pass.
- [x] Repository tests pass.
- [x] Integration tests pass.
