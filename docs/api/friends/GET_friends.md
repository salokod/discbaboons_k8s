# GET /api/friends

## Overview
Retrieves a list of all accepted friends for the authenticated user, including comprehensive friend information and bag statistics.

## Endpoint
```
GET /api/friends
```

## Authentication
**Required**: Bearer token in Authorization header.

## Response

### Success (200 OK)
```json
{
  "success": true,
  "friends": [
    {
      "id": 789,
      "username": "johndoe",
      "email": "john@example.com",
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
      "email": "jane@example.com",
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
  ]
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
| `friends` | array | Array of friend objects with enhanced data |

### Friend Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Friend's user ID |
| `username` | string | Friend's username |
| `email` | string | Friend's email address |
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
- **Enhanced Data**: Enriches basic friendship data with user info and bag stats
- **Privacy Aware**: Calculates bag visibility based on privacy settings
- **Performance Optimized**: Uses efficient parallel queries for friend data

### Data Enhancement Process
1. **Friendship Query**: Find all accepted friendships involving the user
2. **Friend Identification**: Determine who the "other person" is in each friendship
3. **User Data Lookup**: Get username and email for each friend
4. **Bag Statistics**: Calculate total, public, and visible bag counts
5. **Data Assembly**: Combine all data into enhanced friend objects

### Database Operations

#### Main Friendship Query
```sql
SELECT id, requester_id, recipient_id, status, created_at, updated_at
FROM friendship_requests
WHERE status = 'accepted'
  AND (requester_id = $1 OR recipient_id = $1)
ORDER BY created_at DESC
```

#### Friend User Details
```sql
SELECT id, username, email
FROM users
WHERE id = $1
```

#### Bag Statistics Queries
```sql
-- Total bags
SELECT COUNT(*) as count FROM bags WHERE user_id = $1

-- Public bags
SELECT COUNT(*) as count FROM bags WHERE user_id = $1 AND is_public = true

-- Visible bags (public + friends_visible)
SELECT COUNT(*) as count FROM bags 
WHERE user_id = $1 AND (is_public = true OR is_friends_visible = true)
```

## Example Usage

### Get Friends List
```bash
curl -X GET http://localhost:3000/api/friends \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Response
```json
{
  "success": true,
  "friends": [
    {
      "id": 789,
      "username": "johndoe",
      "email": "john@example.com",
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
  ]
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
- **Parallel Processing**: Uses Promise.all for concurrent friend data fetching
- **Efficient Queries**: Minimizes database round trips
- **Indexed Lookups**: All queries use indexed columns
- **Reasonable Scale**: Designed for typical social network friend counts

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