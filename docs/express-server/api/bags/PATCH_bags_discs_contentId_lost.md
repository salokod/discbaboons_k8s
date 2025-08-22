# PATCH /api/bags/discs/:contentId/lost

## Overview
Marks a disc as lost or found, managing the disc's status within the user's collection. When marked as lost, the disc is removed from its bag and can be tracked separately. When marked as found, it can optionally be returned to a specific bag.

## Endpoint
```
PATCH /api/bags/discs/:contentId/lost
```

## Authentication
**Required**: Bearer token in Authorization header.

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `contentId` | string (UUID) | Yes | Unique identifier of the bag content to update |

## Request Body

### Mark Disc as Lost
```json
{
  "is_lost": true,
  "lost_notes": "Lost at Zilker Park, hole 7"
}
```

### Mark Disc as Found
```json
{
  "is_lost": false,
  "bag_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `is_lost` | boolean | Yes | Whether disc is lost (true) or found (false) |
| `lost_notes` | string | No | Notes about where/how disc was lost (only when marking as lost) |
| `bag_id` | string (UUID) | Conditional | Required when marking disc as found to specify which bag to return it to |

## Response

### Success (200 OK)

#### Disc Marked as Lost
```json
{
  "success": true,
  "bag_content": {
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
    "model": "Thunderbird"
  }
}
```

#### Disc Marked as Found
```json
{
  "success": true,
  "bag_content": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "user_id": 123,
    "bag_id": "550e8400-e29b-41d4-a716-446655440000",
    "disc_id": "770e8400-e29b-41d4-a716-446655440000",
    "color": "Orange",
    "weight": "175.0",
    "condition": "Used",
    "is_lost": false,
    "lost_at": null,
    "lost_notes": null,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z",
    "speed": 9,
    "glide": 5,
    "turn": -1,
    "fade": 2,
    "brand": "Innova",
    "model": "Thunderbird"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "success": false,
  "message": "is_lost is required"
}
```

**Possible validation messages:**
- "is_lost is required"
- "is_lost must be a boolean"
- "bag_id is required when marking disc as found"
- "Invalid bag_id format"

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Bag content not found or access denied"
}
```

## Response Fields

### Success Response
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always true for successful responses |
| `bag_content` | object | Updated bag content object |

### Bag Content Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique bag content identifier |
| `user_id` | integer | Owner's user ID |
| `bag_id` | string (UUID) or null | Bag containing the disc (null when lost) |
| `disc_id` | string (UUID) | Reference to master disc database |
| `color` | string | Disc color |
| `weight` | string | Disc weight in grams |
| `condition` | string | Disc condition |
| `is_lost` | boolean | Whether disc is marked as lost |
| `lost_at` | string (ISO 8601) or null | When disc was marked as lost |
| `lost_notes` | string or null | User notes about where/how disc was lost |
| `created_at` | string (ISO 8601) | When disc was originally added |
| `updated_at` | string (ISO 8601) | Last modification timestamp |
| `speed` | integer | Custom or master disc speed |
| `glide` | integer | Custom or master disc glide |
| `turn` | integer | Custom or master disc turn |
| `fade` | integer | Custom or master disc fade |
| `brand` | string | Custom or master disc brand |
| `model` | string | Custom or master disc model |

## Behavior Notes

### When Marking as Lost
- Disc is removed from its current bag (`bag_id` becomes null)
- `lost_at` timestamp is set to current time
- `lost_notes` can be provided for tracking purposes
- Disc becomes searchable via the lost discs endpoint

### When Marking as Found
- Disc must be returned to a specific bag via `bag_id` parameter
- `lost_at` and `lost_notes` are cleared (set to null)
- Disc is removed from lost disc listings
- `updated_at` timestamp is updated

### Security
- Users can only modify their own disc content
- Ownership validation is performed at the database level
- Invalid contentId or unauthorized access returns 404

## Related Endpoints
- **[GET /api/bags/lost-discs](./GET_bags_lost-discs.md)** - List user's lost discs
- **[GET /api/bags](./GET_bags.md)** - List current bags (non-lost discs)
- **[GET /api/bags/:id](./GET_bags_id.md)** - View specific bag contents
- **[POST /api/bags/:id/discs](./POST_bags_id_discs.md)** - Add replacement discs to bags