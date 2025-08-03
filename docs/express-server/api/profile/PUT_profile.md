# PUT /api/profile

## Overview
Updates the authenticated user's profile information and privacy settings. Supports partial updates and automatically creates profile if it doesn't exist.

## Endpoint
```
PUT /api/profile
```

## Authentication
**Required**: Bearer token in Authorization header.

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | User's display name |
| `bio` | string | No | User's biography/description |
| `country` | string | No | User's country |
| `state_province` | string | No | User's state or province |
| `city` | string | No | User's city |
| `isnamepublic` | boolean | No | Whether name is visible in search results |
| `isbiopublic` | boolean | No | Whether bio is visible in search results |
| `islocationpublic` | boolean | No | Whether location is visible in search results |

### Example Request
```json
{
  "name": "John Doe",
  "bio": "Passionate disc golfer from Austin. Love throwing Innova discs!",
  "city": "Austin",
  "state_province": "Texas",
  "country": "United States",
  "isnamepublic": true,
  "isbiopublic": false,
  "islocationpublic": true
}
```

### Partial Update Example
```json
{
  "bio": "Updated bio with new information",
  "isbiopublic": true
}
```

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
    "updated_at": "2024-01-15T10:35:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "success": false,
  "message": "Update data is required"
}
```

**Possible validation messages:**
- "User ID is required"
- "Update data is required"
- "No valid fields to update"

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

#### 413 Payload Too Large
```json
{
  "success": false,
  "message": "Request entity too large"
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many profile update requests, please try again in 1 hour"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Response Fields

### Success Response
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always true for successful responses |
| `profile` | object | Updated profile object with all fields |

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
**File:** `services/profile.update.service.js`

### Key Features
- **Field Filtering**: Only allows updates to predefined safe fields
- **Partial Updates**: Supports updating only specific fields
- **Upsert Logic**: Creates profile if it doesn't exist, updates if it does
- **Input Validation**: Validates request structure and content
- **Privacy Management**: Handles boolean privacy settings

### Allowed Fields
```javascript
const ALLOWED_FIELDS = [
  'name',
  'bio', 
  'country',
  'state_province',
  'city',
  'isnamepublic',
  'isbiopublic',
  'islocationpublic'
];
```

### Upsert Logic
The service uses PostgreSQL's `ON CONFLICT` clause for efficient upsert:

```sql
INSERT INTO user_profiles (user_id, field1, field2, ...) 
VALUES ($1, $2, $3, ...)
ON CONFLICT (user_id) DO UPDATE SET 
  field1 = $2, field2 = $3, ...
RETURNING *
```

### Database Operations
- Upsert profile: Uses `INSERT ... ON CONFLICT ... DO UPDATE` for atomic operation

## Example Usage

### Update Complete Profile
```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "bio": "Passionate disc golfer from Austin",
    "city": "Austin",
    "state_province": "Texas", 
    "country": "United States",
    "isnamepublic": true,
    "isbiopublic": false,
    "islocationpublic": true
  }'
```

### Update Only Bio and Privacy
```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Updated bio with new tournament results!",
    "isbiopublic": true
  }'
```

### Toggle Privacy Settings Only
```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isnamepublic": false,
    "islocationpublic": false
  }'
```

## Field Validation

### String Fields
- **name**: User's display name
- **bio**: Free-text biography 
- **country**: Country name
- **state_province**: State or province name
- **city**: City name

### Boolean Fields
- **isnamepublic**: Controls name visibility in search
- **isbiopublic**: Controls bio visibility in search
- **islocationpublic**: Controls location visibility in search

### Security Filtering
- **Allowed Fields Only**: Filters out any fields not in ALLOWED_FIELDS
- **Type Safety**: Database handles type validation
- **Injection Protection**: Uses parameterized queries

## Privacy Impact

### Public Search Visibility
Changes to privacy settings immediately affect:
- **[GET /api/profile/search](./GET_profile_search.md)** results
- **Public User Discovery**: Who can find you and what they see
- **Social Features**: How you appear to potential friends

### Privacy Combinations
- **Fully Public**: All privacy settings true
- **Name Only**: Only `isnamepublic = true`
- **Location Only**: Only `islocationpublic = true`
- **Fully Private**: All privacy settings false (not searchable)

## Use Cases
- **Profile Setup**: Initial profile creation for new users
- **Information Updates**: Change personal information
- **Privacy Management**: Control public visibility
- **Bio Updates**: Share current disc golf interests/achievements
- **Location Updates**: Update current location for local connections

## Business Rules
- **Owner Only**: Users can only update their own profile
- **Partial Updates**: Any combination of allowed fields can be updated
- **Upsert Behavior**: Creates profile if none exists
- **Field Filtering**: Ignores invalid/dangerous fields
- **Privacy Control**: User has complete control over visibility

## Security Features
- **Authentication Required**: Bearer token validation
- **Field Whitelisting**: Only safe fields are updatable
- **SQL Injection Protection**: Parameterized queries
- **User Isolation**: Can only update own profile
- **Input Validation**: Validates request structure

## Related Endpoints
- **[GET /api/profile](./GET_profile.md)** - Get current profile information
- **[GET /api/profile/search](./GET_profile_search.md)** - Search public profiles (affected by privacy settings)
- **[POST /api/friends/request](../friends/POST_friends_request.md)** - Send friend requests (uses public search to find users)