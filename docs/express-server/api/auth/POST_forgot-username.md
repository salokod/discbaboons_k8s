# POST /api/auth/forgot-username

## Overview
Sends an email containing the username for the account associated with the provided email address.

## Endpoint
```
POST /api/auth/forgot-username
```

## Authentication
No authentication required.

## Request Body
```json
{
  "email": "string"
}
```

### Field Requirements

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email address associated with account |

## Response

### Success (200 OK)
```json
{
  "success": true,
  "message": "If an account associated with this email address exists, an email containing your username has been sent."
}
```

**Note**: The same success message is returned regardless of whether the email exists in the system for security reasons.

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "error": "ValidationError",
  "message": "Email is required"
}
```

**Possible validation messages:**
- "Email is required"
- "Invalid email format"

## Service Implementation
**File:** `services/auth.forgotusername.service.js`

### Key Features
- Email format validation
- User lookup by email address
- Email template rendering
- Email delivery service integration
- Security-focused response handling

### Security Features
- **Information Disclosure Prevention**: Same response returned regardless of email existence
- **Email Validation**: Validates email format before processing
- **Secure User Lookup**: Only sends email if user actually exists

### Email Template
Uses email template service to generate formatted email:
- **Template**: `forgotusername`
- **Variables**: `username`
- **Subject**: Defined in template configuration
- **Format**: HTML email

### Database Operations
- User lookup: `SELECT id, username, email FROM users WHERE email = $1`

## Example Usage

### Valid Request
```bash
curl -X POST http://localhost:3000/api/auth/forgot-username \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

### Invalid Email Format
```bash
curl -X POST http://localhost:3000/api/auth/forgot-username \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email"
  }'
```

## Email Content
When a valid email is found, the user receives an email containing:
- Their username
- Instructions for logging in
- Professionally formatted HTML template

## User Flow
1. User forgets their username
2. User provides their email address
3. System looks up account by email
4. If account exists, email is sent with username
5. User receives email and can use username to log in
6. Same success message shown regardless of account existence

## Related Endpoints
- [POST /api/auth/login](./POST_login.md) - Login with recovered username
- [POST /api/auth/forgot-password](./POST_forgot-password.md) - Reset forgotten password
- [POST /api/auth/register](./POST_register.md) - Create new account if needed

## Dependencies
- **Email Service**: `services/email/email.service.js`
- **Email Templates**: `services/email/email.template.service.js`
- **Validation Utils**: `utils/validation.js`