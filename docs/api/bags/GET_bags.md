# GET /api/bags

## Overview
Retrieves a paginated list of all bags owned by the authenticated user, including disc counts and privacy settings.

## Endpoint
```
GET /api/bags
```

## Authentication
**Required**: Bearer token in Authorization header.

## Rate Limiting
- **Window**: 10 minutes
- **Max Requests**: 100 per IP address
- **Purpose**: Prevent excessive bag list requests
- **Headers**: Standard rate limit headers included in response

## Query Parameters
All query parameters are optional:

| Parameter | Type | Description | Default | Validation |
|-----------|------|-------------|---------|------------|
| `limit` | integer | Results per page | 20 | 1-100 |
| `offset` | integer | Results to skip | 0 | ≥ 0 |
| `include_lost` | boolean | Include lost discs in count | false | "true" or "false" |

### Validation Rules
- **limit**: Must be a positive integer between 1 and 100
- **offset**: Must be a non-negative integer (0 or greater)
- **include_lost**: Must be exactly "true" or "false" if provided
- **Unknown parameters**: Any parameters other than allowed ones will result in a 400 error

## Response

### Success (200 OK)
```json
{
  "success": true,
  "bags": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": 123,
      "name": "Tournament Bag",
      "description": "My go-to bag for competitive play",
      "is_public": false,
      "is_friends_visible": true,
      "disc_count": 15,
      "created_at": "2025-01-20T14:30:00.000Z",
      "updated_at": "2025-01-25T09:15:00.000Z"
    },
    {
      "id": "660f9500-f3ac-52e5-b827-557766551111",
      "user_id": 123,
      "name": "Practice Bag",
      "description": "Lightweight bag for field work",
      "is_public": true,
      "is_friends_visible": true,
      "disc_count": 8,
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-20T16:45:00.000Z"
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

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many bags list requests, please try again in 10 minutes"
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