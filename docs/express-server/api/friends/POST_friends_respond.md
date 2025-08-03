# POST /api/friends/respond

## Overview
Responds to a pending friend request by accepting or declining it. Only the request recipient can respond to their incoming requests.

## Endpoint
```
POST /api/friends/respond
```

## Authentication
**Required**: Bearer token in Authorization header.

## Rate Limiting
- **Window**: 1 hour
- **Max Requests**: 50 per IP address
- **Purpose**: Allow generous responding while preventing abuse
- **Headers**: Standard rate limit headers included in response

## Request Size Limit
- **Maximum**: 1KB
- **Applies to**: Request body and headers
- **Error**: Returns 413 Payload Too Large if exceeded

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requestId` | integer | Yes | ID of the friend request to respond to |
| `action` | string | Yes | Response action: "accept" or "deny" |

### Example Request
```json
{
  "requestId": 123,
  "action": "accept"
}
```

## Response

### Success (200 OK)
```json
{
  "success": true,
  "request": {
    "id": 123,
    "requester_id": 789,
    "recipient_id": 456,
    "status": "accepted",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "error": "ValidationError",
  "message": "Action must be \"accept\" or \"deny\""
}
```

**Possible validation messages:**
- "Request ID is required"
- "User ID is required"
- "Action must be \"accept\" or \"deny\""
- "Request is not pending"

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
  "message": "Too many friend response attempts, please try again in 1 hour"
}
```

#### 403 Forbidden
```json
{
  "error": "AuthorizationError",
  "message": "Not authorized to respond to this request"
}
```

#### 404 Not Found
```json
{
  "error": "NotFoundError",
  "message": "Friend request not found"
}
```

## Response Fields

### Success Response
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always true for successful responses |
| `request` | object | Updated friend request object |

### Friend Request Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique request identifier |
| `requester_id` | integer | User ID who sent the request |
| `recipient_id` | integer | User ID who received the request |
| `status` | string | Updated status ("accepted" or "denied") |
| `created_at` | string (ISO 8601) | Request creation timestamp |
| `updated_at` | string (ISO 8601) | Response timestamp |

## Service Implementation
**File:** `services/friends.respond.service.js`

### Key Features
- **Authorization Validation**: Only recipients can respond to their requests
- **Status Validation**: Only allows responses to pending requests
- **Action Validation**: Strictly validates "accept" or "deny" actions
- **Request Existence Check**: Validates request exists before processing

### Validation Logic
1. **Required Fields**: Validates request ID, user ID, and action
2. **Action Validation**: Ensures action is exactly "accept" or "deny"
3. **Request Lookup**: Verifies request exists and gets current status
4. **Authorization Check**: Confirms user is the request recipient
5. **Status Check**: Ensures request is still pending

### Database Operations
- Find request: `SELECT id, recipient_id, status FROM friendship_requests WHERE id = $1`
- Update status: `UPDATE friendship_requests SET status = $1 WHERE id = $2 RETURNING *`

## Example Usage

### Accept Friend Request
```bash
curl -X POST http://localhost:3000/api/friends/respond \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requestId": 123, "action": "accept"}'
```

### Decline Friend Request
```bash
curl -X POST http://localhost:3000/api/friends/respond \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"requestId": 123, "action": "deny"}'
```

### Response (Accept)
```json
{
  "success": true,
  "request": {
    "id": 123,
    "requester_id": 789,
    "recipient_id": 456,
    "status": "accepted",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z"
  }
}
```

## Action Types

### Accept ("accept")
- **Status Change**: pending → accepted
- **Effect**: Creates active friendship between users
- **Access**: Users can now view each other's friend-visible bags
- **Reversible**: No direct way to "unfriend" (would need new feature)

### Deny ("deny")
- **Status Change**: pending → denied
- **Effect**: Rejects the friendship
- **Access**: No special permissions granted
- **Future Requests**: Requester can send new request later

## Business Rules

### Authorization Rules
- **Recipient Only**: Only the request recipient can respond
- **One Response**: Each request can only be responded to once
- **Pending Only**: Can only respond to pending requests
- **Self-Validation**: System validates user is the intended recipient

### Status Transitions
```
pending → accepted (via "accept" action)
pending → denied (via "deny" action)
accepted → [no transitions] (final state)
denied → [no transitions] (final state)
```

## Use Cases
- **Accept Friendships**: Build disc golf social networks
- **Manage Privacy**: Control who can see friend-visible bags
- **Filter Requests**: Decline unwanted friend requests
- **Social Management**: Curate friend lists

## Security Features
- **Authentication Required**: Must be logged in to respond
- **Authorization Enforcement**: Only recipients can respond to their requests
- **Request Validation**: Validates request exists and is actionable
- **Action Validation**: Strictly controls allowed actions

## Related Endpoints
- **[POST /api/friends/request](./POST_friends_request.md)** - Send friend requests
- **[GET /api/friends/requests](./GET_friends_requests.md)** - List pending requests
- **[GET /api/friends](./GET_friends.md)** - List accepted friends
- **[GET /api/bags/friends/:friendUserId](../bags/GET_bags_friends_friendUserId.md)** - Access friend's bags