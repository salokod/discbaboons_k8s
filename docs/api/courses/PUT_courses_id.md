# PUT /api/courses/:id

## Overview
Edits an existing course with permission-based access control. Users can edit their own submitted courses, admins can edit any course, and accepted friends can edit each other's courses. This endpoint supports partial updates - only provided fields will be updated.

## Endpoint
```
PUT /api/courses/:id
```

## Authentication
**Required**: Bearer token in Authorization header.

## Permission Rules
1. **Admins**: Can edit any course
2. **Course Owner**: Can edit their own submitted courses
3. **Accepted Friends**: Can edit courses submitted by their accepted friends
4. **Others**: No permission to edit

## URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Unique course identifier |

## Request Body

All fields are optional. Only provided fields will be updated.

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `name` | string | Course name | 1-200 characters |
| `city` | string | City name | 1-100 characters |
| `stateProvince` | string | State/province | 1-50 characters |
| `country` | string | Country code | 2 characters (ISO) |
| `postalCode` | string | Postal/ZIP code | 1-10 characters |
| `holeCount` | integer | Number of holes | 1-50 |
| `latitude` | number | GPS latitude | -90 to 90 |
| `longitude` | number | GPS longitude | -180 to 180 |

### Request Body Example
```json
{
  "name": "Updated Course Name",
  "city": "New City",
  "stateProvince": "CA",
  "holeCount": 27,
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

### Field Name Compatibility
The endpoint supports both camelCase and snake_case field names:
- `stateProvince` or `state_province`
- `postalCode` or `postal_code` 
- `holeCount` or `hole_count`

## Response

### Success (200 OK)
```json
{
  "id": "user-course-123",
  "name": "Updated Course Name",
  "city": "New City",
  "state_province": "CA",
  "country": "US",
  "postal_code": "94102",
  "hole_count": 27,
  "latitude": 37.7749,
  "longitude": -122.4194,
  "is_user_submitted": true,
  "approved": false,
  "submitted_by_id": 123,
  "admin_notes": null,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T16:20:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Missing Course ID
```json
{
  "error": "Course ID is required"
}
```

#### 400 Bad Request - No Fields to Update
```json
{
  "error": "No valid fields to update"
}
```

#### 400 Bad Request - Permission Denied
```json
{
  "error": "You do not have permission to edit this course"
}
```

#### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

#### 404 Not Found
```json
{
  "error": "Course not found"
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
| `approved` | boolean | Approval status |
| `submitted_by_id` | integer | User ID who submitted the course |
| `admin_notes` | string | Admin notes (if any) |
| `created_at` | string (ISO 8601) | Course creation timestamp |
| `updated_at` | string (ISO 8601) | Last modification timestamp |

## Service Implementation
**File:** `services/courses.edit.service.js`

### Key Features
- **Permission-Based Access**: Validates user permissions before allowing edits
- **Partial Updates**: Only updates provided fields
- **Friendship Validation**: Checks accepted friendship relationships
- **Admin Override**: Admins can edit any course
- **SQL Injection Protection**: Parameterized queries
- **Field Validation**: Validates allowed update fields

### Database Operations
- User check: `SELECT id, is_admin FROM users WHERE id = $1`
- Course check: `SELECT id, submitted_by_id FROM courses WHERE id = $1`  
- Friendship check: `SELECT * FROM friendship_requests WHERE status = 'accepted' AND ...`
- Update query: `UPDATE courses SET field1 = $1, field2 = $2, updated_at = NOW() WHERE id = $n RETURNING *`

## Example Usage

### Update Course Name and Location
```bash
curl -X PUT http://localhost:3000/api/courses/user-course-123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Course Name",
    "city": "Updated City",
    "stateProvince": "TX"
  }'
```

### Update GPS Coordinates
```bash
curl -X PUT http://localhost:3000/api/courses/user-course-123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7128,
    "longitude": -74.0060
  }'
```

### Update Hole Count Only
```bash
curl -X PUT http://localhost:3000/api/courses/user-course-123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "holeCount": 18
  }'
```

### Using snake_case Field Names
```bash
curl -X PUT http://localhost:3000/api/courses/user-course-123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "state_province": "FL",
    "postal_code": "33101",
    "hole_count": 24
  }'
```

## Permission Examples

### Admin User
- Can edit **any** course regardless of who submitted it
- Has full edit permissions on all courses

### Course Owner
- Can edit courses they submitted (`submitted_by_id` matches their user ID)
- Cannot edit courses submitted by others (unless they are friends)

### Friend User  
- Can edit courses submitted by their **accepted friends**
- Must have `status = 'accepted'` friendship relationship
- Friendship can be in either direction (requester or recipient)

### Non-Friend User
- Cannot edit courses submitted by others
- Will receive 400 error with permission denied message

## Use Cases
- **Course Correction**: Fix errors in submitted course data
- **Information Updates**: Update course details as they change
- **Collaborative Editing**: Friends helping each other maintain course data
- **Admin Moderation**: Administrators correcting course information
- **GPS Accuracy**: Adding or correcting coordinate data

## Related Endpoints
- **[GET /api/courses/:id](./GET_courses_id.md)** - Get course details before editing
- **[POST /api/courses](./POST_courses.md)** - Submit new course
- **[PUT /api/courses/:id/approve](./PUT_courses_id_approve.md)** - Admin approval (separate from editing)
- **[GET /api/courses/pending](./GET_courses_pending.md)** - List pending courses (admin only)