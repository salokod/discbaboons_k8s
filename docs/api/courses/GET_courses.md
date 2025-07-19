# GET /api/courses

## Overview
Searches and retrieves disc golf courses with filtering and pagination capabilities. Returns approved courses from the course database, plus unapproved courses submitted by the authenticated user and their accepted friends.

## Endpoint
```
GET /api/courses
```

## Authentication
**Required**: Bearer token in Authorization header.

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `state` | string | No | - | Filter by exact state name |
| `city` | string | No | - | Filter by exact city name |
| `name` | string | No | - | Filter by course name (partial match, case-insensitive) |
| `limit` | integer | No | 50 | Number of results per page (max 500) |
| `offset` | integer | No | 0 | Number of results to skip |

### Filtering Rules
- **State**: Exact match (case-sensitive)
- **City**: Exact match (case-sensitive) 
- **Name**: Partial match using ILIKE (case-insensitive)
- **Visibility**: Returns approved courses + user's own unapproved courses + friends' unapproved courses

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
      "id": "disc-golf-course-austin-tx",
      "name": "Zilker Park Disc Golf Course",
      "city": "Austin",
      "state": "Texas",
      "zip": "78701",
      "hole_count": 18,
      "latitude": 30.2672,
      "longitude": -97.7431,
      "is_user_submitted": false,
      "approved": true,
      "submitted_by_id": null,
      "admin_notes": null,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0,
  "hasMore": false
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "UnauthorizedError",
  "message": "Access token required"
}
```

## Response Fields

### Course Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique course identifier (URL-friendly) |
| `name` | string | Course name |
| `city` | string | City where course is located |
| `state` | string | State where course is located |
| `zip` | string | ZIP/postal code |
| `hole_count` | integer | Number of holes on the course |
| `latitude` | number | GPS latitude coordinate |
| `longitude` | number | GPS longitude coordinate |
| `is_user_submitted` | boolean | Whether course was user-submitted |
| `approved` | boolean | Approval status (true for approved, false for pending user/friend submissions) |
| `submitted_by_id` | integer | User ID who submitted (null for imported courses) |
| `admin_notes` | string | Admin notes about the course |
| `created_at` | string (ISO 8601) | Course creation timestamp |
| `updated_at` | string (ISO 8601) | Last modification timestamp |

### Root Response Object
| Field | Type | Description |
|-------|------|-------------|
| `courses` | array | Array of course objects |
| `total` | integer | Total number of matching courses |
| `limit` | integer | Results per page |
| `offset` | integer | Results skipped |
| `hasMore` | boolean | Whether more results exist |

## Service Implementation
**File:** `services/courses.search.service.js`

### Key Features
- **Flexible Filtering**: State, city, and name-based filtering
- **Pagination Support**: Configurable limit and offset with maximum limit
- **SQL Injection Protection**: Parameterized queries
- **Case-Insensitive Search**: Name search using ILIKE
- **Approved Content Only**: Only returns approved courses

### Database Operations
- Count query: `SELECT COUNT(*) FROM courses WHERE approved = true AND ...`
- Search query: `SELECT * FROM courses WHERE approved = true AND ... ORDER BY state, city, name`

### Data Source
- **Course Database**: 7,008+ US disc golf courses
- **Import Source**: Course data imported from CSV files
- **Admin Approval**: All courses marked as approved for public access

## Example Usage

### Get All Courses (First Page)
```bash
curl -X GET http://localhost:3000/api/courses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Filter by State
```bash
curl -X GET "http://localhost:3000/api/courses?state=California" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Filter by State and City
```bash
curl -X GET "http://localhost:3000/api/courses?state=California&city=Sacramento" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Search by Course Name
```bash
curl -X GET "http://localhost:3000/api/courses?name=park" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Pagination (Large Page)
```bash
curl -X GET "http://localhost:3000/api/courses?limit=100&offset=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Combined Filters
```bash
curl -X GET "http://localhost:3000/api/courses?state=Texas&name=zilker&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Use Cases
- **Course Discovery**: Find disc golf courses in specific areas
- **Round Planning**: Search for courses before travel
- **Location-Based Search**: Find nearby courses by state/city
- **Course Selection**: Browse available courses for round creation

## Performance Considerations
- **Indexed Queries**: State, city, and location fields are indexed
- **Pagination**: Prevents large result sets that could impact performance
- **Approved Only**: Filter reduces query scope significantly

## Related Endpoints
- **[GET /api/courses/:id](./GET_courses_id.md)** - Get specific course details
- **[POST /api/courses](./POST_courses.md)** - Submit new course (when implemented)
- Course-related round endpoints (when round management is implemented)