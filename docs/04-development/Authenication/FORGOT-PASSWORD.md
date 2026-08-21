# Forgot Password

## Endpoint
`POST /api/v1/auth/forgot-password`

## Purpose
Generates a password reset token and emails it.

## Authentication
Not required.

## Request
```json
{"email":"user@example.com"}
```

## Flow
1. Lookup user.
2. Return generic success if absent.
3. Revoke old reset tokens.
4. Create new reset token.
5. Send reset email.

## Database
- User lookup
- PasswordReset insert
- PasswordReset revoke

## Success
`200 OK`

## Security
- No account enumeration.
- Hashed tokens.
- Expiring tokens.

## Tests
- Existing user
- Missing user
- Email failure
- Token creation
- Repository failure
