# GET /api/courses/:id

## Overview
Retrieves detailed information for a specific disc golf course by its unique identifier. Returns course details if the course exists and is approved.

## Endpoint
```
GET /api/courses/:id
```

## Authentication
**Required**: Bearer token in Authorization header.

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique course identifier |

### Parameter Rules
- **Course ID**: Must be a valid string identifier
- **Approved Only**: Only returns approved courses (`approved = true`)
- **Case Sensitive**: Course IDs are case-sensitive

## Response

### Success (200 OK) - Course Found
```json
{
  "id": "disc-golf-course-austin-tx",
  "name": "Zilker Park Disc Golf Course",
  "city": "Austin",
  "state": "Texas",
  "zip": "78701",
  "hole_count": 18,
  "latitude": "30.26720000",
  "longitude": "-97.74310000",
  "is_user_submitted": false,
  "approved": true,
  "submitted_by_id": null,
  "admin_notes": null,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Success (200 OK) - Course Not Found
```json
null
```

### Error Responses

#### 400 Bad Request - Missing Course ID
```json
{
  "success": false,
  "message": "courseId is required"
}
```

#### 401 Unauthorized
```json
{
  "error": "UnauthorizedError",
  "message": "Access token required"
}
```

## Response Fields

### Course Object (when found)
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique course identifier (URL-friendly) |
| `name` | string | Course name |
| `city` | string | City where course is located |
| `state` | string | State where course is located |
| `zip` | string | ZIP/postal code |
| `hole_count` | integer | Number of holes on the course |
| `latitude` | string | GPS latitude coordinate (8 decimal places) |
| `longitude` | string | GPS longitude coordinate (8 decimal places) |
| `is_user_submitted` | boolean | Whether course was user-submitted |
| `approved` | boolean | Always true (only approved courses returned) |
| `submitted_by_id` | integer\|null | User ID who submitted (null for imported courses) |
| `admin_notes` | string\|null | Admin notes about the course |
| `created_at` | string (ISO 8601) | Course creation timestamp |
| `updated_at` | string (ISO 8601) | Last modification timestamp |

## Service Implementation
**File:** `services/courses.get.service.js`

### Key Features
- **Single Course Lookup**: Retrieves specific course by ID
- **Validation**: Ensures courseId parameter is provided
- **SQL Injection Protection**: Parameterized queries
- **Approved Content Only**: Only returns approved courses
- **Graceful Handling**: Returns null for non-existent courses

### Database Operations
- Single query: `SELECT * FROM courses WHERE id = $1 AND approved = true`

### Security Considerations
- **Access Control**: Requires authentication
- **Approved Only**: Prevents access to unapproved/draft courses
- **Input Validation**: Validates courseId parameter

## Example Usage

### Get Specific Course
```bash
curl -X GET http://localhost:3000/api/courses/zilker-park-disc-golf-course \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Common Course ID Formats
Course IDs typically follow URL-friendly patterns:
- `zilker-park-disc-golf-course`
- `golden-gate-park-course-sf`
- `maple-hill-disc-golf-course`

### Handling Non-Existent Courses
```bash
# This request returns null (200 status)
curl -X GET http://localhost:3000/api/courses/non-existent-course \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Use Cases
- **Course Details**: Get complete information for course selection
- **Round Planning**: View course details before creating a round
- **Course Verification**: Validate course exists before operations
- **Navigation Data**: Get GPS coordinates for course location
- **Course Information Display**: Show detailed course information to users

## Performance Considerations
- **Indexed Lookup**: Course ID is the primary key (very fast)
- **Single Record**: Returns only one course object
- **Minimal Data Transfer**: Only returns requested course data

## Error Handling
- **Missing ID**: Returns 400 with validation error
- **Non-existent Course**: Returns 200 with null body
- **Unapproved Course**: Returns 200 with null body (security)
- **Authentication**: Returns 401 if token missing/invalid

## Related Endpoints
- **[GET /api/courses](./GET_courses.md)** - Search and filter courses
- **[POST /api/courses](./POST_courses.md)** - Submit new course (when implemented)
- Course-related round endpoints (when round management is implemented)

## Integration Notes
This endpoint is commonly used in conjunction with:
- Course search results to get detailed information
- Round creation workflows to validate course selection
- Course selection interfaces in frontend applications
- Course information displays and detail pages