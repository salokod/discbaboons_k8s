# GET /api/profile/search

## Overview
Searches for public user profiles by username or city. Only returns profiles with at least one public field and respects individual privacy settings.

## Endpoint
```
GET /api/profile/search
```

## Authentication
**Not Required**: This is a public endpoint.

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | No* | Search by username (partial match, case-insensitive) |
| `city` | string | No* | Search by city (partial match, case-insensitive) |

**Note**: At least one search parameter (`username` OR `city`) must be provided.

## Response

### Success (200 OK)
```json
[
  {
    "user_id": 123,
    "username": "johndoe",
    "name": "John Doe",
    "bio": "Disc golf enthusiast from Austin",
    "city": "Austin",
    "state_province": "Texas",
    "country": "United States"
  },
  {
    "user_id": 456,
    "username": "janediscgolf",
    "name": "Jane Smith",
    "city": "Austin",
    "state_province": "Texas",
    "country": "United States"
  }
]
```

**Note**: Only public fields are included in the response based on user privacy settings.

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "error": "ValidationError",
  "message": "Search query is required"
}
```

## Response Fields

### Profile Object
| Field | Type | Conditional | Description |
|-------|------|-------------|-------------|
| `user_id` | integer | Always | User's unique identifier |
| `username` | string | Always | User's username |
| `name` | string | If public | User's display name |
| `bio` | string | If public | User's biography |
| `city` | string | If location public | User's city |
| `state_province` | string | If location public | User's state/province |
| `country` | string | If location public | User's country |

### Privacy Controls
Fields are only included if the user has made them public:
- **Name**: Included if `isnamepublic = true`
- **Bio**: Included if `isbiopublic = true`
- **Location**: Included if `islocationpublic = true`

## Service Implementation
**File:** `services/profile.search.service.js`

### Key Features
- **Privacy Respecting**: Only returns profiles with at least one public field
- **Flexible Search**: Supports username and/or city filtering
- **Case-Insensitive**: Uses ILIKE for partial matching
- **Public Data Only**: Filters out private profile information
- **No Authentication Required**: Public search functionality

### Privacy Logic
1. **Visibility Filter**: Only includes profiles with at least one public field
2. **Field Filtering**: Conditionally includes fields based on privacy settings
3. **Username Always Public**: Username is always included (considered public info)

### Database Operations
- Profile search with join:
  ```sql
  SELECT up.*, u.username
  FROM user_profiles up
  JOIN users u ON up.user_id = u.id
  WHERE (up.isnamepublic = true OR up.isbiopublic = true OR up.islocationpublic = true)
    AND [search conditions]
  ORDER BY u.username ASC
  ```

## Example Usage

### Search by Username
```bash
curl -X GET "http://localhost:3000/api/profile/search?username=john"
```

### Search by City
```bash
curl -X GET "http://localhost:3000/api/profile/search?city=austin"
```

### Combined Search
```bash
curl -X GET "http://localhost:3000/api/profile/search?username=disc&city=austin"
```

### Search with Spaces (URL Encoded)
```bash
curl -X GET "http://localhost:3000/api/profile/search?city=San%20Francisco"
```

## Privacy Examples

### User with All Fields Public
```json
{
  "user_id": 123,
  "username": "johndoe",
  "name": "John Doe",
  "bio": "Love disc golf!",
  "city": "Austin",
  "state_province": "Texas", 
  "country": "United States"
}
```

### User with Only Name Public
```json
{
  "user_id": 456,
  "username": "private_user",
  "name": "Jane Smith"
}
```

### User with Only Location Public
```json
{
  "user_id": 789,
  "username": "anonymous_player",
  "city": "Portland",
  "state_province": "Oregon",
  "country": "United States"
}
```

## Use Cases
- **Friend Discovery**: Find users in the same city
- **Player Lookup**: Search for specific usernames
- **Community Building**: Connect with local disc golfers
- **Tournament Organization**: Find players in tournament areas

## Privacy Considerations
- **Opt-in Visibility**: Users must explicitly make profile fields public
- **Partial Data**: Search results may contain partial profile information
- **Username Public**: Usernames are considered public information
- **No Private Data**: Never exposes email addresses or other sensitive information

## Related Endpoints
- **[GET /api/profile](./GET_profile.md)** - Get own profile (authenticated)
- **[PUT /api/profile](./PUT_profile.md)** - Update profile and privacy settings
- **[POST /api/friends/request](../friends/POST_friends_request.md)** - Send friend request to found users