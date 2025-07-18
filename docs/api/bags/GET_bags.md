# GET /api/bags

## Overview
Retrieves a list of all bags owned by the authenticated user, including disc count for each bag.

## Endpoint
```
GET /api/bags
```

## Authentication
**Required**: Bearer token in Authorization header.

## Query Parameters
None.

## Response

### Success (200 OK)
```json
{
  "bags": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": 123,
      "name": "Tournament Bag",
      "description": "My main tournament setup",
      "is_public": false,
      "is_friends_visible": true,
      "disc_count": 15,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-20T14:45:00.000Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": 123,
      "name": "Practice Bag",
      "description": "Casual rounds and practice",
      "is_public": true,
      "is_friends_visible": true,
      "disc_count": 8,
      "created_at": "2024-01-10T09:15:00.000Z",
      "updated_at": "2024-01-18T16:20:00.000Z"
    }
  ],
  "total": 2
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "UnauthorizedError",
  "message": "Access token required"
}
```

#### 400 Bad Request
```json
{
  "error": "ValidationError", 
  "message": "userId is required"
}
```

## Response Fields

### Bag Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique bag identifier |
| `user_id` | integer | Owner's user ID |
| `name` | string | Bag name |
| `description` | string | Bag description |
| `is_public` | boolean | Whether bag is publicly visible |
| `is_friends_visible` | boolean | Whether bag is visible to friends |
| `disc_count` | integer | Total number of discs in the bag |
| `created_at` | string (ISO 8601) | Bag creation timestamp |
| `updated_at` | string (ISO 8601) | Last modification timestamp |

### Root Object
| Field | Type | Description |
|-------|------|-------------|
| `bags` | array | Array of bag objects |
| `total` | integer | Total number of bags owned by user |

## Service Implementation
**File:** `services/bags.list.service.js`

### Key Features
- User ownership validation
- Disc count aggregation using LEFT JOIN
- Sorted by creation date (newest first)
- Returns both bags array and total count

### Database Operations
- Bags with count query:
  ```sql
  SELECT b.*, COUNT(bc.id) as disc_count
  FROM bags b
  LEFT JOIN bag_contents bc ON b.id = bc.bag_id
  WHERE b.user_id = $1
  GROUP BY b.id, ...
  ORDER BY b.created_at DESC
  ```
- Total count query: `SELECT COUNT(*) FROM bags WHERE user_id = $1`

### Business Logic
- Only returns bags owned by the authenticated user
- Aggregates disc count from bag_contents table
- Converts string counts to integers for consistent API response
- Orders bags by creation date (newest first)

## Example Usage

### Get User's Bags
```bash
curl -X GET http://localhost:3000/api/bags \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Example Response (Empty)
```json
{
  "bags": [],
  "total": 0
}
```

## Use Cases
- Dashboard bag overview
- Bag selection for adding discs
- Bag management interface
- Statistics and analytics

## Related Endpoints
- **[POST /api/bags](./POST_bags.md)** - Create new bag
- **[GET /api/bags/:id](./GET_bags_id.md)** - Get specific bag details
- **[PUT /api/bags/:id](./PUT_bags_id.md)** - Update bag
- **[DELETE /api/bags/:id](./DELETE_bags_id.md)** - Delete bag
- **[GET /api/bags/lost-discs](./GET_bags_lost-discs.md)** - List lost discs