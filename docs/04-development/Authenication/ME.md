# Current User

## Endpoint
`GET /api/v1/auth/me`

## Purpose
Returns the authenticated user's profile.

## Authentication
Access token required.

## Flow
1. Middleware validates JWT.
2. User loaded.
3. Controller returns profile.

## Success
`200 OK`

## Errors
- 401 Unauthorized

## Tests
- Valid token
- Missing token
- Invalid token
- User missing
- Unverified user
