# GET /api/profile

## Overview
Retrieves the authenticated user's complete profile information, including all personal data and privacy settings.

## Endpoint
```
GET /api/profile
```

## Authentication
**Required**: Bearer token in Authorization header.

## Response

### Success (200 OK)
```json
{
  "success": true,
  "profile": {
    "user_id": 123,
    "name": "John Doe",
    "bio": "Passionate disc golfer from Austin. Love throwing Innova discs!",
    "country": "United States",
    "state_province": "Texas",
    "city": "Austin",
    "isnamepublic": true,
    "isbiopublic": false,
    "islocationpublic": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "error": "ValidationError",
  "message": "User ID is required"
}
```

#### 401 Unauthorized
```json
{
  "error": "UnauthorizedError",
  "message": "Access token required"
}
```

## Response Fields

### Success Response
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always true for successful responses |
| `profile` | object | Complete user profile object |

### Profile Object
| Field | Type | Description |
|-------|------|-------------|
| `user_id` | integer | User's unique identifier |
| `name` | string | User's display name |
| `bio` | string | User's biography/description |
| `country` | string | User's country |
| `state_province` | string | User's state or province |
| `city` | string | User's city |
| `isnamepublic` | boolean | Whether name is visible in search results |
| `isbiopublic` | boolean | Whether bio is visible in search results |
| `islocationpublic` | boolean | Whether location is visible in search results |
| `created_at` | string (ISO 8601) | Profile creation timestamp |
| `updated_at` | string (ISO 8601) | Last profile update timestamp |

## Service Implementation
**File:** `services/profile.get.service.js`

### Key Features
- **Complete Profile Data**: Returns all profile information including privacy settings
- **User Validation**: Validates user ID from JWT token
- **Direct Database Access**: Simple query for user's own profile
- **No Privacy Filtering**: Returns all data since user is viewing their own profile

### Database Operations
- Profile lookup: `SELECT * FROM user_profiles WHERE user_id = $1`

## Example Usage

### Get Own Profile
```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Response
```json
{
  "success": true,
  "profile": {
    "user_id": 123,
    "name": "John Doe",
    "bio": "Passionate disc golfer from Austin",
    "country": "United States",
    "state_province": "Texas",
    "city": "Austin",
    "isnamepublic": true,
    "isbiopublic": false,
    "islocationpublic": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

## Privacy Settings

### Name Privacy (`isnamepublic`)
- **true**: Name appears in search results
- **false**: Name hidden from public searches
- **Default**: Typically true for social features

### Bio Privacy (`isbiopublic`)
- **true**: Bio appears in search results
- **false**: Bio hidden from public searches
- **Default**: User choice, often false for privacy

### Location Privacy (`islocationpublic`)
- **true**: City, state, country appear in search results
- **false**: Location hidden from public searches
- **Default**: User choice, useful for finding local players

### Privacy Impact
These settings only affect public search results. Friends and the user themselves always see all profile data through appropriate endpoints.

## Profile Data Handling

### Complete Data Access
Unlike public search endpoints, this returns ALL profile data because:
- **Owner Access**: User is viewing their own profile
- **Settings Management**: User needs to see current privacy settings
- **Complete Picture**: All data needed for profile management

### Null Handling
- **New Users**: May have null profile initially
- **Partial Data**: Some fields may be null/empty
- **Default Values**: Privacy settings have database defaults

## Use Cases
- **Profile Management**: View current profile information
- **Privacy Review**: Check current privacy settings
- **Data Verification**: Confirm profile accuracy
- **Settings Dashboard**: Display current configuration
- **Profile Editing**: Pre-populate edit forms

## Business Rules
- **Owner Only**: Users can only access their own profile via this endpoint
- **Authentication Required**: Must be logged in
- **Complete Data**: Returns all profile fields regardless of privacy settings
- **Real-time**: Reflects current database state

## Security Features
- **Authentication Required**: Bearer token validation
- **User Isolation**: Only returns data for authenticated user
- **No Sensitive Data**: Profile doesn't include password or tokens
- **JWT Validation**: User ID extracted from validated JWT

## Related Endpoints
- **[PUT /api/profile](./PUT_profile.md)** - Update profile information and privacy settings
- **[GET /api/profile/search](./GET_profile_search.md)** - Search public profiles (no auth required)
- **[POST /api/friends/request](../friends/POST_friends_request.md)** - Send friend requests to other users