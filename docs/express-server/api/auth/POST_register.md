# POST /api/auth/register

## Overview
Registers a new user account with email, username, and password.

## Endpoint
```
POST /api/auth/register
```

## Authentication
No authentication required.

## Request Body
```json
{
  "email": "string",
  "username": "string", 
  "password": "string"
}
```

### Field Requirements

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | Yes | Must be valid email format |
| `username` | string | Yes | 4-20 characters |
| `password` | string | Yes | 8-32 characters with complexity requirements |

### Password Requirements
- 8-32 characters in length
- Must contain at least one uppercase letter (A-Z)
- Must contain at least one lowercase letter (a-z)
- Must contain at least one number (0-9)
- Must contain at least one special character (!@#$%^&*(),.?":{}|<>)

## Response

### Success (201 Created)
```json
{
  "success": true,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "username": "johndoe",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

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
- "Password is required" 
- "Username is required"
- "Username must be 4-20 characters"
- "Please provide a valid email address"
- "Password must be at least 8 characters"
- "Password must be no more than 32 characters"
- "Password must contain uppercase letter, lowercase letter, number, and special character"

#### 409 Conflict - Duplicate User
```json
{
  "error": "ConflictError",
  "message": "Email or username already registered"
}
```

## Service Implementation
**File:** `services/auth.register.service.js`

### Key Features
- Input validation for all required fields
- Email format validation using utility function
- Username length validation (4-20 characters)
- Complex password requirements validation
- Duplicate email/username checking
- Password hashing using bcrypt (salt rounds: 12)
- Transactional user creation

### Database Operations
- Checks existing email: `SELECT id, email FROM users WHERE email = $1`
- Checks existing username: `SELECT id, username FROM users WHERE username = $1`
- Creates user: `INSERT INTO users (email, username, password_hash, created_at) VALUES (...)`

## Example Usage

### Valid Request
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "username": "johndoe",
    "password": "MySecure123!"
  }'
```

### Invalid Request (Weak Password)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com", 
    "username": "johndoe",
    "password": "weak"
  }'
```

## Related Endpoints
- [POST /api/auth/login](./POST_login.md) - Login with registered credentials
- [POST /api/auth/forgot-username](./POST_forgot-username.md) - Recover forgotten username
- [POST /api/auth/forgot-password](./POST_forgot-password.md) - Reset forgotten password