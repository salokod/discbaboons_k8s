# GET /api/bags/:id

## Overview
Retrieves detailed information about a specific bag, including all disc contents with merged data from disc master.

## Endpoint
```
GET /api/bags/:id
```

## Authentication
**Required**: Bearer token in Authorization header.

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Unique bag identifier |

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `include_lost` | boolean | No | false | Include lost discs in response |

## Response

### Success (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": 123,
  "name": "Tournament Bag",
  "description": "My main tournament setup",
  "is_public": false,
  "is_friends_visible": true,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-20T14:45:00.000Z",
  "bag_contents": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "user_id": 123,
      "bag_id": "550e8400-e29b-41d4-a716-446655440000",
      "disc_id": "770e8400-e29b-41d4-a716-446655440000",
      "notes": "Reliable fairway driver",
      "weight": "175.0",
      "condition": "good",
      "plastic_type": "Champion",
      "color": "Red",
      "speed": 9,
      "glide": 5,
      "turn": -1,
      "fade": 2,
      "brand": "Innova",
      "model": "Thunderbird",
      "is_lost": false,
      "created_at": "2024-01-16T12:00:00.000Z",
      "updated_at": "2024-01-18T10:15:00.000Z",
      "disc_master": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "brand": "Innova",
        "model": "Thunderbird",
        "speed": 9,
        "glide": 5,
        "turn": -1,
        "fade": 2,
        "approved": true,
        "added_by_id": 456,
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    }
  ]
}
```

### Error Responses

#### 404 Not Found
```json
{
  "error": "NotFoundError",
  "message": "Bag not found"
}
```

#### 400 Bad Request - Invalid UUID
```json
{
  "error": "ValidationError",
  "message": "bagId is required"
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

### Bag Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique bag identifier |
| `user_id` | integer | Owner's user ID |
| `name` | string | Bag name |
| `description` | string | Bag description |
| `is_public` | boolean | Whether bag is publicly visible |
| `is_friends_visible` | boolean | Whether bag is visible to friends |
| `created_at` | string (ISO 8601) | Bag creation timestamp |
| `updated_at` | string (ISO 8601) | Last modification timestamp |
| `bag_contents` | array | Array of disc content objects |

### Bag Content Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique content identifier |
| `disc_id` | string (UUID) | Reference to disc master |
| `notes` | string | User notes about this disc |
| `weight` | string | Disc weight in grams |
| `condition` | string | Disc condition (new, good, worn, beat-in) |
| `plastic_type` | string | Plastic type (Champion, Star, etc.) |
| `color` | string | Disc color |
| `speed` | integer | Flight number (custom or from master) |
| `glide` | integer | Flight number (custom or from master) |
| `turn` | integer | Flight number (custom or from master) |
| `fade` | integer | Flight number (custom or from master) |
| `brand` | string | Disc brand (custom or from master) |
| `model` | string | Disc model (custom or from master) |
| `is_lost` | boolean | Whether disc is marked as lost |
| `disc_master` | object | Original disc master data |

## Service Implementation
**File:** `services/bags.get.service.js`

### Key Features
- **User Authorization**: Only returns bags owned by authenticated user
- **UUID Validation**: Validates bag ID format before database query
- **Data Merging**: Merges custom disc data with disc master fallbacks
- **Lost Disc Filtering**: Optional inclusion of lost discs
- **Join Optimization**: Single query to get all disc contents with master data

### Security Features
- **Ownership Validation**: `WHERE b.id = $1 AND b.user_id = $2`
- **UUID Format Validation**: Prevents invalid UUID queries
- **Access Control**: Only bag owner can access content

### Data Merging Logic
For each disc content, the service merges:
- **Custom Values**: User-customized flight numbers, brand, model
- **Master Fallbacks**: Original disc master data when custom values are null
- **Priority**: Custom values override master values when present

### Database Operations
- Bag lookup: `SELECT b.* FROM bags b WHERE b.id = $1 AND b.user_id = $2`
- Contents with master: Complex JOIN query between `bag_contents` and `disc_master`

## Example Usage

### Get Bag (Without Lost Discs)
```bash
curl -X GET http://localhost:3000/api/bags/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Bag (Including Lost Discs)
```bash
curl -X GET "http://localhost:3000/api/bags/550e8400-e29b-41d4-a716-446655440000?include_lost=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Invalid UUID Format
```bash
curl -X GET http://localhost:3000/api/bags/invalid-uuid \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
# Returns 404 Not Found
```

## Use Cases
- **Bag Detail View**: Complete bag information for UI
- **Disc Management**: Managing discs within a bag
- **Tournament Prep**: Reviewing bag setup before rounds
- **Lost Disc Review**: Including/excluding lost discs from view

## Related Endpoints
- **[GET /api/bags](./GET_bags.md)** - List all user's bags
- **[PUT /api/bags/:id](./PUT_bags_id.md)** - Update bag
- **[DELETE /api/bags/:id](./DELETE_bags_id.md)** - Delete bag
- **[POST /api/bags/:id/discs](./POST_bags_id_discs.md)** - Add discs to bag
- **[PUT /api/bags/:id/discs/:contentId](./PUT_bags_id_discs_contentId.md)** - Edit disc in bag