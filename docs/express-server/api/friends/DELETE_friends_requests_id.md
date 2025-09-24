# DELETE /api/friends/requests/:id

## Overview
Cancels a pending friend request that was sent by the authenticated user. Only the original requester can cancel their own pending friend requests.

## Endpoint
```
DELETE /api/friends/requests/:id
```

## Authentication
**Required**: Bearer token in Authorization header.

## Rate Limiting
- **Window**: 10 minutes
- **Max Requests**: 100 per IP address
- **Purpose**: Prevent excessive friend request cancellations
- **Headers**: Standard rate limit headers included in response

## Request Size Limit
- **Maximum**: 1KB
- **Applies to**: All request components (headers, URL params, etc.)
- **Error**: Returns 413 Payload Too Large if exceeded

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | integer | Yes | The friend request ID to cancel |

## Response

### Success (200 OK)
```json
{
  "success": true,
  "request": {
    "id": 123,
    "requester_id": 789,
    "recipient_id": 456,
    "status": "canceled",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "success": false,
  "message": "Invalid request ID"
}
```

**Possible validation messages:**
- "Invalid request ID"
- "Only pending requests can be canceled"

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

#### 403 Forbidden - Authorization Error
```json
{
  "success": false,
  "message": "You can only cancel your own friend requests"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Friend request not found"
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
  "message": "Too many friend request operations, please try again in 10 minutes"
}
```

## Response Fields

### Success Response
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always true for successful responses |
| `request` | object | The canceled friend request object |

### Canceled Request Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique request identifier |
| `requester_id` | integer | User ID who sent the request |
| `recipient_id` | integer | User ID who received the request |
| `status` | string | Always "canceled" after successful cancellation |
| `created_at` | string (ISO 8601) | Request creation timestamp |
| `updated_at` | string (ISO 8601) | Cancellation timestamp |

## Service Implementation
**File:** `services/friends.cancel.service.js`

### Key Features
- **Authorization Validation**: Only requesters can cancel their own requests
- **Status Validation**: Only pending requests can be canceled
- **Atomic Operation**: Uses database transactions for consistency
- **Status Update**: Changes request status from "pending" to "canceled"

### Database Query
```sql
UPDATE friendship_requests
SET status = 'canceled', updated_at = NOW()
WHERE id = $1 AND requester_id = $2 AND status = 'pending'
RETURNING *
```

## Example Usage

### Cancel a Friend Request
```bash
curl -X DELETE "http://localhost:3000/api/friends/requests/123" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Successful Response
```json
{
  "success": true,
  "request": {
    "id": 123,
    "requester_id": 789,
    "recipient_id": 456,
    "status": "canceled",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z"
  }
}
```

## Business Rules

### Authorization Rules
- **Requester Only**: Only the user who sent the request can cancel it
- **No Canceling Others**: Users cannot cancel requests sent to them
- **Token Required**: Must be authenticated to access endpoint

### Status Rules
- **Pending Only**: Only pending requests can be canceled
- **No Reversal**: Canceled requests cannot be un-canceled
- **Final State**: Canceled status is permanent
- **No Notification**: Recipients are not notified of cancellations

### Use Cases
- **Change of Mind**: User decides not to send friend request
- **Accidental Request**: User sent request by mistake
- **Privacy Concerns**: User wants to withdraw networking attempt
- **Request Management**: Clean up pending outgoing requests

## Performance Considerations
- **Single Query**: Efficient single UPDATE with WHERE conditions
- **Index Usage**: Uses primary key and foreign key indexes
- **Minimal Data**: Returns only essential request information
- **Status Filter**: WHERE clause prevents unnecessary operations

## Related Endpoints
- **[GET /api/friends/requests](./GET_friends_requests.md)** - List pending friend requests
- **[POST /api/friends/request](./POST_friends_request.md)** - Send new friend requests
- **[POST /api/friends/respond](./POST_friends_respond.md)** - Accept/decline requests
- **[GET /api/friends](./GET_friends.md)** - List accepted friends