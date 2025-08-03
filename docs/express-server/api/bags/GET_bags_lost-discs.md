# GET /api/bags/lost-discs

## Overview
Retrieves a paginated list of the authenticated user's lost discs across all bags. Supports sorting and pagination for managing large collections of lost discs.

## Endpoint
```
GET /api/bags/lost-discs
```

## Authentication
**Required**: Bearer token in Authorization header.

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 30 | Number of results to return (pagination) |
| `offset` | integer | No | 0 | Number of results to skip (pagination) |
| `sort` | string | No | "lost_at" | Field to sort by |
| `order` | string | No | "desc" | Sort order: "asc" or "desc" |

### Sort Options
| Field | Description |
|-------|-------------|
| `lost_at` | When disc was marked as lost |
| `added_at` | When disc was originally added to bag |
| `updated_at` | Last modification timestamp |
| `brand` | Disc brand name |
| `model` | Disc model name |

## Response

### Success (200 OK)
```json
{
  "success": true,
  "lost_discs": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "user_id": 123,
      "bag_id": null,
      "disc_id": "770e8400-e29b-41d4-a716-446655440000",
      "color": "Orange",
      "weight": "175.0",
      "condition": "Used",
      "is_lost": true,
      "lost_at": "2024-01-15T10:30:00.000Z",
      "lost_notes": "Lost at Zilker Park, hole 7",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "speed": 9,
      "glide": 5,
      "turn": -1,
      "fade": 2,
      "brand": "Innova",
      "model": "Thunderbird",
      "disc_master": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "speed": 9,
        "glide": 5,
        "turn": -1,
        "fade": 2,
        "brand": "Innova",
        "model": "Thunderbird",
        "approved": true
      }
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 30,
    "offset": 0,
    "has_more": false
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "error": "ValidationError",
  "message": "Invalid sort field"
}
```

**Possible validation messages:**
- "userId is required"
- "Invalid sort field"
- "Invalid sort order"

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
| `lost_discs` | array | Array of lost disc objects |
| `pagination` | object | Pagination metadata |

### Lost Disc Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique bag content identifier |
| `user_id` | integer | Owner's user ID |
| `bag_id` | null | Always null for lost discs (removed from bags) |
| `disc_id` | string (UUID) | Reference to master disc database |
| `color` | string | Disc color |
| `weight` | string | Disc weight in grams |
| `condition` | string | Disc condition |
| `is_lost` | boolean | Always true for this endpoint |
| `lost_at` | string (ISO 8601) | When disc was marked as lost |
| `lost_notes` | string | User notes about where/how disc was lost |
| `created_at` | string (ISO 8601) | When disc was originally added |
| `updated_at` | string (ISO 8601) | Last modification timestamp |
| `speed` | integer | Custom or master disc speed |
| `glide` | integer | Custom or master disc glide |
| `turn` | integer | Custom or master disc turn |
| `fade` | integer | Custom or master disc fade |
| `brand` | string | Custom or master disc brand |
| `model` | string | Custom or master disc model |
| `disc_master` | object | Original master disc data |

## Related Endpoints
- **[PATCH /api/bags/discs/:contentId/lost](./PATCH_bags_discs_contentId_lost.md)** - Mark disc as lost/found
- **[GET /api/bags](./GET_bags.md)** - List current bags (non-lost discs)
- **[GET /api/bags/:id](./GET_bags_id.md)** - View specific bag contents
- **[POST /api/bags/:id/discs](./POST_bags_id_discs.md)** - Add replacement discs to bags