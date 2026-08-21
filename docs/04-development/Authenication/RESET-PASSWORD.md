# Reset Password

## Endpoint
`POST /api/v1/auth/reset-password`

## Purpose
Changes the user's password using a valid reset token.

## Request
```json
{
  "token":"...",
  "password":"NewPassword123!"
}
```

## Flow
1. Hash token.
2. Validate unused token.
3. Hash password.
4. Update password.
5. Consume reset token.
6. Revoke refresh tokens.

## Database
- PasswordReset lookup
- User update
- RefreshToken revoke

## Success
`200 OK`

## Errors
- Invalid token
- Expired token
- Used token

## Security
- Single-use token.
- Password hashed with bcrypt.
- Refresh tokens revoked.

## Tests
- Valid reset
- Invalid token
- Expired token
- Used token
- Password updated
