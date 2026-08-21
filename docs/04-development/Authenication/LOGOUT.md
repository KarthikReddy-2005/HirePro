# Logout API

## Endpoint

```http
POST /api/v1/auth/logout
```

## Purpose

Ends the current session by:

- Revoking the stored refresh token when one exists.
- Clearing the access-token cookie.
- Clearing the refresh-token cookie.

## Authentication

Strict authentication is not required.

Logout is intentionally idempotent. It can safely be called when:

- The refresh token is valid.
- The refresh token is invalid.
- The refresh token is already revoked.
- No refresh token exists.

The client always ends in the same state: authentication cookies are cleared.

## Request

No request body is required.

The controller reads:

```text
req.cookies.refreshToken
```

Example:

```http
POST /api/v1/auth/logout
Cookie: accessToken=...; refreshToken=...
```

## Request Flow

```text
Client request
    ↓
Logout controller
    ↓
Read refresh-token cookie
    ↓
If a refresh token exists:
    hash the raw refresh token
    ↓
    find the stored token by hash
    ↓
    revoke the stored token when found
    ↓
Clear access-token cookie
    ↓
Clear refresh-token cookie
    ↓
Return 200 response
```

When no refresh token exists:

```text
No token to revoke
    ↓
Clear cookies
    ↓
Return 200 response
```

## Layer Responsibilities

### Controller

The controller:

- Reads the refresh-token cookie.
- Calls `logoutService` when a token is present.
- Clears authentication cookies.
- Always returns a successful logout response for safe, idempotent behavior.

### Service

The service:

- Hashes the raw refresh token.
- Finds the database record by token hash.
- Calls the repository to revoke the token when a record exists.
- Does not treat a missing token as an error.

### Repository

The repository:

- Finds refresh tokens by hash.
- Revokes only active refresh tokens.
- Uses `revokedAt` instead of deleting session records.

## Token Revocation

Refresh tokens are not deleted. Instead, the repository sets:

```text
revokedAt = current timestamp
```

Conceptual Prisma query:

```ts
await prisma.refreshToken.updateMany({
  where: {
    id: refreshTokenId,
    revokedAt: null,
  },
  data: {
    revokedAt: new Date(),
  },
});
```

The condition:

```text
revokedAt: null
```

ensures that an already-revoked token is not changed again.

## Cookie Clearing

Logout clears:

```text
accessToken
refreshToken
```

Example response cookies:

```text
accessToken=; Expires=Thu, 01 Jan 1970 00:00:00 GMT
refreshToken=; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

The options used to clear a cookie must match the options used to create it, especially:

- `Path`.
- `HttpOnly`.
- `SameSite`.
- `Secure`.
- `Domain`, when configured.

Example:

```ts
const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/v1",
};

res.clearCookie("accessToken", cookieOptions);
res.clearCookie("refreshToken", cookieOptions);
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
  "message": "User logged out successfully",
  "data": null
}
```

## Logout Without Cookies

Request:

```http
POST /api/v1/auth/logout
```

Response:

```http
200 OK
```

This is intentional. The endpoint does not reveal whether a session existed.

## Logout With an Invalid Refresh Token

Request:

```http
POST /api/v1/auth/logout
Cookie: refreshToken=invalid-token
```

Response:

```http
200 OK
```

The token does not match a database record, but the cookies are still cleared.

## Logout With an Already-Revoked Token

Response:

```http
200 OK
```

The repository update affects zero records, but logout still succeeds.

## Why Logout Is Idempotent

A repeated logout call should be safe.

```text
First logout
    ↓
Refresh token revoked
    ↓
Cookies cleared
    ↓
200 OK

Second logout
    ↓
Token already revoked or missing
    ↓
Cookies cleared again
    ↓
200 OK
```

This simplifies frontend behavior because the client does not need to know whether its previous session was already invalid.

## Security Decisions

- Refresh tokens are revoked server-side.
- Raw refresh tokens are hashed before lookup.
- Authentication cookies are always cleared.
- Invalid tokens do not expose session information.
- Missing tokens do not produce unnecessary errors.
- Revoked refresh tokens cannot be used by the refresh endpoint.
- User accounts are not deleted during logout.
- Logout can safely be called repeatedly.

## Frontend Usage

Using `fetch`:

```ts
await fetch(`${API_URL}/api/v1/auth/logout`, {
  method: "POST",
  credentials: "include",
});
```

Using Axios:

```ts
await api.post("/api/v1/auth/logout");
```

After logout, the frontend should:

- Clear cached user data.
- Clear authenticated React Query data.
- Redirect to the login page when appropriate.
- Avoid trying to manually delete `HttpOnly` cookies with JavaScript.

The server clears the cookies.

## Tests

### Service Tests

The service tests cover:

- Raw refresh-token hashing.
- Stored-token lookup.
- Active-token revocation.
- Missing-token handling.
- Repository error propagation.

### Repository Tests

The repository tests cover:

- Active-token revocation.
- `revokedAt` timestamp creation.
- Already-revoked token handling.
- Missing-token handling.
- Restricting updates to active records.

### Integration Tests

The integration tests cover:

- Successful logout.
- Refresh-token revocation in PostgreSQL.
- Access-token cookie clearing.
- Refresh-token cookie clearing.
- Logout without cookies.
- Logout with an invalid token.
- Repeated logout.
- Preservation of the user record.
- Prevention of additional refresh-token creation.

## Definition of Done

- [x] Raw refresh tokens are hashed before lookup.
- [x] Active refresh tokens are revoked.
- [x] Access-token cookies are cleared.
- [x] Refresh-token cookies are cleared.
- [x] Missing tokens are handled safely.
- [x] Invalid tokens are handled safely.
- [x] Repeated logout calls are safe.
- [x] User records are preserved.
- [x] Service tests pass.
- [x] Repository tests pass.
- [x] Integration tests pass.
