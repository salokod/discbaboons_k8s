# PUT /api/bags/:id

## Overview
Updates an existing bag's properties including name, description, and privacy settings. Only the bag owner can update their bags.

## Endpoint
```
PUT /api/bags/:id
```

## Authentication
**Required**: Bearer token in Authorization header.

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Unique identifier of the bag to update |

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Bag name |
| `description` | string | No | Bag description |
| `is_public` | boolean | No | Whether bag is visible to everyone |
| `is_friends_visible` | boolean | No | Whether bag is visible to friends |

### Example Request
```json
{
  "name": "Updated Tournament Bag",
  "description": "My championship bag with new additions",
  "is_public": false,
  "is_friends_visible": true
}
```

### Partial Update Example
```json
{
  "is_public": true
}
```

## Response

### Success (200 OK)
```json
{
  "success": true,
  "bag": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Tournament Bag",
    "description": "My championship bag with new additions",
    "user_id": 123,
    "is_public": false,
    "is_friends_visible": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "error": "ValidationError",
  "message": "updateData is required"
}
```

**Possible validation messages:**
- "userId is required"
- "bagId is required"
- "updateData is required"

#### 401 Unauthorized
```json
{
  "error": "UnauthorizedError",
  "message": "Access token required"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Bag not found"
}
```

## Response Fields

### Success Response
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always true for successful responses |
| `bag` | object | Updated bag object |

### Bag Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique bag identifier |
| `name` | string | Bag name |
| `description` | string | Bag description |
| `user_id` | integer | Owner's user ID |
| `is_public` | boolean | Whether bag is visible to everyone |
| `is_friends_visible` | boolean | Whether bag is visible to friends |
| `created_at` | string (ISO 8601) | Bag creation timestamp |
| `updated_at` | string (ISO 8601) | Last modification timestamp |

## Service Implementation
**File:** `services/bags.update.service.js`

### Key Features
- **Dynamic Updates**: Only updates provided fields
- **Owner Validation**: Ensures user owns the bag before updating
- **UUID Validation**: Validates bag ID format before database query
- **Atomic Updates**: Single database transaction for consistency

### Update Logic
1. **Input Validation**: Validates user ID, bag ID, and update data
2. **UUID Format Check**: Validates bag ID is proper UUID format
3. **Dynamic SET Clause**: Builds SQL update based on provided fields
4. **Owner Verification**: Updates only if user owns the bag
5. **Result Retrieval**: Returns updated bag data

### Database Operations
- Update with ownership check: `UPDATE bags SET [fields] WHERE id = $1 AND user_id = $2`
- Retrieve updated bag: `SELECT * FROM bags WHERE id = $1 AND user_id = $2`

## Example Usage

### Update Bag Name and Privacy
```bash
curl -X PUT http://localhost:3000/api/bags/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Championship Tournament Bag",
    "is_public": true
  }'
```

### Update Only Description
```bash
curl -X PUT http://localhost:3000/api/bags/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated for winter season play"
  }'
```

### Toggle Privacy Settings
```bash
curl -X PUT http://localhost:3000/api/bags/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "is_public": false,
    "is_friends_visible": true
  }'
```

## Privacy Settings

### Public Visibility (`is_public`)
- **true**: Bag visible to everyone (including non-users)
- **false**: Bag not publicly searchable or viewable

### Friend Visibility (`is_friends_visible`)
- **true**: Bag visible to accepted friends
- **false**: Bag only visible to owner

### Privacy Combinations
- **Fully Public**: `is_public: true` (friends setting irrelevant)
- **Friends Only**: `is_public: false, is_friends_visible: true`
- **Private**: `is_public: false, is_friends_visible: false`

## Field Validation

### Dynamic Field Updates
- **Flexible Updates**: Any combination of allowed fields can be updated
- **Partial Updates**: Update only the fields you want to change
- **Type Safety**: Database handles type validation for fields
- **Constraint Enforcement**: Database enforces any field constraints

### String Fields
- **name**: Bag display name
- **description**: Free-text bag description

### Boolean Fields
- **is_public**: Controls public visibility
- **is_friends_visible**: Controls friend visibility

## Use Cases
- **Bag Naming**: Update bag names for better organization
- **Privacy Management**: Control who can see your bags
- **Description Updates**: Add or modify bag descriptions
- **Seasonal Changes**: Update bags for different playing conditions
- **Tournament Preparation**: Modify bags for specific events

## Business Rules
- **Owner Only**: Users can only update their own bags
- **Partial Updates**: Any combination of fields can be updated
- **Privacy Control**: User has complete control over bag visibility
- **UUID Validation**: Bag ID must be valid UUID format

## Security Features
- **Authentication Required**: Bearer token validation
- **Owner Verification**: Can only update own bags
- **SQL Injection Protection**: Parameterized queries
- **UUID Validation**: Prevents invalid ID injection
- **User Isolation**: Strictly enforced ownership

## Related Endpoints
- **[GET /api/bags/:id](./GET_bags_id.md)** - Get bag details
- **[DELETE /api/bags/:id](./DELETE_bags_id.md)** - Delete bag
- **[GET /api/bags](./GET_bags.md)** - List user's bags
- **[POST /api/bags](./POST_bags.md)** - Create new bag
- **[GET /api/bags/friends/:friendUserId](./GET_bags_friends_friendUserId.md)** - View friend's bags (affected by privacy settings)