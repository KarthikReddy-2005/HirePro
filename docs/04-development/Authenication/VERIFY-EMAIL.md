# Verify Email

## Endpoint
`GET /api/v1/auth/verify-email?token=<token>`

## Purpose
Verifies a user's email address using a one-time verification token.

## Authentication
Not required.

## Request
Token is supplied as a query parameter.

## Flow
1. Validate token.
2. Hash token.
3. Find matching unused, unexpired verification record.
4. Mark token as used.
5. Mark user as verified.
6. Return success.

## Database
- Read `EmailVerification`
- Update `EmailVerification.usedAt`
- Update `User.isEmailVerified`

## Success
`200 OK`
```json
{"success":true,"message":"Email verified successfully"}
```

## Errors
- 400 Invalid/expired token
- 400 Already used
- 404 User not found

## Security
- Store only hashed tokens.
- Single-use token.
- Expiration enforced.

## Tests
- Valid token
- Invalid token
- Expired token
- Used token
- User missing
- Repository failure
