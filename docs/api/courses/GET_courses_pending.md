# GET /api/courses/pending

## Overview
Retrieves a list of user-submitted courses awaiting admin approval. This endpoint is restricted to administrators and returns paginated results of courses that have been submitted by users but not yet approved or rejected.

## Endpoint
```
GET /api/courses/pending
```

## Authentication
**Required**: Bearer token in Authorization header + Admin privileges.

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | integer | No | 50 | Number of results per page (max 500) |
| `offset` | integer | No | 0 | Number of results to skip |

### Pagination
- **Default Limit**: 50 courses
- **Maximum Limit**: 500 courses
- **Offset**: Standard pagination offset

## Response

### Success (200 OK)
```json
{
  "courses": [
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
      "approved": false,
      "submitted_by_id": 123,
      "admin_notes": null,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 5,
  "limit": 50,
  "offset": 0,
  "hasMore": false
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

#### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

## Response Fields

### Course Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique course identifier (URL-friendly) |
| `name` | string | Course name |
| `city` | string | City where course is located |
| `state_province` | string | State/province where course is located |
| `country` | string | Two-letter country code |
| `postal_code` | string | ZIP/postal code |
| `hole_count` | integer | Number of holes on the course |
| `latitude` | number | GPS latitude coordinate (optional) |
| `longitude` | number | GPS longitude coordinate (optional) |
| `is_user_submitted` | boolean | Always true for pending courses |
| `approved` | boolean | Always false for pending courses |
| `submitted_by_id` | integer | User ID who submitted the course |
| `admin_notes` | string | Admin notes (null for new submissions) |
| `created_at` | string (ISO 8601) | Course submission timestamp |
| `updated_at` | string (ISO 8601) | Last modification timestamp |

### Root Response Object
| Field | Type | Description |
|-------|------|-------------|
| `courses` | array | Array of pending course objects |
| `total` | integer | Total number of pending courses |
| `limit` | integer | Results per page |
| `offset` | integer | Results skipped |
| `hasMore` | boolean | Whether more results exist |

## Service Implementation
**File:** `services/courses.admin.service.js`

### Key Features
- **Admin Only**: Restricted to users with `is_admin = true`
- **Pending Only**: Only returns courses with `approved = false` and `is_user_submitted = true`
- **Pagination Support**: Configurable limit and offset with maximum limit
- **SQL Injection Protection**: Parameterized queries
- **Chronological Order**: Ordered by creation date (oldest first)

### Database Operations
- Count query: `SELECT COUNT(*) FROM courses WHERE approved = false AND is_user_submitted = true`
- Search query: `SELECT * FROM courses WHERE approved = false AND is_user_submitted = true ORDER BY created_at ASC`

## Example Usage

### Get All Pending Courses (First Page)
```bash
curl -X GET http://localhost:3000/api/courses/pending \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

### Get Next Page of Pending Courses
```bash
curl -X GET "http://localhost:3000/api/courses/pending?limit=10&offset=10" \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN"
```

## Use Cases
- **Admin Review**: Review courses submitted by users
- **Approval Workflow**: See all courses awaiting approval
- **Quality Control**: Moderate user-generated content
- **Course Management**: Manage course database quality

## Related Endpoints
- **[PUT /api/courses/:id/approve](./PUT_courses_id_approve.md)** - Approve or reject pending course
- **[PUT /api/courses/:id](./PUT_courses_id.md)** - Edit course details
- **[GET /api/courses](./GET_courses.md)** - Search all approved courses
- **[POST /api/courses](./POST_courses.md)** - Submit new course