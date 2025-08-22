# PATCH /api/bags/discs/bulk-mark-lost

## Overview
Marks multiple discs as lost in a single operation, efficiently handling bulk operations for scenarios like losing an entire bag at a tournament. Each disc is removed from its current bag and tracked separately as lost inventory.

## Endpoint
```
PATCH /api/bags/discs/bulk-mark-lost
```

## Authentication
**Required**: Bearer token in Authorization header.

## Request Body

### Mark Multiple Discs as Lost
```json
{
  "content_ids": [
    "660e8400-e29b-41d4-a716-446655440001",
    "660e8400-e29b-41d4-a716-446655440002", 
    "660e8400-e29b-41d4-a716-446655440003"
  ],
  "lost_notes": "Lost entire bag at tournament - hole 7 water hazard"
}
```

### Minimal Request (Notes Optional)
```json
{
  "content_ids": [
    "660e8400-e29b-41d4-a716-446655440001",
    "660e8400-e29b-41d4-a716-446655440002"
  ]
}
```

## Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content_ids` | array of string (UUID) | Yes | Array of bag content IDs to mark as lost |
| `lost_notes` | string | No | Notes about where/how discs were lost (applied to all discs) |

### Validation Rules
- `content_ids` must be a non-empty array
- Each `content_id` must be a valid UUID format
- `lost_notes` can be null or omitted
- Maximum of 50 content IDs per request (rate limited)

## Response

### Success (200 OK)

#### All Discs Updated Successfully
```json
{
  "success": true,
  "updated_count": 3,
  "failed_ids": []
}
```

#### Partial Success (Some Discs Not Owned)
```json
{
  "success": true,
  "updated_count": 2,
  "failed_ids": ["660e8400-e29b-41d4-a716-446655440003"]
}
```

### Error Responses

#### 400 Bad Request - No Valid Discs Found
```json
{
  "success": false,
  "message": "No valid discs found for the provided content IDs",
  "updated_count": 0,
  "failed_ids": [
    "660e8400-e29b-41d4-a716-446655440001",
    "660e8400-e29b-41d4-a716-446655440002"
  ]
}
```

#### 400 Bad Request - Validation Errors
```json
{
  "success": false,
  "message": "content_ids is required and must be a non-empty array"
}
```

**Possible validation messages:**
- "content_ids is required and must be a non-empty array"
- "content_ids must contain valid UUIDs"
- "Maximum 50 content IDs allowed per request"

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

## Response Fields

### Success Response
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always true for successful responses |
| `updated_count` | integer | Number of discs successfully marked as lost |
| `failed_ids` | array of string (UUID) | Content IDs that failed to update (not owned by user or not found) |

### Error Response
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always false for error responses |
| `message` | string | Human-readable error description |
| `updated_count` | integer | Number of discs successfully updated (0 for complete failures) |
| `failed_ids` | array of string (UUID) | Content IDs that failed to update |

## Behavior Notes

### Processing Logic
- Each disc is processed individually for atomic updates
- Discs not owned by the authenticated user are silently skipped
- Non-existent content IDs are added to `failed_ids`
- Already lost discs are updated with new `lost_notes` and `lost_at` timestamp

### For Each Successfully Updated Disc
- Disc is removed from its current bag (`bag_id` becomes null)
- `lost_at` timestamp is set to current time
- `lost_notes` is set to provided value (or null if not provided)
- `is_lost` flag is set to true
- Disc becomes searchable via the lost discs endpoint

### Performance Considerations
- Operation is performed in a single database transaction
- Rate limited to prevent abuse (bulk operations limit)
- Optimized for batch processing with minimal database round trips

### Security
- Users can only modify their own disc content
- Ownership validation is performed at the database level
- Invalid or unauthorized content IDs are silently ignored (not exposed)

## Usage Examples

### Mark Tournament Loss with Notes
```bash
curl -X PATCH https://discbaboons.spirojohn.com/api/bags/discs/bulk-mark-lost \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content_ids": [
      "660e8400-e29b-41d4-a716-446655440001",
      "660e8400-e29b-41d4-a716-446655440002",
      "660e8400-e29b-41d4-a716-446655440003"
    ],
    "lost_notes": "Lost entire bag at Zilker tournament - left at hole 18"
  }'
```

### Quick Mark Without Notes
```bash
curl -X PATCH https://discbaboons.spirojohn.com/api/bags/discs/bulk-mark-lost \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content_ids": ["660e8400-e29b-41d4-a716-446655440001"]
  }'
```

### JavaScript Example
```javascript
const response = await fetch('/api/bags/discs/bulk-mark-lost', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content_ids: lostDiscIds,
    lost_notes: 'Lost during tournament round'
  })
});

const result = await response.json();
console.log(`Successfully marked ${result.updated_count} discs as lost`);
if (result.failed_ids.length > 0) {
  console.log(`Failed to mark ${result.failed_ids.length} discs`);
}
```

## Related Endpoints
- **[PATCH /api/bags/discs/:contentId/lost](./PATCH_bags_discs_contentId_lost.md)** - Mark single disc as lost/found
- **[GET /api/bags/lost-discs](./GET_bags_lost-discs.md)** - List user's lost discs
- **[GET /api/bags](./GET_bags.md)** - List current bags (non-lost discs)
- **[PUT /api/bags/discs/move](./PUT_bags_discs_move.md)** - Move multiple discs between bags