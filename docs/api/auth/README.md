# Authentication API

This directory contains documentation for all authentication-related endpoints.

## Endpoints

### User Registration
- [POST /auth/register](./register.md) - Register a new user account

## Coming Soon

### User Authentication  
- `POST /auth/login` - Authenticate user and receive JWT token
- `POST /auth/logout` - Invalidate user session
- `POST /auth/refresh` - Refresh JWT token

### Password Management
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/change-password` - Change password (authenticated)

### Profile Management
- `GET /auth/profile` - Get current user profile
- `PUT /auth/profile` - Update user profile
- `DELETE /auth/account` - Delete user account

## Authentication Flow

1. **Register** - Create new account with `/auth/register`
2. **Login** - Authenticate with `/auth/login` to receive JWT
3. **Protected Requests** - Include JWT in `Authorization: Bearer <token>` header
4. **Refresh** - Use `/auth/refresh` when token expires
5. **Logout** - Call `/auth/logout` to invalidate session

## Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Validation**: Comprehensive input validation
- **Rate Limiting**: Protection against brute force attacks
- **HTTPS Only**: All authentication endpoints require HTTPS in production

## Error Handling

All authentication endpoints follow consistent error response format:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

Common error scenarios:
- `400` - Invalid input/validation errors
- `401` - Authentication required or invalid credentials  
- `403` - Access forbidden
- `409` - Resource conflict (duplicate email/username)
- `429` - Rate limit exceeded
- `500` - Internal server error
