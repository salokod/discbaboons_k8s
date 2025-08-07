# POST /api/auth/change-password

## Overview
Completes the password reset process by validating a reset code and setting a new password. This is the second step after requesting a password reset.

## Endpoint
```
POST /api/auth/change-password
```

## Authentication
No authentication required (uses reset code).

## Request Body
```json
{
  "resetCode": "string",
  "newPassword": "string",
  "username": "string",  // Optional - either username or email required
  "email": "string"      // Optional - either username or email required
}
```

### Field Requirements

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resetCode` | string | Yes | 6-digit reset code from email |
| `newPassword` | string | Yes | New password for the account |
| `username` | string | No* | Username of the account (if email not provided) |
| `email` | string | No* | Email address of the account (if username not provided) |

**Note**: Either `username` OR `email` must be provided to identify the account.

### Password Requirements
The new password must meet the same requirements as registration:
- 8-32 characters in length
- Must contain at least one uppercase letter (A-Z)
- Must contain at least one lowercase letter (a-z)
- Must contain at least one number (0-9)
- Must contain at least one special character (!@#$%^&*(),.?":{}|<>)

## Response

### Success (200 OK)
```json
{
  "success": true,
  "message": "Password has been successfully changed."
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "message": "Reset code, new password, and username or email are required"
}
```

**Possible validation messages:**
- "Reset code, new password, and username or email are required"
- "Invalid email format"
- "Invalid or expired reset code"

## Service Implementation
**File:** `services/auth.changepassword.service.js`

### Key Features
- Reset code validation against Redis storage
- User identification via username or email
- Password hashing with bcrypt
- One-time use reset code (deleted after use)
- Secure password update

### Security Features
- **One-Time Use**: Reset codes are deleted after successful use
- **Expiration**: Codes expire automatically after 30 minutes (handled by Redis TTL)
- **Secure Hashing**: New passwords are hashed with bcrypt (10 salt rounds)
- **User Verification**: Validates user existence before processing
- **Code Validation**: Exact match required for reset code

### Process Flow
1. Validate input parameters
2. Look up user by username or email
3. Retrieve stored reset code from Redis
4. Compare provided code with stored code
5. Hash new password with bcrypt
6. Update password in database
7. Delete reset code from Redis

### Database Operations
- User lookup by username: `SELECT * FROM users WHERE username = $1`
- User lookup by email: `SELECT * FROM users WHERE email = $1`
- Password update: `UPDATE users SET password_hash = $1 WHERE id = $2`

### Redis Operations
- Get reset token: `GET password_reset:${userId}`
- Delete reset token: `DEL password_reset:${userId}`

## Example Usage

### Valid Password Change (with username)
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "resetCode": "A1B2C3",
    "newPassword": "MyNewSecure123!",
    "username": "johndoe"
  }'
```

### Valid Password Change (with email)
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "resetCode": "A1B2C3",
    "newPassword": "MyNewSecure123!",
    "email": "john@example.com"
  }'
```

### Invalid Reset Code
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{
    "resetCode": "INVALID",
    "newPassword": "MyNewSecure123!",
    "username": "johndoe"
  }'
```

## Complete Password Reset Flow
1. User forgets password
2. User requests reset: [POST /api/auth/forgot-password](./POST_forgot-password.md)
3. User receives 6-digit code via email
4. User submits code with new password: **POST /api/auth/change-password**
5. Password is updated, reset code is invalidated
6. User can now login: [POST /api/auth/login](./POST_login.md)

## Related Endpoints
- [POST /api/auth/forgot-password](./POST_forgot-password.md) - Request password reset code
- [POST /api/auth/login](./POST_login.md) - Login with new password
- [POST /api/auth/register](./POST_register.md) - Create new account

## Dependencies
- **Redis**: For reset token validation and cleanup
- **bcrypt**: For secure password hashing
- **Validation Utils**: `utils/validation.js`
- **Database**: PostgreSQL for user data storage