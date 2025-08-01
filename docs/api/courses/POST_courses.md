# POST /api/courses

Submit a new disc golf course for review and approval.

## Authentication Required
This endpoint requires a valid authentication token.

## Rate Limiting
- **Window**: 1 hour
- **Max Requests**: 5 per IP address
- **Purpose**: Prevent spam submissions and ensure quality
- **Headers**: Standard rate limit headers included in response

## Request Size Limit
- **Maximum**: 100KB
- **Applies to**: Request body
- **Error**: Returns 413 Payload Too Large if exceeded

## Request

### HTTP Method
```
POST /api/courses
```

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body
```json
{
  "name": "string (required)",
  "city": "string (required)", 
  "stateProvince": "string (required)",
  "country": "string (required, 2-character ISO code)",
  "postalCode": "string (optional)",
  "holeCount": "integer (required, positive)",
  "latitude": "number (optional)",
  "longitude": "number (optional)"
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Course name |
| `city` | string | Yes | City where course is located |
| `stateProvince` | string | Yes | State (US), province (CA), or region |
| `country` | string | Yes | 2-character ISO country code (e.g., US, CA, AU, GB) |
| `postalCode` | string | No | ZIP code, postal code, or equivalent |
| `holeCount` | integer | Yes | Number of holes (must be positive integer) |
| `latitude` | number | No | Course latitude coordinate (must be between -90 and 90) |
| `longitude` | number | No | Course longitude coordinate (must be between -180 and 180) |

#### Validation Rules

**Country-Specific Validation:**
- **US (United States)**: `stateProvince` must be valid 2-character state abbreviation (e.g., CA, TX, NY)
- **CA (Canada)**: `stateProvince` must be valid 2-character province code (e.g., ON, BC, QC)
- **Other Countries**: `stateProvince` can be any valid region name

**General Validation:**
- `country` must be exactly 2 characters (ISO 3166-1 alpha-2)
- `holeCount` must be a positive integer (≥ 1)
- `latitude` must be between -90 and 90 (if provided)
- `longitude` must be between -180 and 180 (if provided)
- All required fields must be provided and non-empty

## Response

### Success Response
**Status Code:** `201 Created`

```json
{
  "id": "course-name-city-state-country",
  "name": "Pine Valley Disc Golf Course",
  "city": "Sacramento", 
  "state_province": "CA",
  "country": "US",
  "postal_code": "95821",
  "hole_count": 18,
  "latitude": 38.5816,
  "longitude": -121.4944,
  "is_user_submitted": true,
  "approved": false,
  "submitted_by_id": 123,
  "created_at": "2025-07-19T12:15:05.141Z",
  "updated_at": "2025-07-19T12:15:05.141Z"
}
```

#### Response Field Notes
- `id`: Auto-generated URL-friendly identifier from location data
- `state_province`: Converted to uppercase for consistency
- `country`: Converted to uppercase for consistency
- `latitude`: Course latitude coordinate (null if not provided)
- `longitude`: Course longitude coordinate (null if not provided)
- `is_user_submitted`: Always `true` for user submissions
- `approved`: Always `false` - requires admin approval
- `submitted_by_id`: ID of the user who submitted the course

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "message": "Course name is required"
}
```

**Common validation error messages:**
- `"Course name is required"`
- `"City is required"`
- `"State/Province is required"`
- `"Country is required"`
- `"Hole count is required and must be a positive integer"`
- `"Country must be a valid 2-character ISO code (e.g., US, CA, AU, GB, JP, BR, MX)"`
- `"State must be a valid 2-character US state abbreviation (e.g., CA, TX, NY)"`
- `"Province must be a valid 2-character Canadian province code (e.g., ON, BC, QC)"`
- `"Latitude must be between -90 and 90"`
- `"Longitude must be between -180 and 180"`
- `"A course with this name and location already exists"`

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
  "message": "Request payload too large. Maximum size is 100KB."
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many course submissions. Please try again later."
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

## Examples

### Example 1: US Course Submission with Optional Fields
```bash
curl -X POST https://api.discbaboons.com/api/courses \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sunset Hills Disc Golf",
    "city": "Austin",
    "stateProvince": "TX", 
    "country": "US",
    "postalCode": "78701",
    "holeCount": 18,
    "latitude": 30.2672,
    "longitude": -97.7431
  }'
```

**Response:**
```json
{
  "id": "sunset-hills-disc-golf-austin-tx-us",
  "name": "Sunset Hills Disc Golf",
  "city": "Austin",
  "state_province": "TX",
  "country": "US", 
  "postal_code": "78701",
  "hole_count": 18,
  "latitude": 30.2672,
  "longitude": -97.7431,
  "is_user_submitted": true,
  "approved": false,
  "submitted_by_id": 456,
  "created_at": "2025-07-19T15:30:22.156Z",
  "updated_at": "2025-07-19T15:30:22.156Z"
}
```

### Example 2: International Course Submission
```bash
curl -X POST https://api.discbaboons.com/api/courses \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kangaroo Valley Disc Golf",
    "city": "Sydney",
    "stateProvince": "NSW",
    "country": "AU",
    "holeCount": 21
  }'
```

**Response:**
```json
{
  "id": "kangaroo-valley-disc-golf-sydney-nsw-au",
  "name": "Kangaroo Valley Disc Golf", 
  "city": "Sydney",
  "state_province": "NSW",
  "country": "AU",
  "postal_code": null,
  "hole_count": 21,
  "is_user_submitted": true,
  "approved": false,
  "submitted_by_id": 789,
  "created_at": "2025-07-19T15:35:44.892Z",
  "updated_at": "2025-07-19T15:35:44.892Z"
}
```

### Example 3: Validation Error (Invalid State)
```bash
curl -X POST https://api.discbaboons.com/api/courses \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Course",
    "city": "Los Angeles", 
    "stateProvince": "ZZ",
    "country": "US",
    "holeCount": 18
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "State must be a valid 2-character US state abbreviation (e.g., CA, TX, NY)"
}
```

### Example 4: Validation Error (Invalid Coordinates)
```bash
curl -X POST https://api.discbaboons.com/api/courses \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Course",
    "city": "Austin",
    "stateProvince": "TX",
    "country": "US",
    "holeCount": 18,
    "latitude": 91
  }'
```

**Response:**
```json
{
  "success": false,
  "message": "Latitude must be between -90 and 90"
}
```

### Example 5: Duplicate Course Error
```bash
curl -X POST https://api.discbaboons.com/api/courses \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sunset Hills Disc Golf",
    "city": "Austin",
    "stateProvince": "TX",
    "country": "US",
    "holeCount": 18
  }'
```

**Response (if course already exists):**
```json
{
  "success": false,
  "message": "A course with this name and location already exists"
}
```

## Notes

### Course Approval Process
- All user-submitted courses require admin approval before appearing in search results
- Submitted courses are stored with `approved: false` status
- Users can submit multiple courses but should verify accuracy before submission

### Duplicate Prevention
- Duplicate course submissions are automatically detected and prevented
- Course uniqueness is determined by name, city, state/province, and country
- If a course with identical location data already exists, submission will be rejected
- This prevents database errors and maintains data quality

### International Support
- DiscBaboons supports course submissions from any country
- Country-specific validation is only enforced for US and Canada
- Other countries accept any valid state/province/region name
- All location data is stored in normalized uppercase format

### ID Generation
- Course IDs are automatically generated from location data
- Format: `name-city-stateProvince-country` (lowercase, alphanumeric + hyphens)
- Special characters are replaced with hyphens
- IDs are unique but may conflict if identical course data is submitted

### Best Practices
- Verify course information before submission
- Use official course names when possible
- Include postal codes for better location accuracy
- Ensure hole count matches the actual course layout