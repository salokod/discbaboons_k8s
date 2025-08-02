# POST /api/rounds/:id/complete

Complete a round that is currently in progress.

## Route
`POST /api/rounds/:id/complete`

## Authentication
Requires valid authentication token in request headers.

## Parameters

### Path Parameters
- `id` (string, required): UUID of the round to complete

## Request Body
No request body required.

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "round": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "completed_at": "2025-01-01T12:00:00.000Z",
    "name": "Weekend Round",
    "course_id": "course-123",
    "starting_hole": 1,
    "created_by": 1,
    "created_at": "2025-01-01T10:00:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request
**Invalid UUID format:**
```json
{
  "success": false,
  "message": "Round ID must be a valid UUID"
}
```

**Round not in progress:**
```json
{
  "success": false,
  "message": "Round must be in progress to be completed"
}
```

**Incomplete scoring:**
```json
{
  "success": false,
  "message": "All players must complete scoring before the round can be completed"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
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

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Usage Notes

- Only participants in the round can complete it
- All players must have submitted scores for all holes before completion
- Once completed, the round status changes from "in_progress" to "completed"
- The completion timestamp is automatically set to the current time
- Round completion is reversible (can be reopened later via PUT /api/rounds/:id)

## Example Usage

```bash
curl -X POST "https://api.discbaboons.com/api/rounds/550e8400-e29b-41d4-a716-446655440000/complete" \
  -H "Authorization: Bearer your_auth_token"
```

## Rate Limiting
This endpoint uses the `roundsUpdateRateLimit` middleware which allows:
- 30 requests per 15 minutes per IP address