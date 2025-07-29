# GET /api/courses

## Overview
Searches and retrieves disc golf courses with filtering and pagination capabilities. Returns approved courses from the course database, plus unapproved courses submitted by the authenticated user and their accepted friends.

## Endpoint
```
GET /api/courses
```

## Authentication
**Required**: Bearer token in Authorization header.

## Rate Limiting
- **Window**: 5 minutes
- **Max Requests**: 30 per IP address
- **Headers**: Standard rate limit headers included in response

## Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `country` | string | No | - | Filter by country code (partial match, case-insensitive) |
| `stateProvince` | string | No | - | Filter by state/province (partial match, case-insensitive) |
| `state` | string | No | - | Legacy parameter for stateProvince (partial match, case-insensitive) |
| `city` | string | No | - | Filter by city name (partial match, case-insensitive) |
| `name` | string | No | - | Filter by course name (partial match, case-insensitive) |
| `is_user_submitted` | boolean | No | - | Filter by submission type (true/false only) |
| `approved` | boolean | No | - | Filter by approval status (true/false only) |
| `limit` | integer | No | 50 | Number of results per page (max 500) |
| `offset` | integer | No | 0 | Number of results to skip |

### Filtering Rules
- **Text Fields** (country, stateProvince, city, name): Partial match using ILIKE (case-insensitive)
- **Boolean Fields** (is_user_submitted, approved): Exact match, must be true or false
- **Legacy Support**: `state` parameter maps to `stateProvince` for backward compatibility
- **Validation**: Boolean parameters reject invalid values (returns 400 error)
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
      "state_province": "Texas",
      "country": "US",
      "postal_code": "78701",
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

#### 400 Bad Request - Invalid Boolean Parameter
```json
{
  "success": false,
  "message": "is_user_submitted must be a boolean value (true or false)"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many course searches. Please try again later."
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

### Filter by State/Province
```bash
curl -X GET "http://localhost:3000/api/courses?stateProvince=California" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Filter by Country and State
```bash
curl -X GET "http://localhost:3000/api/courses?country=US&stateProvince=California" \
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

### Filter by Boolean Fields
```bash
# Find user-submitted courses
curl -X GET "http://localhost:3000/api/courses?is_user_submitted=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Find unapproved courses (user can edit)
curl -X GET "http://localhost:3000/api/courses?approved=false" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Combined Filters
```bash
curl -X GET "http://localhost:3000/api/courses?country=US&stateProvince=Texas&name=zilker&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Find editable courses for the user
curl -X GET "http://localhost:3000/api/courses?is_user_submitted=true&approved=false" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Use Cases
- **Course Discovery**: Find disc golf courses in specific areas
- **Round Planning**: Search for courses before travel
- **Location-Based Search**: Find nearby courses by country/state/city
- **Course Selection**: Browse available courses for round creation
- **User Content Management**: Find courses the user can edit (`is_user_submitted=true&approved=false`)
- **Admin Workflow**: Find pending user submissions (`approved=false`)
- **Content Filtering**: Separate user-submitted from imported course data

## Performance Considerations
- **Indexed Queries**: State, city, and location fields are indexed
- **Pagination**: Prevents large result sets that could impact performance
- **Approved Only**: Filter reduces query scope significantly

## Related Endpoints
- **[GET /api/courses/:id](./GET_courses_id.md)** - Get specific course details
- **[POST /api/courses](./POST_courses.md)** - Submit new course (when implemented)
- Course-related round endpoints (when round management is implemented)