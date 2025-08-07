# POST /api/auth/forgot-password

## Overview
Initiates password reset process by generating a reset code and sending it via email. Accepts either username or email for user identification.

## Endpoint
```
POST /api/auth/forgot-password
```

## Authentication
No authentication required.

## Request Body
```json
{
  "username": "string",  // Optional - either username or email required
  "email": "string"      // Optional - either username or email required
}
```

### Field Requirements

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | No* | Username of the account (if email not provided) |
| `email` | string | No* | Email address of the account (if username not provided) |

**Note**: Either `username` OR `email` must be provided, but not both.

## Response

### Success (200 OK)
```json
{
  "success": true,
  "message": "If an account with that information exists, a password reset code has been sent to the associated email address."
}
```

**Note**: The same success message is returned regardless of whether the account exists for security reasons.

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "message": "Username or email is required"
}
```

**Possible validation messages:**
- "Username or email is required"
- "Invalid email format"

## Service Implementation
**File:** `services/auth.forgotpassword.service.js`

### Key Features
- Flexible user lookup (username OR email)
- Secure 6-digit reset code generation
- Redis-based token storage with expiration
- Email template integration
- Security-focused response handling

### Security Features
- **Information Disclosure Prevention**: Same response regardless of account existence
- **Token Expiration**: Reset codes expire after 30 minutes (1800 seconds)
- **Secure Token Generation**: Uses crypto.randomBytes for random 6-digit codes
- **Redis Storage**: Temporary storage prevents database pollution

### Reset Code Details
- **Format**: 6-character hexadecimal (uppercase)
- **Example**: `A1B2C3`
- **Expiration**: 30 minutes
- **Storage**: Redis key pattern: `password_reset:${userId}`

### Database Operations
- User lookup by username: `SELECT id, username, email FROM users WHERE username = $1`
- User lookup by email: `SELECT id, username, email FROM users WHERE email = $1`

### Redis Operations
- Store reset token: `SETEX password_reset:${userId} 1800 ${resetToken}`

## Example Usage

### Using Username
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe"
  }'
```

### Using Email
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

### Invalid Email Format
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email"
  }'
```

## Email Content
When a valid account is found, the user receives an email containing:
- 6-digit reset code
- Instructions for using the code
- Code expiration time (30 minutes)
- Professionally formatted HTML template

## Password Reset Flow
1. User requests password reset
2. System validates input and looks up account
3. If account exists:
   - Generate 6-digit reset code
   - Store code in Redis with 30-minute expiration
   - Send email with reset code
4. User receives email with reset code
5. User uses code with [POST /api/auth/change-password](./POST_change-password.md)

## Related Endpoints
- [POST /api/auth/change-password](./POST_change-password.md) - Complete password reset with code
- [POST /api/auth/forgot-username](./POST_forgot-username.md) - Recover forgotten username
- [POST /api/auth/login](./POST_login.md) - Login with new password

## Dependencies
- **Redis**: For temporary reset token storage
- **Email Service**: `services/email/email.service.js`
- **Email Templates**: `services/email/email.template.service.js`
- **Validation Utils**: `utils/validation.js`
- **Crypto**: Node.js crypto module for secure token generation