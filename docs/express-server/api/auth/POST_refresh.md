# POST /api/auth/refresh

## Overview
Generates a new access token using a valid refresh token. Implements token rotation for enhanced security.

## Endpoint
```
POST /api/auth/refresh
```

## Authentication
No authentication required (uses refresh token).

## Request Body
```json
{
  "refreshToken": "string"
}
```

### Field Requirements

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refreshToken` | string | Yes | Valid refresh token from login |

## Response

### Success (200 OK)
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Token Details
- **New Access Token**: JWT with 15-minute expiration
  - Contains: `userId`, `username`
- **New Refresh Token**: JWT with 14-day expiration (rotated)
  - Contains: `userId`
  - **Important**: Old refresh token is invalidated

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "error": "ValidationError",
  "message": "Refresh token is required"
}
```

**Possible validation messages:**
- "Refresh token is required"
- "Invalid or expired refresh token"

## Service Implementation
**File:** `services/auth.refresh.service.js`

### Key Features
- Refresh token validation and verification
- New access token generation
- Token rotation (new refresh token issued)
- JWT secret verification
- Input validation

### Security Features
- **Token Rotation**: Each refresh operation generates a new refresh token
- **Expiration Handling**: Validates token expiration
- **Secret Verification**: Uses separate JWT refresh secret
- **Input Validation**: Validates refresh token presence and format

### Token Lifecycle
1. User logs in → receives access + refresh tokens
2. Access token expires (15 minutes)
3. Client uses refresh token → receives new access + refresh tokens
4. Old refresh token is invalidated
5. Process repeats until refresh token expires (14 days)

## Example Usage

### Valid Refresh
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### Using New Access Token
```bash
# Use the new access token immediately
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer NEW_ACCESS_TOKEN"
```

### Invalid/Expired Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "expired_or_invalid_token"
  }'
```

## Client Implementation Notes

### Automatic Token Refresh
```javascript
// Example client-side token refresh logic
const refreshAccessToken = async () => {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        refreshToken: localStorage.getItem('refreshToken') 
      })
    });
    
    if (response.ok) {
      const { accessToken, refreshToken } = await response.json();
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      return accessToken;
    } else {
      // Refresh failed - redirect to login
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    window.location.href = '/login';
  }
};
```

## Related Endpoints
- [POST /api/auth/login](./POST_login.md) - Initial authentication
- [POST /api/auth/register](./POST_register.md) - Create new account
- All authenticated endpoints - use access token for authorization