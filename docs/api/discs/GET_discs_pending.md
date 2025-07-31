# GET /api/discs/pending

## Overview
Retrieves a list of discs pending admin approval. This admin-only endpoint shows all user-submitted discs awaiting moderation before becoming publicly available.

## Endpoint
```
GET /api/discs/pending
```

## Authentication
**Required**: Bearer token in Authorization header with admin privileges.

## Rate Limiting
- **Window**: 1 hour
- **Limit**: 50 admin operations per IP address
- **Purpose**: Prevents admin endpoint abuse while allowing efficient moderation
- **Headers Returned**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Time when limit resets

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `brand` | string | No | - | Filter by exact brand name |
| `model` | string | No | - | Filter by model name (partial match) |
| `limit` | integer | No | 50 | Number of results to return (max 100) |
| `offset` | integer | No | 0 | Number of results to skip (min 0) |

**Note**: Flight number filters (speed, glide, turn, fade) are also supported with the same syntax as the main discs endpoint.

## Response

### Success (200 OK)
```json
{
  "success": true,
  "discs": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "brand": "Dynamic Discs",
      "model": "Lucid Truth",
      "speed": 5,
      "glide": 5,
      "turn": 0,
      "fade": 2,
      "approved": false,
      "added_by_id": 456,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "brand": "Latitude 64",
      "model": "River",
      "speed": 7,
      "glide": 7,
      "turn": -1,
      "fade": 1,
      "approved": false,
      "added_by_id": 789,
      "created_at": "2024-01-14T09:15:00.000Z",
      "updated_at": "2024-01-14T09:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Admin access required"
}
```

#### 400 Bad Request - Validation Errors
```json
{
  "success": false,
  "message": "Invalid filter value"
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many admin operations, please try again in 1 hour"
}
```

**Rate Limit Headers:**
- `X-RateLimit-Limit`: 50
- `X-RateLimit-Remaining`: 0
- `X-RateLimit-Reset`: [timestamp]

## Response Fields

### Disc Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique disc identifier |
| `brand` | string | Disc manufacturer/brand |
| `model` | string | Disc model name |
| `speed` | integer | Flight rating: Speed (1-15) |
| `glide` | integer | Flight rating: Glide (1-7) |
| `turn` | integer | Flight rating: Turn (-5 to 2) |
| `fade` | integer | Flight rating: Fade (0-5) |
| `approved` | boolean | Always false for pending discs |
| `added_by_id` | integer | User ID who submitted the disc |
| `created_at` | string (ISO 8601) | Submission timestamp |
| `updated_at` | string (ISO 8601) | Last modification timestamp |

## Service Implementation
**File:** `services/discs.list.service.js` (with forced `approved=false` filter)

### Key Features
- **Admin Only**: Requires admin middleware for access
- **Forced Pending Filter**: Automatically sets `approved=false` via route middleware
- **Same Filter Logic**: Supports all filtering options from main disc search
- **Moderation Queue**: Shows discs awaiting approval in submission order

### Route Middleware
```javascript
// Middleware to force approved=false for /pending
function forcePendingFilter(req, res, next) {
  req.query.approved = 'false';
  next();
}
```

### Admin Authorization
- **isAdmin Middleware**: Validates user has admin privileges
- **Role-Based Access**: Only admin users can access pending discs
- **Security Layer**: Prevents regular users from seeing unapproved content

## Example Usage

### Get All Pending Discs
```bash
curl -X GET http://localhost:3000/api/discs/pending \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

### Filter Pending by Brand
```bash
curl -X GET "http://localhost:3000/api/discs/pending?brand=Innova" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

### Search Pending Models
```bash
curl -X GET "http://localhost:3000/api/discs/pending?model=destroyer" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

### Paginated Pending Results
```bash
curl -X GET "http://localhost:3000/api/discs/pending?limit=10&offset=20" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

## Admin Workflow

### Review Process
1. **List Pending**: Use this endpoint to see all pending submissions
2. **Filter by Criteria**: Filter by brand, model, or flight numbers
3. **Review Details**: Examine flight numbers and brand/model accuracy
4. **Approve/Reject**: Use approval endpoint for valid submissions

### Moderation Criteria
- **Accuracy**: Verify flight numbers match official specifications
- **Duplicates**: Check for existing similar discs
- **Naming**: Ensure brand and model names are correct
- **Completeness**: Validate all required information is provided

## Filtering Support

### All Standard Filters
Supports the same filtering as **[GET /api/discs/master](./GET_discs_master.md)**:
- **Brand**: Exact match filtering
- **Model**: Partial name matching
- **Flight Numbers**: Single values or ranges
- **Pagination**: Limit and offset support

### Filter Examples
```bash
# Speed range for pending drivers
curl -X GET "http://localhost:3000/api/discs/pending?speed=9-12" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"

# Understable pending discs
curl -X GET "http://localhost:3000/api/discs/pending?turn=-3--1" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

## Performance Considerations
- **Admin Only**: Limited user base reduces load
- **Pending Filter**: Significantly smaller dataset than approved discs
- **Same Optimization**: Uses same indexed queries as main disc search
- **Efficient Queries**: Leverages existing database optimization

## Use Cases
- **Content Moderation**: Review user-submitted disc data
- **Quality Control**: Ensure database accuracy before approval
- **Batch Processing**: Approve multiple discs efficiently
- **Spam Prevention**: Identify and handle duplicate submissions
- **Database Maintenance**: Monitor community contributions

## Business Rules
- **Admin Access Only**: Requires admin-level permissions
- **Pending Only**: Only shows discs with `approved = false`
- **Submission Order**: Results ordered by creation date
- **Same Validation**: Uses same validation rules as public searches

## Security Features
- **Admin Authorization**: Multiple layers of admin verification
- **Role-Based Access**: Strictly limited to admin users
- **Secure Filtering**: Same SQL injection protection as public endpoints
- **Access Logging**: Admin actions can be tracked for audit purposes

## Related Endpoints
- **[POST /api/discs/master](./POST_discs_master.md)** - Submit new discs (creates pending entries)
- **[PATCH /api/discs/:id/approve](./PATCH_discs_id_approve.md)** - Approve pending discs
- **[GET /api/discs/master](./GET_discs_master.md)** - Search approved discs
- **Admin Management**: Future endpoints for bulk approval/rejection