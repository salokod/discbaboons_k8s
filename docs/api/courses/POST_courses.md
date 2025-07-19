# POST /api/courses

Submit a new disc golf course for review and approval.

## Authentication Required
This endpoint requires a valid authentication token.

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
  "holeCount": "integer (required, positive)"
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

#### Validation Rules

**Country-Specific Validation:**
- **US (United States)**: `stateProvince` must be valid 2-character state abbreviation (e.g., CA, TX, NY)
- **CA (Canada)**: `stateProvince` must be valid 2-character province code (e.g., ON, BC, QC)
- **Other Countries**: `stateProvince` can be any valid region name

**General Validation:**
- `country` must be exactly 2 characters (ISO 3166-1 alpha-2)
- `holeCount` must be a positive integer (≥ 1)
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

#### 401 Unauthorized
```json
{
  "error": "Access token required"
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

### Example 1: US Course Submission
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
    "holeCount": 18
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

### Example 3: Validation Error
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

## Notes

### Course Approval Process
- All user-submitted courses require admin approval before appearing in search results
- Submitted courses are stored with `approved: false` status
- Users can submit multiple courses but should verify accuracy before submission
- Duplicate submissions are currently allowed but discouraged

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