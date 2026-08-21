# Refresh Token

## Endpoint
`POST /api/v1/auth/refresh`

## Purpose
Issues a new access token using a valid refresh token.

## Authentication
Refresh token cookie.

## Flow
1. Read refresh token cookie.
2. Hash token.
3. Validate token.
4. Check expiry/revocation.
5. Rotate refresh token.
6. Issue new access token.

## Database
- RefreshToken lookup
- Revoke old token
- Insert new token

## Success
`200 OK`

## Errors
- Missing token
- Invalid token
- Expired token
- Revoked token

## Security
- Token rotation.
- Hashed refresh tokens.
- Cookie-based auth.

## Tests
- Valid refresh
- Missing cookie
- Invalid token
- Expired token
- Revoked token
