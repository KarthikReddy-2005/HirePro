# Resend Verification Email

## Endpoint
`POST /api/v1/auth/resend-verification`

## Purpose
Creates a new verification token and emails it if the account exists and is unverified.

## Authentication
Not required.

## Request
```json
{"email":"user@example.com"}
```

## Flow
1. Find user.
2. If missing or already verified, return generic success.
3. Revoke previous unused verification tokens.
4. Create new token.
5. Send email.

## Database
- User lookup
- Invalidate previous tokens
- Insert verification token

## Success
`200 OK`

## Errors
- 500 Email delivery failure
- Repository/database errors

## Security
- Prevent email enumeration.
- Hash verification token.
- Old tokens invalidated.

## Tests
- User exists
- Already verified
- User missing
- Email failure
- Repository failure
