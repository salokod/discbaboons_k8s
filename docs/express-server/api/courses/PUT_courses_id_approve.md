# PUT /api/courses/:id/approve

## Overview
Reviews and approves or rejects a user-submitted course. This endpoint is restricted to administrators and allows them to moderate course submissions by either approving them for public visibility or rejecting them with optional admin notes. Once reviewed, courses will no longer appear in the pending list.

## Endpoint
```
PUT /api/courses/:id/approve
```

## Authentication
**Required**: Bearer token in Authorization header + Admin privileges.

## Rate Limiting
- **Window**: 10 minutes
- **Max Requests**: 20 per IP address
- **Purpose**: Prevent excessive admin API usage
- **Headers**: Standard rate limit headers included in response

## Request Size Limit
- **Maximum**: 50KB
- **Applies to**: Request body
- **Error**: Returns 413 Payload Too Large if exceeded

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique course identifier |

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `approved` | boolean | Yes | Approval status (true = approve, false = reject) |
| `adminNotes` | string | No | Optional admin notes explaining the decision |

### Request Body Example
```json
{
  "approved": true,
  "adminNotes": "Course approved after verification. Good location data provided."
}
```

## Response

### Success (200 OK)
```json
{
  "id": "user-submitted-course-xyz",
  "name": "New Community Park Course",
  "city": "Springfield",
  "state_province": "IL",
  "country": "US",
  "postal_code": "62701",
  "hole_count": 18,
  "latitude": 39.7817,
  "longitude": -89.6501,
  "is_user_submitted": true,
  "approved": true,
  "submitted_by_id": 123,
  "admin_notes": "Course approved after verification. Good location data provided.",
  "reviewed_at": "2024-01-15T14:45:00.000Z",
  "reviewed_by_id": 456,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T14:45:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Missing Course ID
```json
{
  "success": false,
  "message": "Course ID is required"
}
```

#### 400 Bad Request - Invalid Approval Status
```json
{
  "success": false,
  "message": "Approved status must be true or false"
}
```

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

#### 404 Not Found
```json
{
  "success": false,
  "message": "Course not found"
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
  "message": "Too many admin requests. Please try again later."
}
```

## Response Fields

### Course Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique course identifier |
| `name` | string | Course name |
| `city` | string | City where course is located |
| `state_province` | string | State/province where course is located |
| `country` | string | Two-letter country code |
| `postal_code` | string | ZIP/postal code |
| `hole_count` | integer | Number of holes on the course |
| `latitude` | number | GPS latitude coordinate |
| `longitude` | number | GPS longitude coordinate |
| `is_user_submitted` | boolean | Whether course was user-submitted |
| `approved` | boolean | Updated approval status |
| `submitted_by_id` | integer | User ID who submitted the course |
| `admin_notes` | string | Admin notes about the approval decision |
| `reviewed_at` | string (ISO 8601) | Timestamp when admin reviewed the course |
| `reviewed_by_id` | integer | User ID of the admin who reviewed the course |
| `created_at` | string (ISO 8601) | Course submission timestamp |
| `updated_at` | string (ISO 8601) | Timestamp of approval/rejection |

## Service Implementation
**File:** `services/courses.admin.service.js`

### Key Features
- **Admin Only**: Restricted to users with `is_admin = true`
- **Status Update**: Updates approval status and admin notes
- **Review Tracking**: Records review timestamp and reviewing admin
- **Audit Trail**: Updates `updated_at` timestamp
- **Pending List**: Removes course from pending list after review
- **SQL Injection Protection**: Parameterized queries

### Database Operations
- Update query: `UPDATE courses SET approved = $1, admin_notes = $2, reviewed_at = NOW(), reviewed_by_id = $3, updated_at = NOW() WHERE id = $4 RETURNING *`

## Example Usage

### Approve a Course
```bash
curl -X PUT http://localhost:3000/api/courses/user-course-123/approve \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "adminNotes": "Course approved. Verified location and hole count."
  }'
```

### Reject a Course
```bash
curl -X PUT http://localhost:3000/api/courses/user-course-456/approve \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": false,
    "adminNotes": "Course rejected. Duplicate of existing course in same location."
  }'
```

### Approve Without Notes
```bash
curl -X PUT http://localhost:3000/api/courses/user-course-789/approve \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true
  }'
```

## Use Cases
- **Course Moderation**: Review and approve user submissions
- **Quality Control**: Reject courses with poor data quality
- **Duplicate Management**: Reject duplicate course submissions
- **Content Management**: Maintain course database integrity

## Effects of Review

### All Reviews (Approved or Rejected)
- Course is removed from pending list immediately
- `reviewed_at` timestamp is set to current time
- `reviewed_by_id` is set to the reviewing admin's user ID
- Course will not reappear in pending list regardless of decision

### When `approved: true`
- Course becomes visible in public search results
- Course can be used for round creation
- Course appears in user's approved submissions

### When `approved: false`
- Course remains hidden from public search
- Course only visible to submitter and their friends
- Course cannot be used for public rounds
- Course does not reappear in pending list for re-review

## Admin Notes Guidelines
- **Approval**: Explain what made the course acceptable
- **Rejection**: Clearly state reason for rejection
- **Suggestions**: Provide guidance for resubmission if applicable
- **References**: Note any duplicate or similar courses

## Related Endpoints
- **[GET /api/courses/pending](./GET_courses_pending.md)** - List pending courses
- **[PUT /api/courses/:id](./PUT_courses_id.md)** - Edit course details
- **[GET /api/courses](./GET_courses.md)** - Search approved courses
- **[POST /api/courses](./POST_courses.md)** - Submit new course