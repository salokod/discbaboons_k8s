# POST /api/auth/login

## Overview
Authenticates a user with username and password, returning access and refresh tokens.

## Endpoint
```
POST /api/auth/login
```

## Authentication
No authentication required.

## Request Body
```json
{
  "username": "string",
  "password": "string"
}
```

### Field Requirements

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | The user's username |
| `password` | string | Yes | The user's password |

## Response

### Success (200 OK)
```json
{
  "success": true,
  "user": {
    "id": 123,
    "username": "johndoe",
    "email": "john@example.com",
    "created_at": "2024-01-15T10:30:00.000Z",
    "is_admin": false
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### User Object Fields
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique user identifier |
| `username` | string | User's username |
| `email` | string | User's email address |
| `created_at` | string (ISO 8601) | Account creation timestamp |
| `is_admin` | boolean | Admin privileges flag for role-based access control |

#### Token Details
- **Access Token**: JWT with 15-minute expiration
  - Contains: `userId`, `username`, `isAdmin`
  - Used for API authentication and role-based access control
- **Refresh Token**: JWT with 14-day expiration
  - Contains: `userId`
  - Used to generate new access tokens

#### Admin User Example
```json
{
  "success": true,
  "user": {
    "id": 456,
    "username": "adminuser",
    "email": "admin@example.com",
    "created_at": "2024-01-10T08:15:00.000Z",
    "is_admin": true
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "error": "ValidationError",
  "message": "Username is required"
}
```

**Possible validation messages:**
- "Username is required"
- "Password is required"

#### 401 Unauthorized - Invalid Credentials
```json
{
  "error": "UnauthorizedError",
  "message": "Invalid username or password"
}
```

## Service Implementation
**File:** `services/auth.login.service.js`

### Key Features
- Input validation for username and password
- User lookup by username (case-insensitive)
- Password verification using bcrypt
- JWT token generation (access + refresh)
- Admin role detection and inclusion in tokens
- Secure error handling (doesn't reveal if username exists)

### Security Features
- Password hashing verification with bcrypt
- Generic error message for invalid credentials
- Separate access and refresh token strategy
- JWT tokens signed with environment secrets

### Database Operations
- User lookup: `SELECT id, username, email, password_hash, created_at, is_admin FROM users WHERE username = $1`

### Role-Based Access Control
The login response includes the `is_admin` field, which enables:
- **Client-side Role Detection**: Mobile apps can show/hide admin-only UI elements
- **JWT Token Authorization**: Admin status is embedded in access tokens for efficient server-side validation
- **Admin Endpoint Access**: Users with `is_admin: true` can access admin-only endpoints like:
  - `GET /api/discs/pending` - View pending disc submissions
  - `PATCH /api/discs/:id/approve` - Approve disc submissions
  - Other admin-only features

## Example Usage

### Valid Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "MySecure123!"
  }'
```

### Invalid Credentials
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "wrongpassword"
  }'
```

## Token Usage
After successful login, include the access token in subsequent API requests:

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Admin Token Usage
Admin users can access admin-only endpoints using their JWT token:

```bash
# Admin-only: View pending disc submissions
curl -X GET http://localhost:3000/api/discs/pending \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"

# Admin-only: Approve disc submission
curl -X PATCH http://localhost:3000/api/discs/DISC_ID/approve \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

## Related Endpoints
- [POST /api/auth/register](./POST_register.md) - Create new user account
- [POST /api/auth/refresh](./POST_refresh.md) - Refresh access token using refresh token
- [POST /api/auth/forgot-password](./POST_forgot-password.md) - Reset forgotten password
- [POST /api/auth/change-password](./POST_change-password.md) - Change password