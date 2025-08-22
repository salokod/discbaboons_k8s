# PUT /api/bags/discs/bulk-recover

Recover multiple lost discs back to a specific bag in a single operation.

## Description

This endpoint allows users to recover multiple previously lost discs and assign them to a specific bag they own. Only discs that are currently marked as lost (`is_lost = true`) and owned by the authenticated user can be recovered.

## Authentication

Requires Bearer token authentication.

## Rate Limiting

- **Endpoint**: Uses `bagsBulkRateLimit` middleware
- **Request Size Limit**: Uses `bagsRequestLimit` middleware (1MB)

## Request

### Method
`PUT`

### URL
```
/api/bags/discs/bulk-recover
```

### Headers
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### Request Body
```json
{
  "content_ids": ["uuid1", "uuid2", "uuid3"],
  "bag_id": "target-bag-uuid"
}
```

#### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `content_ids` | array[string] | Yes | Array of bag content UUIDs to recover. Must contain only lost discs owned by the user. |
| `bag_id` | string | Yes | UUID of the target bag where discs should be recovered to. Must be owned by the authenticated user. |

## Response

### Success Response (200)

```json
{
  "success": true,
  "updated_count": 2,
  "failed_ids": []
}
```

#### Success Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful operations |
| `updated_count` | number | Number of discs successfully recovered |
| `failed_ids` | array[string] | Array of content IDs that could not be recovered |

### Partial Success Response (200)

When some discs cannot be recovered (e.g., not lost, not owned by user):

```json
{
  "success": true,
  "updated_count": 1,
  "failed_ids": ["uuid2", "uuid3"]
}
```

### Error Responses

#### 400 - Bad Request

**No valid lost discs found:**
```json
{
  "success": false,
  "message": "No valid lost discs found for the provided content IDs",
  "updated_count": 0,
  "failed_ids": ["uuid1", "uuid2"]
}
```

**Target bag not found or not owned:**
```json
{
  "success": false,
  "message": "Target bag not found or not owned by user",
  "updated_count": 0,
  "failed_ids": ["uuid1", "uuid2"]
}
```

**Validation errors:**
```json
{
  "success": false,
  "message": "content_ids is required"
}
```

#### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

#### 429 - Rate Limited
```json
{
  "success": false,
  "message": "Too many requests"
}
```

## Business Logic

1. **Input Validation**: Validates that `content_ids` is a non-empty array and `bag_id` is provided
2. **Lost Disc Query**: Searches for bag contents that:
   - Have IDs in the provided `content_ids` array
   - Are owned by the authenticated user (`user_id` matches)
   - Are currently marked as lost (`is_lost = true`)
3. **Target Bag Validation**: Verifies the target bag:
   - Exists in the database
   - Is owned by the authenticated user
4. **Bulk Recovery**: For valid lost discs:
   - Sets `is_lost = false`
   - Assigns `bag_id = target_bag_id`
   - Clears `lost_notes = NULL`
   - Clears `lost_at = NULL`
   - Updates `updated_at` to current timestamp

## Database Changes

The operation updates the `bag_contents` table:

```sql
UPDATE bag_contents 
SET is_lost = false, 
    bag_id = $target_bag_id, 
    lost_notes = NULL, 
    lost_at = NULL, 
    updated_at = NOW()
WHERE id = ANY($valid_content_ids) 
  AND user_id = $user_id
```

## Example Usage

### Recover 3 lost discs to a bag

**Request:**
```bash
curl -X PUT http://localhost:3000/api/bags/discs/bulk-recover \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "content_ids": [
      "123e4567-e89b-12d3-a456-426614174000",
      "123e4567-e89b-12d3-a456-426614174001", 
      "123e4567-e89b-12d3-a456-426614174002"
    ],
    "bag_id": "987fcdeb-51a2-43d7-9f23-123456789abc"
  }'
```

**Response:**
```json
{
  "success": true,
  "updated_count": 3,
  "failed_ids": []
}
```

## Error Handling

- **Invalid UUIDs**: Non-UUID content IDs are ignored (included in `failed_ids`)
- **Non-existent discs**: Content IDs that don't exist are included in `failed_ids`
- **Already recovered discs**: Discs that are not lost are included in `failed_ids`
- **Permission denied**: Discs not owned by the user are included in `failed_ids`
- **Target bag validation**: Returns error response if target bag doesn't exist or isn't owned by user

## Related Endpoints

- [PATCH /api/bags/discs/bulk-mark-lost](./PATCH_bags_discs_bulk-mark-lost.md) - Mark multiple discs as lost
- [PATCH /api/bags/discs/:contentId/lost](./PATCH_bags_discs_contentId_lost.md) - Mark single disc as lost/found
- [GET /api/bags/lost-discs](./GET_bags_lost-discs.md) - List user's lost discs
- [PUT /api/bags/discs/move](./PUT_bags_discs_move.md) - Move discs between bags

## Notes

- This operation is transactional - either all valid discs are recovered or none are
- Discs that are already in bags (not lost) will be included in `failed_ids`
- The endpoint is optimized for bulk operations and uses a single database query for the recovery
- Rate limiting prevents abuse of this bulk operation