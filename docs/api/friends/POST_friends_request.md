# POST /api/friends/request

## Overview
Sends a friend request to another user. Creates a pending friend request that the recipient can accept or decline.

## Endpoint
```
POST /api/friends/request
```

## Authentication
**Required**: Bearer token in Authorization header.

## Rate Limiting
- **Window**: 1 hour
- **Max Requests**: 10 per IP address
- **Purpose**: Prevent friend request spam
- **Headers**: Standard rate limit headers included in response

## Request Size Limit
- **Maximum**: 1KB
- **Applies to**: Request body and headers
- **Error**: Returns 413 Payload Too Large if exceeded

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipientId` | integer | Yes | User ID of the person to send the request to |

### Example Request
```json
{
  "recipientId": 456
}
```

## Response

### Success (200 OK)
```json
{
  "id": 123,
  "requester_id": 789,
  "recipient_id": 456,
  "status": "pending",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "error": "ValidationError",
  "message": "Recipient ID is required"
}
```

**Possible validation messages:**
- "Recipient ID is required"
- "Cannot send friend request to yourself"
- "Friend request already exists"

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
  "message": "Request payload too large. Maximum size is 1KB."
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many friend request attempts, please try again in 1 hour"
}
```

## Response Fields

### Friend Request Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique request identifier |
| `requester_id` | integer | User ID who sent the request |
| `recipient_id` | integer | User ID who received the request |
| `status` | string | Request status ("pending", "accepted", "denied") |
| `created_at` | string (ISO 8601) | Request creation timestamp |
| `updated_at` | string (ISO 8601) | Last modification timestamp |

## Service Implementation
**File:** `services/friends.request.service.js`

### Key Features
- **Duplicate Prevention**: Checks for existing requests in both directions
- **Self-Request Validation**: Prevents users from sending requests to themselves
- **Reverse Request Handling**: Detects if recipient already sent a request
- **Status Validation**: Only allows new requests if no active request exists

### Validation Logic
1. **Required Fields**: Validates requester and recipient IDs
2. **Self-Request Check**: Prevents `requesterId === recipientId`
3. **Existing Request Check**: Queries for existing request in same direction
4. **Reverse Request Check**: Queries for request in opposite direction
5. **Status Validation**: Only blocks non-denied reverse requests

### Database Operations
- Check existing: `SELECT id FROM friendship_requests WHERE requester_id = $1 AND recipient_id = $2`
- Check reverse: `SELECT id, status FROM friendship_requests WHERE requester_id = $2 AND recipient_id = $1`
- Create request: `INSERT INTO friendship_requests (requester_id, recipient_id, status) VALUES ($1, $2, 'pending')`

## Example Usage

### Send Friend Request
```bash
curl -X POST http://localhost:3000/api/friends/request \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipientId": 456}'
```

### Response
```json
{
  "id": 123,
  "requester_id": 789,
  "recipient_id": 456,
  "status": "pending",
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

## Business Rules

### Request Creation Rules
- **One Direction**: Only one request allowed between two users at a time
- **Self-Requests Blocked**: Users cannot send requests to themselves
- **Duplicate Prevention**: Cannot create duplicate requests
- **Reverse Handling**: Existing reverse requests prevent new requests (unless denied)

### Status Handling
- **New Requests**: Always created with "pending" status
- **Denied Requests**: Allow new requests in opposite direction
- **Pending/Accepted**: Block new requests in either direction

## Use Cases
- **Social Networking**: Connect with other disc golfers
- **Bag Sharing**: Access friends' bag contents
- **Community Building**: Build disc golf networks
- **Tournament Connections**: Connect with tournament participants

## Security Features
- **Authentication Required**: Must be logged in to send requests
- **User Validation**: Validates both requester and recipient IDs
- **Duplicate Prevention**: Prevents spam requests
- **Business Logic Enforcement**: Ensures data integrity

## Related Endpoints
- **[POST /api/friends/respond](./POST_friends_respond.md)** - Accept/decline friend requests
- **[GET /api/friends/requests](./GET_friends_requests.md)** - List pending requests
- **[GET /api/friends](./GET_friends.md)** - List accepted friends
- **[GET /api/profile/search](../profile/GET_profile_search.md)** - Find users to befriend