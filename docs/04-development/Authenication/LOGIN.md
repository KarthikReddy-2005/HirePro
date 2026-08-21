# Login API

## Endpoint

```http
POST /api/v1/auth/login
```

## Purpose

Authenticates a verified user and creates:

- A short-lived JWT access token.
- A database-backed refresh token.

Both tokens are sent using `HttpOnly` cookies.

## Authentication

Not required.

## Request Body

```json
{
  "email": "karthik@example.com",
  "password": "Password123"
}
```

## Validation Rules

### `email`

- Required.
- Must be a valid email address.
- Trimmed before processing.
- Converted to lowercase.

### `password`

- Required.
- Must be a string.

## Request Flow

```text
Client request
    ↓
Login rate limiter
    ↓
Zod request validation
    ↓
Login controller
    ↓
Login service
    ↓
Find authentication data by email
    ↓
Compare plain password with bcrypt hash
    ↓
Check email-verification status
    ↓
Load public user data
    ↓
Generate JWT access token
    ↓
Generate random refresh token
    ↓
Hash refresh token
    ↓
Store refresh-token hash
    ↓
Set HttpOnly cookies
    ↓
Return 200 response
```

## Layer Responsibilities

### Route

The route defines:

- HTTP method and path.
- Login rate limiter.
- Validation middleware.
- Controller.

### Controller

The controller:

- Reads validated login data.
- Calls `loginService`.
- Generates or receives authentication tokens.
- Sets authentication cookies.
- Returns the public user profile.

### Service

The service:

- Finds authentication data by email.
- Compares the supplied password with the stored bcrypt hash.
- Rejects unverified accounts.
- Loads the public user profile.
- Returns safe authentication data.
- Does not expose the password hash.

### Repository

The repository:

- Finds authentication data by email.
- Loads the public user profile.
- Creates refresh-token records.
- Excludes sensitive fields from public-user queries.

## Password Verification

The application compares:

```text
Plain password from the request
```

with:

```text
bcrypt password hash stored in PostgreSQL
```

Conceptually:

```ts
await bcrypt.compare(password, user.hashedPassword);
```

The plain password is never stored or returned.

## Access Token

The access token is a JWT containing the user's identifier.

Example payload:

```json
{
  "userId": "user-id"
}
```

The current access-token lifetime is approximately:

```text
15 minutes
```

The token is stored in the `accessToken` cookie.

Recommended cookie properties:

```text
HttpOnly
SameSite=Strict
Secure in production
Path=/api/v1
Max-Age=900
```

## Refresh Token

The refresh token is a cryptographically random token.

The browser receives the raw token in the `refreshToken` cookie, while PostgreSQL stores only its hash.

```text
Browser receives raw refresh token
Database stores SHA-256(raw refresh token)
```

The current refresh-token lifetime is approximately:

```text
7 days
```

A refresh-token record contains:

```text
RefreshToken
├── id
├── userId
├── tokenHash
├── expiresAt
├── revokedAt
└── createdAt
```

Recommended cookie properties:

```text
HttpOnly
SameSite=Strict
Secure in production
Path=/api/v1
Max-Age=604800
```

## Success Response

Status:

```http
200 OK
```

Example:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User logged in successfully",
  "data": {
    "id": "user-id",
    "username": "karthik",
    "displayName": "Karthik",
    "email": "karthik@example.com",
    "avatarUrl": null,
    "isEmailVerified": true,
    "createdAt": "2026-08-21T00:00:00.000Z",
    "updatedAt": "2026-08-21T00:00:00.000Z"
  }
}
```

Response headers contain:

```text
Set-Cookie: accessToken=...
Set-Cookie: refreshToken=...
```

The response must not expose:

- Plain password.
- Hashed password.
- Refresh-token hash.

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
    "email": "Invalid email address"
  }
}
```

### Unknown Email

Status:

```http
401 Unauthorized
```

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password",
  "data": null
}
```

### Incorrect Password

Status:

```http
401 Unauthorized
```

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password",
  "data": null
}
```

The same error message is intentionally returned for an unknown email and an incorrect password. This reduces account-enumeration risk.

### Email Not Verified

Status:

```http
403 Forbidden
```

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Please verify your email before logging in",
  "data": null
}
```

### User Missing After Authentication Check

Status:

```http
401 Unauthorized
```

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "data": null
}
```

## Security Decisions

- Password comparison uses bcrypt.
- Unknown email and wrong password return the same response.
- Only verified users can log in.
- Access tokens are short-lived.
- Refresh tokens are stored as hashes.
- Refresh tokens are database-backed and revocable.
- Authentication cookies are `HttpOnly`.
- Tokens are not returned in normal JSON data.
- Login requests are rate limited.
- Public-user queries exclude `hashedPassword`.

## Frontend Usage

The frontend must include credentials.

Using `fetch`:

```ts
await fetch(`${API_URL}/api/v1/auth/login`, {
  method: "POST",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email,
    password,
  }),
});
```

Using Axios:

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});
```

Do not store access or refresh tokens in:

- `localStorage`.
- `sessionStorage`.
- Redux.
- Zustand.
- React component state.

The browser manages the `HttpOnly` cookies.

## CORS Requirements

The API must allow credentials:

```ts
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);
```

Both the backend and frontend credential settings are required.

## Tests

### Service Tests

The service tests cover:

- Successful login.
- Unknown email rejection.
- Incorrect password rejection.
- Unverified-user rejection.
- Password comparison.
- Public-user loading.
- Missing-user handling.
- Repository error propagation.
- Generic invalid-credentials responses.

### Repository Tests

The repository tests cover:

- Authentication lookup by email.
- Password-hash selection.
- Verification-status selection.
- Public-user lookup by ID.
- Exclusion of sensitive fields.

### Integration Tests

The integration tests cover:

- Successful login.
- Public user response.
- Absence of password hash.
- Access-token cookie creation.
- Refresh-token cookie creation.
- Refresh-token database record creation.
- Incorrect-password rejection.
- Unknown-email rejection.
- Unverified-account rejection.
- Invalid and missing input.

## Definition of Done

- [x] Email and password are validated.
- [x] Passwords are compared securely.
- [x] Invalid credentials return a generic response.
- [x] Unverified users cannot log in.
- [x] Access tokens are generated.
- [x] Refresh tokens are generated.
- [x] Only refresh-token hashes are stored.
- [x] HttpOnly cookies are set.
- [x] Sensitive fields are excluded.
- [x] Service tests pass.
- [x] Repository tests pass.
- [x] Integration tests pass.
