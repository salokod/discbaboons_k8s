# POST /api/rounds

Create a new round for disc golf.

## Authentication Required
This endpoint requires authentication via Bearer token.

## Rate Limiting
- **Window**: 1 hour
- **Max Requests**: 10 per IP address
- **Purpose**: Prevent round creation spam
- **Headers**: Standard rate limit headers included in response

## Request Size Limit
- **Maximum**: 50KB
- **Applies to**: Request body
- **Error**: Returns 413 Payload Too Large if exceeded

## Request

### HTTP Method
`POST`

### URL
`/api/rounds`

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body
```json
{
  "courseId": "string (required)",
  "name": "string (required)",
  "startingHole": "integer (optional, default: 1)",
  "isPrivate": "boolean (optional, default: false)",
  "skinsEnabled": "boolean (optional, default: false)",
  "skinsValue": "number (optional, decimal with 2 places)"
}
```

#### Field Descriptions
- **courseId** (required): Valid course ID that exists in the database
- **name** (required): Name/description for the round
- **startingHole** (optional): Which hole to start on (must be between 1 and course hole count)
- **isPrivate** (optional): Whether the round is private (friend/invite only)
- **skinsEnabled** (optional): Whether skins betting is enabled for this round
- **skinsValue** (optional): Dollar amount per hole for skins game (required if skinsEnabled is true)

## Response

### Success Response (201 Created)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_by_id": 123,
  "course_id": "adventist-discovery-park-sacramento-ca-us",
  "name": "Sunday Morning Round",
  "start_time": "2025-01-20T14:30:00.000Z",
  "starting_hole": 1,
  "is_private": false,
  "skins_enabled": true,
  "skins_value": "5.00",
  "status": "in_progress",
  "created_at": "2025-01-20T14:30:00.000Z",
  "updated_at": "2025-01-20T14:30:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "success": false,
  "message": "Course ID is required"
}
```

```json
{
  "success": false,
  "message": "Round name is required"
}
```

```json
{
  "success": false,
  "message": "Course not found"
}
```

```json
{
  "success": false,
  "message": "Starting hole cannot exceed course hole count"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

#### 413 Payload Too Large
```json
{
  "success": false,
  "message": "Request payload too large. Maximum size is 50KB."
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many round creation requests, please try again in 1 hour"
}
```

## Business Rules

### Round Creation
- **Immediate Start**: Rounds start immediately at creation time (no future scheduling)
- **Course Validation**: Course must exist and be accessible to the user
- **Starting Hole**: Must be between 1 and the course's total hole count
- **Skins Game**: If enabled, skins value is required and must be positive

### Round Status
- All new rounds start with status `"in_progress"`
- Possible statuses: `"in_progress"`, `"completed"`, `"cancelled"`

### Privacy
- Private rounds are friend/invite only (no public discovery)
- Non-private rounds are still friend-based, not publicly discoverable

## Example Requests

### Basic Round Creation
```bash
curl -X POST "https://api.discbaboons.com/api/rounds" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "adventist-discovery-park-sacramento-ca-us",
    "name": "Sunday Morning Round"
  }'
```

### Round with Skins Game
```bash
curl -X POST "https://api.discbaboons.com/api/rounds" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "adventist-discovery-park-sacramento-ca-us",
    "name": "Skins Game Round",
    "startingHole": 3,
    "skinsEnabled": true,
    "skinsValue": 5.00,
    "isPrivate": true
  }'
```

### Private Round
```bash
curl -X POST "https://api.discbaboons.com/api/rounds" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "pinto-lake-park-watsonville-ca-us",
    "name": "Friends Only Round",
    "isPrivate": true
  }'
```

## Implementation Notes

- Round creator is automatically set from the authenticated user
- Start time is set to current timestamp (no future scheduling)
- Course validation includes checking user access permissions
- Starting hole validation is done against the actual course hole count
- Skins value is stored as DECIMAL(10,2) for precise monetary calculations