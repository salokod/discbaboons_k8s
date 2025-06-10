# POST /auth/register

Register a new user account.

## Endpoint
```
POST /api/auth/register
```

## Request

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "SecurePass123!"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | ✅ | Valid email address |
| `username` | string | ✅ | Username (4-20 characters, alphanumeric) |
| `password` | string | ✅ | Password (see requirements below) |

### Password Requirements
- **Length**: 8-32 characters
- **Must contain**:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character: `!@#$%^&*(),.?":{}|<>`

### Username Requirements
- **Length**: 4-20 characters
- **Characters**: Alphanumeric only (letters and numbers)

## Responses

### 201 Created - Success
User successfully registered.

```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "testuser",
    "created_at": "2025-06-09T12:00:00.000Z"
  }
}
```

### 400 Bad Request - Validation Errors

**Missing required field:**
```json
{
  "success": false,
  "message": "Email is required"
}
```

**Invalid email format:**
```json
{
  "success": false,
  "message": "Please provide a valid email address"
}
```

**Username too short/long:**
```json
{
  "success": false,
  "message": "Username must be 4-20 characters"
}
```

**Password length invalid:**
```json
{
  "success": false,
  "message": "Password must be at least 8 characters"
}
```

**Password complexity insufficient:**
```json
{
  "success": false,
  "message": "Password must contain uppercase letter, lowercase letter, number, and special character"
}
```

### 409 Conflict - Duplicate User
Email or username already exists.

```json
{
  "success": false,
  "message": "Email or username already registered"
}
```

### 500 Internal Server Error
Server error occurred.

```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

## Examples

### cURL
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "username": "newuser123",
    "password": "MySecure123!"
  }'
```

### JavaScript (fetch)
```javascript
const registerUser = async (userData) => {
  try {
    const response = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Usage
registerUser({
  email: 'test@example.com',
  username: 'testuser',
  password: 'SecurePass123!'
}).then(result => {
  console.log('User registered:', result.user);
}).catch(error => {
  console.error('Failed to register:', error.message);
});
```

### Python (requests)
```python
import requests

def register_user(email, username, password):
    url = "http://localhost:8080/api/auth/register"
    data = {
        "email": email,
        "username": username,
        "password": password
    }
    
    response = requests.post(url, json=data)
    
    if response.status_code == 201:
        return response.json()
    else:
        raise Exception(f"Registration failed: {response.json().get('message')}")

# Usage
try:
    result = register_user("test@example.com", "testuser", "SecurePass123!")
    print(f"User registered: {result['user']}")
except Exception as e:
    print(f"Registration failed: {e}")
```

## Security Notes

- Passwords are hashed using bcrypt with 12 salt rounds
- Password hashes are never returned in API responses
- Email addresses are validated for proper format
- Usernames and emails must be unique across all users

## Related Endpoints

- Coming soon: `POST /auth/login` - User authentication
- Coming soon: `POST /auth/logout` - User logout
- Coming soon: `GET /auth/profile` - Get user profile
