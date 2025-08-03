# GET /api/discs/master

## Overview
Retrieves a filtered and paginated list of disc golf discs from the master disc database. Supports complex filtering by flight numbers, brand, model, and approval status.

## Endpoint
```
GET /api/discs/master
```

## Authentication
**Required**: Bearer token in Authorization header.

## Rate Limiting
- **Window**: 10 minutes
- **Limit**: 100 requests per IP address
- **Purpose**: Prevents database hammering and abuse of disc search functionality
- **Headers Returned**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Time when limit resets

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand` | string | No | - | Exact brand name match |
| `model` | string | No | - | Partial model name match (case-insensitive) |
| `speed` | string | No | - | Speed value or range (e.g., "9" or "8-10") |
| `glide` | string | No | - | Glide value or range (e.g., "5" or "4-6") |
| `turn` | string | No | - | Turn value or range (e.g., "-1" or "-2-0") |
| `fade` | string | No | - | Fade value or range (e.g., "2" or "1-3") |
| `approved` | boolean | No | true | Filter by approval status |
| `limit` | integer | No | 50 | Number of results to return (max 100) |
| `offset` | integer | No | 0 | Number of results to skip (min 0) |

### Flight Number Ranges
Flight numbers support both single values and ranges:
- **Single Value**: `speed=9` (exact match)
- **Range**: `speed=8-10` (inclusive range from 8 to 10)
- **Negative Values**: `turn=-2` or `turn=-3--1` (range from -3 to -1)

### Filter Types
- **Brand**: Exact match (case-sensitive)
- **Model**: Partial match using ILIKE (case-insensitive)
- **Flight Numbers**: Single value or range matching
- **Approved**: Boolean filter (defaults to true for normal users)

## Response

### Success (200 OK)
```json
{
  "success": true,
  "discs": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "brand": "Innova",
      "model": "Thunderbird",
      "speed": 9,
      "glide": 5,
      "turn": -1,
      "fade": 2,
      "approved": true,
      "added_by_id": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "brand": "Discraft",
      "model": "Zone",
      "speed": 4,
      "glide": 3,
      "turn": 0,
      "fade": 3,
      "approved": true,
      "added_by_id": 123,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 50,
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
  "message": "Invalid filter value"
}
```

**Possible validation messages:**
- "Invalid filter value" (for malformed flight number ranges)
- "Invalid limit" (limit must be between 1-100)
- "Invalid offset" (offset must be >= 0)

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many disc searches, please try again in 10 minutes"
}
```

**Rate Limit Headers:**
- `X-RateLimit-Limit`: 100
- `X-RateLimit-Remaining`: 0
- `X-RateLimit-Reset`: [timestamp]

## Response Fields

### Response Object
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always true for successful responses |
| `discs` | array | Array of disc objects (see below) |
| `pagination` | object | Pagination metadata (see below) |

### Disc Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique disc identifier |
| `brand` | string | Disc manufacturer/brand |
| `model` | string | Disc model name |
| `speed` | integer | Flight rating: Speed (1-15) |
| `glide` | integer | Flight rating: Glide (1-7) |
| `turn` | integer | Flight rating: Turn (-5 to 2) |
| `fade` | integer | Flight rating: Fade (0-5) |
| `approved` | boolean | Whether disc is approved for public use |
| `added_by_id` | integer | User ID who added disc (null for system discs) |
| `created_at` | string (ISO 8601) | Disc creation timestamp |
| `updated_at` | string (ISO 8601) | Last modification timestamp |

### Pagination Object
| Field | Type | Description |
|-------|------|-------------|
| `total` | integer | Total number of discs matching filters |
| `limit` | integer | Number of results returned (max 100) |
| `offset` | integer | Number of results skipped |
| `hasMore` | boolean | Whether more results are available |

## Service Implementation
**File:** `services/discs.list.service.js`

### Key Features
- **Complex Flight Number Filtering**: Supports both single values and ranges
- **Range Parsing**: Handles negative numbers and complex ranges like "-3--1"
- **Input Validation**: Validates all filter parameters using regex
- **SQL Injection Protection**: Uses parameterized queries
- **Default Approved Filter**: Only shows approved discs by default
- **Flexible Model Search**: Case-insensitive partial matching for model names

### Range Format Support
- **Single Value**: `9` → `speed = 9`
- **Positive Range**: `8-10` → `speed >= 8 AND speed <= 10`
- **Negative Range**: `-3--1` → `turn >= -3 AND turn <= -1`
- **Mixed Range**: `-2-1` → `turn >= -2 AND turn <= 1`

### Database Operations
- Main query: `SELECT * FROM disc_master WHERE ... ORDER BY brand ASC, model ASC LIMIT ... OFFSET ...`
- Uses dynamic WHERE clause construction based on provided filters

## Example Usage

### Get All Approved Discs (Default)
```bash
curl -X GET http://localhost:3000/api/discs/master \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Filter by Brand
```bash
curl -X GET "http://localhost:3000/api/discs/master?brand=Innova" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Search by Model Name
```bash
curl -X GET "http://localhost:3000/api/discs/master?model=destroyer" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Filter by Speed Range
```bash
curl -X GET "http://localhost:3000/api/discs/master?speed=9-12" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Filter by Multiple Flight Numbers
```bash
curl -X GET "http://localhost:3000/api/discs/master?speed=9&glide=5&turn=-1&fade=2" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Filter by Turn Range (Negative Numbers)
```bash
curl -X GET "http://localhost:3000/api/discs/master?turn=-3--1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Complex Filter with Pagination
```bash
curl -X GET "http://localhost:3000/api/discs/master?brand=Innova&speed=9-11&model=bird&limit=20&offset=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Pending Discs (Admin Only)
```bash
curl -X GET "http://localhost:3000/api/discs/master?approved=false" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Use Cases
- **Disc Discovery**: Browse available discs by flight characteristics
- **Flight Number Search**: Find discs with specific speed, glide, turn, fade
- **Brand/Model Search**: Find specific disc models
- **Bag Building**: Search for discs to add to bags
- **Flight Characteristic Analysis**: Compare discs by flight numbers

## Performance Considerations
- **Indexed Queries**: Brand, model, and flight numbers are indexed
- **Approved Filter**: Significantly reduces query scope for normal users
- **Pagination**: Prevents large result sets

## Related Endpoints
- **[POST /api/discs/master](./POST_discs_master.md)** - Add new disc to master database
- **[GET /api/discs/pending](./GET_discs_pending.md)** - List pending discs (admin only)
- **[PATCH /api/discs/:id/approve](./PATCH_discs_id_approve.md)** - Approve pending disc (admin only)
- **[POST /api/bags/:id/discs](../bags/POST_bags_id_discs.md)** - Add disc to bag