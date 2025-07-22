# PUT /api/rounds/:id

Update an existing round's details.

## Endpoint
```
PUT /api/rounds/:id
```

## Authentication
- **Required**: Yes (Bearer token)
- **Permission**: User must be a participant in the round (creator or existing player)

## Parameters

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | The round ID |

### Request Body
| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `name` | string | No | Round name | Must be a string |
| `status` | string | No | Round status | One of: `in_progress`, `completed`, `cancelled` |
| `starting_hole` | integer | No | Starting hole number | Must be positive integer |
| `is_private` | boolean | No | Round privacy setting | Must be boolean |
| `skins_enabled` | boolean | No | Enable skins game | Must be boolean |
| `skins_value` | number/string | No | Skins value per hole | Must be valid decimal ≥ 0 |

**Note:** Only provided fields will be updated. All fields are optional in the request body, but at least one field must be provided.

## Request Examples

### Update round name and status
```json
{
  "name": "Morning Round at Sunset Park",
  "status": "completed"
}
```

### Update skins settings
```json
{
  "skins_enabled": true,
  "skins_value": 5.50
}
```

### Update privacy and starting hole
```json
{
  "is_private": true,
  "starting_hole": 3
}
```

## Response Examples

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "created_by_id": 42,
    "course_id": "sunset-park-disc-golf-course",
    "name": "Morning Round at Sunset Park",
    "start_time": "2024-01-15T10:30:00.000Z",
    "starting_hole": 3,
    "is_private": true,
    "skins_enabled": true,
    "skins_value": "5.50",
    "status": "completed",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:45:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request - Invalid UUID
```json
{
  "success": false,
  "message": "Round ID must be a valid UUID"
}
```

### 400 Bad Request - Empty Update Data
```json
{
  "success": false,
  "message": "Update data cannot be empty"
}
```

### 400 Bad Request - Invalid Field Type
```json
{
  "success": false,
  "message": "Name must be a string"
}
```

### 400 Bad Request - Invalid Status
```json
{
  "success": false,
  "message": "Status must be one of: in_progress, completed, cancelled"
}
```

### 400 Bad Request - Invalid Starting Hole
```json
{
  "success": false,
  "message": "Starting hole must be a positive integer"
}
```

### 400 Bad Request - Invalid Skins Value
```json
{
  "success": false,
  "message": "Skins value must be a valid decimal number"
}
```

### 400 Bad Request - Invalid Fields
```json
{
  "success": false,
  "message": "Invalid update fields: invalid_field, another_invalid_field"
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden - Not a Participant
```json
{
  "success": false,
  "message": "Permission denied: You are not a participant in this round"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Round not found"
}
```

## Business Rules

### Permissions
- Only round participants can update round details
- A user is considered a participant if they are either:
  - The round creator (created_by_id)
  - Listed as a player in the round_players table

### Field Validation
- **name**: Must be a string if provided
- **status**: Must be one of the allowed enum values
- **starting_hole**: Must be a positive integer
- **is_private**: Must be a boolean value
- **skins_enabled**: Must be a boolean value
- **skins_value**: Must be a valid decimal number ≥ 0

### Update Behavior
- Only fields included in the request body are updated
- Fields not provided remain unchanged
- All updates are atomic (all succeed or all fail)
- The `updated_at` timestamp is automatically set to the current time

## Implementation Notes

### Allowed Fields
The following fields can be updated via this endpoint:
- `name`
- `status`
- `starting_hole`
- `is_private`
- `skins_enabled`
- `skins_value`

Any other fields in the request body will result in a 400 error.

### Database Operations
1. Validates round exists
2. Validates user is a participant
3. Validates all provided fields
4. Builds dynamic UPDATE query with only provided fields
5. Returns updated round data

### Security Considerations
- UUID format validation prevents injection attacks
- Permission checking ensures only participants can modify rounds
- Field validation prevents invalid data types
- Atomic updates prevent partial modifications on errors