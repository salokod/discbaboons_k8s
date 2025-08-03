# GET /api/bags/friends/:friendUserId

## Overview
Retrieves a list of bags owned by a friend that are visible to the authenticated user (public or friends-visible bags).

## Endpoint
```
GET /api/bags/friends/:friendUserId
```

## Authentication
**Required**: Bearer token in Authorization header.

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `friendUserId` | integer | Yes | User ID of the friend whose bags to retrieve |

## Response

### Success (200 OK)
```json
{
  "friend": {
    "id": 456
  },
  "bags": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": 456,
      "name": "Tournament Setup",
      "description": "My competitive disc selection",
      "is_public": false,
      "is_friends_visible": true,
      "disc_count": 18,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-20T14:45:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": 456,
      "name": "Showcase Bag",
      "description": "My favorite discs",
      "is_public": true,
      "is_friends_visible": true,
      "disc_count": 12,
      "created_at": "2024-01-10T09:15:00.000Z",
      "updated_at": "2024-01-18T16:20:00.000Z"
    }
  ]
}
```

### Error Responses

#### 403 Forbidden - Authorization Error
```json
{
  "error": "AuthorizationError",
  "message": "You are not friends with this user"
}
```

#### 400 Bad Request - Validation Error
```json
{
  "error": "ValidationError",
  "message": "friendUserId is required"
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

### Friend Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Friend's user ID |

### Bag Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique bag identifier |
| `user_id` | integer | Friend's user ID |
| `name` | string | Bag name |
| `description` | string | Bag description |
| `is_public` | boolean | Whether bag is publicly visible |
| `is_friends_visible` | boolean | Whether bag is visible to friends |
| `disc_count` | integer | Total number of discs in the bag |
| `created_at` | string (ISO 8601) | Bag creation timestamp |
| `updated_at` | string (ISO 8601) | Last modification timestamp |

## Service Implementation
**File:** `services/bags.friends.list.service.js`

### Key Features
- **Friendship Verification**: Validates accepted friendship before allowing access
- **Visibility Filtering**: Only returns public or friends-visible bags
- **Disc Count Aggregation**: Includes total disc count for each bag
- **Security-First Design**: Authorization check before data retrieval

### Authorization Logic
1. **Friendship Check**: Validates that users have an accepted friendship
2. **Bidirectional**: Works regardless of who initiated the friendship
3. **Status Validation**: Only 'accepted' friendships grant access
4. **Visibility Filter**: Respects bag privacy settings

### Database Operations
- Friendship verification:
  ```sql
  SELECT id, requester_id, recipient_id, status 
  FROM friendship_requests 
  WHERE status = 'accepted' 
    AND ((requester_id = $1 AND recipient_id = $2) 
         OR (requester_id = $2 AND recipient_id = $1))
  ```
- Bags query with disc count:
  ```sql
  SELECT b.*, COUNT(bc.id) as disc_count
  FROM bags b
  LEFT JOIN bag_contents bc ON b.id = bc.bag_id
  WHERE b.user_id = $1 
    AND (b.is_public = true OR b.is_friends_visible = true)
  ```

### Visibility Rules
- **Public Bags** (`is_public: true`): Visible to all friends
- **Friends-Visible Bags** (`is_friends_visible: true`): Visible to accepted friends only
- **Private Bags**: Never visible to friends

## Example Usage

### Get Friend's Visible Bags
```bash
curl -X GET http://localhost:3000/api/bags/friends/456 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Non-Friend Access (Will Fail)
```bash
curl -X GET http://localhost:3000/api/bags/friends/999 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# Returns 403 Forbidden
```

## Use Cases
- **Bag Inspiration**: View friends' disc setups for ideas
- **Gear Comparison**: Compare bag configurations with friends
- **Tournament Planning**: See what discs friends are throwing
- **Social Discovery**: Explore different disc combinations

## Privacy Considerations
- Only shows bags marked as public or friends-visible
- Requires active friendship between users
- Respects individual bag privacy settings
- Does not reveal private bags under any circumstances

## Related Endpoints
- **[GET /api/bags/friends/:friendUserId/:bagId](./GET_bags_friends_friendUserId_bagId.md)** - View specific friend's bag
- **[GET /api/friends](../friends/GET_friends.md)** - List friends
- **[POST /api/friends/request](../friends/POST_friends_request.md)** - Send friend request
- **[GET /api/bags](./GET_bags.md)** - View own bags