# GET /api/friends/requests

## Overview
Retrieves pending friend requests for the authenticated user. Supports filtering by request direction (incoming, outgoing, or all).

## Endpoint
```
GET /api/friends/requests
```

## Authentication
**Required**: Bearer token in Authorization header.

## Rate Limiting
- **Window**: 10 minutes
- **Max Requests**: 100 per IP address
- **Purpose**: Prevent excessive friends request checking
- **Headers**: Standard rate limit headers included in response

## Request Size Limit
- **Maximum**: 1KB
- **Applies to**: All request components (headers, query params, etc.)
- **Error**: Returns 413 Payload Too Large if exceeded

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Request type filter: "incoming", "outgoing", or "all" |

### Request Types
- **incoming**: Requests sent TO the current user (they can respond to these)
- **outgoing**: Requests sent BY the current user (waiting for response)
- **all**: Both incoming and outgoing requests

## Response

### Success (200 OK)

#### Incoming Requests (type=incoming)
```json
{
  "success": true,
  "requests": [
    {
      "id": 123,
      "requester_id": 789,
      "recipient_id": 456,
      "status": "pending",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "requester": {
        "id": 789,
        "username": "sender_user",
        "email": "sender@example.com"
      }
    }
  ]
}
```

#### Outgoing Requests (type=outgoing)
```json
{
  "success": true,
  "requests": [
    {
      "id": 124,
      "requester_id": 456,
      "recipient_id": 321,
      "status": "pending",
      "created_at": "2024-01-14T09:15:00.000Z",
      "updated_at": "2024-01-14T09:15:00.000Z",
      "recipient": {
        "id": 321,
        "username": "target_user",
        "email": "target@example.com"
      }
    }
  ]
}
```

#### All Requests (type=all)
```json
{
  "success": true,
  "requests": [
    {
      "id": 123,
      "requester_id": 789,
      "recipient_id": 456,
      "status": "pending",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "requester": {
        "id": 789,
        "username": "sender_user",
        "email": "sender@example.com"
      }
    },
    {
      "id": 124,
      "requester_id": 456,
      "recipient_id": 321,
      "status": "pending",
      "created_at": "2024-01-14T09:15:00.000Z",
      "updated_at": "2024-01-14T09:15:00.000Z",
      "recipient": {
        "id": 321,
        "username": "target_user",
        "email": "target@example.com"
      }
    }
  ]
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "error": "ValidationError",
  "message": "Type must be \"incoming\", \"outgoing\", or \"all\""
}
```

**Possible validation messages:**
- "User ID is required"
- "Type is required"
- "Type must be \"incoming\", \"outgoing\", or \"all\""

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
  "message": "Too many friends request checks, please try again in 10 minutes"
}
```

## Response Fields

### Success Response
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always true for successful responses |
| `requests` | array | Array of friend request objects |

### Friend Request Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique request identifier |
| `requester_id` | integer | User ID who sent the request |
| `recipient_id` | integer | User ID who received the request |
| `status` | string | Always "pending" (only pending requests returned) |
| `created_at` | string (ISO 8601) | Request creation timestamp |
| `updated_at` | string (ISO 8601) | Last modification timestamp |
| `requester` | object | **Included for incoming requests**: Requester user profile |
| `recipient` | object | **Included for outgoing requests**: Recipient user profile |

### User Profile Object (requester/recipient)
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | User ID |
| `username` | string | User's username |
| `email` | string | User's email address |

## Service Implementation
**File:** `services/friends.requests.service.js`

### Key Features
- **Type-Based Filtering**: Supports incoming, outgoing, and combined views
- **Enhanced User Data**: Includes user profile information via SQL JOINs
- **Pending Only**: Only returns pending requests (not accepted/denied)
- **Chronological Order**: Results ordered by creation date (newest first)
- **Efficient Queries**: Uses indexed queries for optimal performance
- **Context-Aware**: Returns appropriate user data based on request direction

### Query Logic by Type

#### Incoming Requests
```sql
SELECT * FROM friendship_requests 
WHERE recipient_id = $1 AND status = 'pending'
ORDER BY created_at DESC
```

#### Outgoing Requests
```sql
SELECT * FROM friendship_requests 
WHERE requester_id = $1 AND status = 'pending'
ORDER BY created_at DESC
```

#### All Requests
```sql
SELECT * FROM friendship_requests 
WHERE status = 'pending' 
  AND (recipient_id = $1 OR requester_id = $1)
ORDER BY created_at DESC
```

## Example Usage

### Get Incoming Requests (Requests I Can Respond To)
```bash
curl -X GET "http://localhost:3000/api/friends/requests?type=incoming" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Outgoing Requests (Requests I Sent)
```bash
curl -X GET "http://localhost:3000/api/friends/requests?type=outgoing" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get All Pending Requests
```bash
curl -X GET "http://localhost:3000/api/friends/requests?type=all" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Response Example (Incoming Request)
```json
{
  "success": true,
  "requests": [
    {
      "id": 123,
      "requester_id": 789,
      "recipient_id": 456,
      "status": "pending",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "requester": {
        "id": 789,
        "username": "disc_thrower_2024",
        "email": "thrower@example.com"
      }
    }
  ]
}
```

## Request Type Use Cases

### Incoming Requests ("incoming")
- **Notification Systems**: Show requests that need user action
- **Decision Making**: Display requests user can accept/decline
- **Friend Management**: See who wants to connect
- **Response Interface**: Primary view for responding to requests

### Outgoing Requests ("outgoing")
- **Status Tracking**: Monitor sent requests
- **Follow-up**: See which requests are still pending
- **Request Management**: Track networking attempts
- **Analytics**: Measure social networking success

### All Requests ("all")
- **Complete Overview**: See all pending friend activity
- **Administrative View**: Full friend request status
- **Debugging**: Comprehensive request state view
- **Activity Monitoring**: Track all pending social connections

## Business Rules

### Filtering Rules
- **Pending Only**: Only shows requests with "pending" status
- **User-Centric**: Only shows requests involving the current user
- **Bidirectional**: "all" type includes both directions
- **Chronological**: Newest requests appear first

### Status Handling
- **Pending Focus**: Only pending requests are actionable
- **Accepted/Denied**: Excluded from results (handled separately)
- **Real-time**: Reflects current database state
- **Consistent**: Same status rules across all types

## Performance Considerations
- **Indexed Queries**: All queries use indexed columns
- **Status Filter**: Significantly reduces result set size
- **Simple Queries**: Efficient single-table operations
- **Minimal Data**: Returns only essential request information

## Related Endpoints
- **[POST /api/friends/request](./POST_friends_request.md)** - Send new friend requests
- **[POST /api/friends/respond](./POST_friends_respond.md)** - Accept/decline requests
- **[GET /api/friends](./GET_friends.md)** - List accepted friends
- **[GET /api/profile/search](../profile/GET_profile_search.md)** - Find users to befriend