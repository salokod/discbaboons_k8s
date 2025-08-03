# Authentication API Endpoints

## Overview
The authentication system provides user registration, login, password recovery, and token management functionality.

## Endpoints

### User Registration & Login
- **[POST /api/auth/register](./POST_register.md)** - Create new user account
- **[POST /api/auth/login](./POST_login.md)** - Authenticate user and receive tokens

### Token Management  
- **[POST /api/auth/refresh](./POST_refresh.md)** - Refresh access token using refresh token

### Password Recovery
- **[POST /api/auth/forgot-username](./POST_forgot-username.md)** - Recover forgotten username via email
- **[POST /api/auth/forgot-password](./POST_forgot-password.md)** - Request password reset code
- **[POST /api/auth/change-password](./POST_change-password.md)** - Complete password reset with code

## Security Features

### Password Requirements
- 8-32 characters
- Uppercase letter (A-Z)
- Lowercase letter (a-z) 
- Number (0-9)
- Special character (!@#$%^&*(),.?":{}|<>)

### Username Requirements
- 4-20 characters
- Must be unique

### Token Security
- **Access Token**: 15-minute expiration
- **Refresh Token**: 14-day expiration with rotation
- **Reset Codes**: 6-digit hex, 30-minute expiration

### Security Measures
- bcrypt password hashing (12 rounds for registration, 10 for reset)
- JWT token signing with separate secrets
- Generic error messages to prevent information disclosure
- Redis-based temporary storage for reset codes
- One-time use reset codes

## Error Handling

### Common Error Types
- **ValidationError (400)**: Invalid input data
- **UnauthorizedError (401)**: Invalid credentials
- **ConflictError (409)**: Duplicate username/email

### Example Error Response
```json
{
  "error": "ValidationError",
  "message": "Password must contain uppercase letter, lowercase letter, number, and special character"
}
```