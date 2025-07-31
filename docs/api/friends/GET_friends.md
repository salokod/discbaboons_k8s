# GET /api/friends

## Overview
Retrieves a list of all accepted friends for the authenticated user, including comprehensive friend information and bag statistics.

## Endpoint
```
GET /api/friends
```

## Authentication
**Required**: Bearer token in Authorization header.

## Rate Limiting
- **Window**: 10 minutes
- **Max Requests**: 100 per IP address
- **Purpose**: Prevent excessive friends list requests
- **Headers**: Standard rate limit headers included in response

## Request Size Limit
- **Maximum**: 1KB
- **Applies to**: All request components (headers, query params, etc.)
- **Error**: Returns 413 Payload Too Large if exceeded

## Query Parameters
All query parameters are optional:

| Parameter | Type | Description | Default | Validation |
|-----------|------|-------------|---------|------------|
| `limit` | integer | Results per page | 20 | 1-100 |
| `offset` | integer | Results to skip | 0 | ≥ 0 |

### Validation Rules
- **limit**: Must be a positive integer between 1 and 100
- **offset**: Must be a non-negative integer (0 or greater)
- **Unknown parameters**: Any parameters other than `limit` and `offset` will result in a 400 error
- **Invalid types**: Non-numeric values for limit/offset will result in a 400 error

## Response

### Success (200 OK)
```json
{
  "success": true,
  "friends": [
    {
      "id": 789,
      "username": "johndoe",
      "friendship": {
        "id": 123,
        "status": "accepted",
        "created_at": "2024-01-15T10:30:00.000Z"
      },
      "bag_stats": {
        "total_bags": 5,
        "visible_bags": 3,
        "public_bags": 1
      }
    },
    {
      "id": 456,
      "username": "janediscgolf",
      "friendship": {
        "id": 124,
        "status": "accepted",
        "created_at": "2024-01-14T09:15:00.000Z"
      },
      "bag_stats": {
        "total_bags": 8,
        "visible_bags": 6,
        "public_bags": 2
      }
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "message": "Limit must be a positive integer",
  "field": "limit"
}
```

```json
{
  "success": false,
  "message": "Unknown query parameters: sort, filter"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

```json
{
  "success": false,
  "message": "Token validation failed: JWT payload contains invalid userId format"
}
```

#### 413 Payload Too Large
```json
{
  "success": false,
  "message": "Request payload too large. Maximum size is 1KB."
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many friends list requests, please try again in 10 minutes"
}
```

## Response Fields

### Success Response
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always true for successful responses |
| `friends` | array | Array of friend objects with enhanced data |

### Friend Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Friend's user ID |
| `username` | string | Friend's username |
| `friendship` | object | Friendship relationship details |
| `bag_stats` | object | Friend's bag visibility statistics |

### Friendship Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Friendship request ID |
| `status` | string | Always "accepted" for friends list |
| `created_at` | string (ISO 8601) | When friendship was established |

### Bag Stats Object
| Field | Type | Description |
|-------|------|-------------|
| `total_bags` | integer | Total number of bags friend has |
| `visible_bags` | integer | Bags visible to friends (public + friends_visible) |
| `public_bags` | integer | Bags visible to everyone |

## Service Implementation
**File:** `services/friends.list.service.js`

### Key Features
- **Bidirectional Friendship**: Handles friendships where user is requester or recipient
- **Optimized Query**: Single query with JOINs replaces multiple queries for better performance
- **Pagination Support**: Built-in pagination with limit/offset and metadata
- **Comprehensive Validation**: Input validation prevents 500 errors
- **Performance Monitoring**: Query timing with configurable slow query thresholds
- **Privacy Aware**: Calculates bag visibility based on privacy settings

### Validation & Error Prevention
1. **User ID Validation**: Validates user ID format (integer/UUID) before database queries
2. **Pagination Validation**: Ensures limit (1-100) and offset (≥0) are valid
3. **Query Parameter Validation**: Rejects unknown parameters with descriptive errors
4. **Database Parameter Safety**: Validates all parameters to prevent SQL injection
5. **JWT Payload Validation**: Auth middleware validates token structure and userId format

### Performance Features
- **Single Optimized Query**: Replaces N+1 queries with efficient JOINs
- **Query Performance Monitoring**: 
  - Friends query: 500ms slow query threshold
  - Count query: 200ms slow query threshold
- **Parallel Execution**: Friends data and count queries run concurrently
- **Indexed Lookups**: All queries use indexed columns for optimal performance

### Database Operations

#### Optimized Single Query with JOINs
```sql
WITH friend_bag_stats AS (
  SELECT 
    user_id,
    COUNT(*) as total_bags,
    COUNT(*) FILTER (WHERE is_public = true) as public_bags,
    COUNT(*) FILTER (WHERE is_public = true OR is_friends_visible = true) as visible_bags
  FROM bags
  GROUP BY user_id
)
SELECT 
  CASE 
    WHEN fr.requester_id = $1 THEN fr.recipient_id 
    ELSE fr.requester_id 
  END as friend_id,
  u.username,
  fr.id as friendship_id,
  fr.status as friendship_status,
  fr.created_at as friendship_created_at,
  COALESCE(fbs.total_bags, 0) as total_bags,
  COALESCE(fbs.public_bags, 0) as public_bags,
  COALESCE(fbs.visible_bags, 0) as visible_bags
FROM friendship_requests fr
JOIN users u ON (
  CASE 
    WHEN fr.requester_id = $1 THEN u.id = fr.recipient_id 
    ELSE u.id = fr.requester_id 
  END
)
LEFT JOIN friend_bag_stats fbs ON fbs.user_id = u.id
WHERE fr.status = 'accepted'
  AND (fr.requester_id = $1 OR fr.recipient_id = $1)
ORDER BY fr.created_at DESC
LIMIT $2 OFFSET $3
```

#### Count Query for Pagination
```sql
SELECT COUNT(*) as count
FROM friendship_requests
WHERE status = 'accepted'
  AND (requester_id = $1 OR recipient_id = $1)
```

## Example Usage

### Get Friends List (Default)
```bash
curl -X GET http://localhost:3000/api/friends \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Friends List with Pagination
```bash
curl -X GET "http://localhost:3000/api/friends?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Invalid Request (Unknown Parameters)
```bash
curl -X GET "http://localhost:3000/api/friends?sort=name&filter=active" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Returns 400: Unknown query parameters: sort, filter
```

### Response
```json
{
  "success": true,
  "friends": [
    {
      "id": 789,
      "username": "johndoe",
      "friendship": {
        "id": 123,
        "status": "accepted",
        "created_at": "2024-01-15T10:30:00.000Z"
      },
      "bag_stats": {
        "total_bags": 5,
        "visible_bags": 3,
        "public_bags": 1
      }
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

## Bag Statistics Explanation

### Total Bags
- **Definition**: All bags owned by the friend
- **Visibility**: Not necessarily visible to you
- **Use Case**: General activity indicator

### Public Bags
- **Definition**: Bags with `is_public = true`
- **Visibility**: Visible to everyone (including non-friends)
- **Use Case**: Open sharing, tournaments, public showcases

### Visible Bags
- **Definition**: Bags with `is_public = true OR is_friends_visible = true`
- **Visibility**: Visible to friends (you can access these)
- **Use Case**: Friend-only sharing, private collections

### Privacy Calculations
```
visible_bags >= public_bags (public bags are subset of visible)
visible_bags <= total_bags (visible bags are subset of total)
public_bags <= total_bags (public bags are subset of total)
```

## Friendship Direction Handling

### Bidirectional Support
The service handles friendships regardless of who initiated the request:

```javascript
// Determine friend ID based on friendship direction
const friendUserId = friendship.requester_id === userId
  ? friendship.recipient_id  // User was requester, friend is recipient
  : friendship.requester_id; // User was recipient, friend is requester
```

### Use Cases by Friendship Type
- **User as Requester**: User sent request, friend accepted
- **User as Recipient**: Friend sent request, user accepted
- **Equal Treatment**: Both cases treated identically in friends list

## Performance Considerations
- **Single Query Architecture**: One optimized query replaces multiple round trips
- **Performance Monitoring**: Built-in slow query detection and logging
- **Configurable Thresholds**: Different timing thresholds for different query types
- **Indexed Lookups**: All queries use indexed columns
- **Pagination**: Prevents large result sets from overwhelming the system

## Business Rules
- **Accepted Only**: Only includes friendships with "accepted" status
- **Bidirectional**: Shows friends regardless of who initiated
- **Current Data**: Real-time bag statistics
- **Privacy Respect**: Bag stats reflect current privacy settings

## Use Cases
- **Social Dashboard**: Overview of disc golf network
- **Bag Discovery**: See how many bags friends share
- **Privacy Insights**: Understand friend sharing levels
- **Network Management**: Monitor friend connections
- **Social Features**: Enable friend-based functionality

## Related Endpoints
- **[POST /api/friends/request](./POST_friends_request.md)** - Send friend requests
- **[POST /api/friends/respond](./POST_friends_respond.md)** - Accept/decline requests
- **[GET /api/friends/requests](./GET_friends_requests.md)** - List pending requests
- **[GET /api/bags/friends/:friendUserId](../bags/GET_bags_friends_friendUserId.md)** - View friend's bags
- **[GET /api/bags/friends/:friendUserId/:bagId](../bags/GET_bags_friends_friendUserId_bagId.md)** - View specific friend bag