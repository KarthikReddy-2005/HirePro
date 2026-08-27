Organization API

Overview

The Organization API allows an authenticated and email-verified user to:

Create an organization.

Fetch the organization associated with their account.

Base URL:

/api/v1/organizations

Authentication

Both endpoints are protected.

The API reads the JWT access token from the HTTP-only cookie:

Cookie: accessToken=<access-token>

The user must:

Have a valid access token.

Exist in the database.

Have a verified email address.

1. Create Organization

Creates a new organization and assigns the authenticated user as its owner.

Endpoint

POST /api/v1/organizations

Access

Protected.

Request Body

{
  "name": "HirePro Technologies",
  "slug": "hirepro-technologies",
  "description": "AI-powered hiring platform",
  "website": "https://hirepro.example.com",
  "logoUrl": "https://hirepro.example.com/logo.png"
}

Request Fields

Field

Type

Required

Rules

name

string

Yes

Minimum 2 and maximum 100 characters

slug

string

Yes

Unique, lowercase and URL-safe

description

string

No

Maximum 500 characters

website

string

No

Must be a valid URL

logoUrl

string

No

Must be a valid URL

Slug Rules

The slug:

Is trimmed.

Is converted to lowercase.

Must contain between 2 and 60 characters.

May contain lowercase letters, numbers and hyphens.

Must be globally unique.

Valid examples:

hirepro
hirepro-technologies
company-123

Invalid examples:

HirePro
hire pro
hire_pro
hirepro!

Business Rules

A user can belong to only one organization during Phase 1.

A user who already belongs to an organization cannot create another one.

The organization slug must be unique.

The authenticated user becomes the organization owner.

Organization creation and owner-membership creation happen inside one database transaction.

If membership creation fails, organization creation is rolled back.

Success Response

Status

201 Created

Response Body

{
  "success": true,
  "statusCode": 201,
  "message": "Organization created successfully",
  "data": {
    "organization": {
      "id": "organization-id",
      "name": "HirePro Technologies",
      "slug": "hirepro-technologies",
      "description": "AI-powered hiring platform",
      "website": "https://hirepro.example.com",
      "logoUrl": "https://hirepro.example.com/logo.png",
      "createdAt": "2026-08-27T14:30:00.000Z",
      "updatedAt": "2026-08-27T14:30:00.000Z"
    },
    "organizationMember": {
      "id": "membership-id",
      "userId": "user-id",
      "organizationId": "organization-id",
      "organizationRole": "OWNER",
      "joinedAt": "2026-08-27T14:30:00.000Z"
    }
  }
}

Error Responses

Validation Failed

400 Bad Request

{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "data": {
    "slug": "Slug can only contain lowercase letters, numbers, and hyphens"
  }
}

Missing or Invalid Access Token

401 Unauthorized

{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized! Access denied",
  "data": null
}

Organization Slug Already Exists

409 Conflict

{
  "success": false,
  "statusCode": 409,
  "message": "Organization slug already exists",
  "data": null
}

User Already Belongs to an Organization

409 Conflict

{
  "success": false,
  "statusCode": 409,
  "message": "User already belongs to an organization",
  "data": null
}

Example Request

curl --request POST \
  --url http://localhost:5000/api/v1/organizations \
  --header "Content-Type: application/json" \
  --cookie "accessToken=<access-token>" \
  --data '{
    "name": "HirePro Technologies",
    "slug": "hirepro-technologies",
    "description": "AI-powered hiring platform",
    "website": "https://hirepro.example.com",
    "logoUrl": "https://hirepro.example.com/logo.png"
  }'

2. Get My Organization

Returns the organization associated with the authenticated user.

Endpoint

GET /api/v1/organizations/me

Access

Protected.

Request Body

No request body is required.

Business Rules

The authenticated user must belong to an organization.

The endpoint returns only the authenticated user's organization.

Authentication data such as the password hash is not returned.

The response includes the user's organization membership role and joining date.

Success Response

Status

200 OK

Response Body

{
  "success": true,
  "statusCode": 200,
  "message": "Organization fetched successfully",
  "data": {
    "id": "organization-id",
    "name": "HirePro Technologies",
    "slug": "hirepro-technologies",
    "description": "AI-powered hiring platform",
    "logoUrl": "https://hirepro.example.com/logo.png",
    "website": "https://hirepro.example.com",
    "createdAt": "2026-08-27T14:30:00.000Z",
    "updatedAt": "2026-08-27T14:30:00.000Z",
    "membership": {
      "role": "OWNER",
      "joinedAt": "2026-08-27T14:30:00.000Z"
    }
  }
}

Error Responses

Missing or Invalid Access Token

401 Unauthorized

{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized! Access denied",
  "data": null
}

User Does Not Belong to an Organization

404 Not Found

{
  "success": false,
  "statusCode": 404,
  "message": "User does not belong to an organization",
  "data": null
}

Example Request

curl --request GET \
  --url http://localhost:5000/api/v1/organizations/me \
  --cookie "accessToken=<access-token>"

Organization Role

Phase 1 currently supports one organization role:

OWNER

The user who creates the organization automatically receives the OWNER role.

Endpoint Summary

Method

Endpoint

Description

Protected

POST

/api/v1/organizations

Create an organization

Yes

GET

/api/v1/organizations/me

Get the current user's organization

Yes