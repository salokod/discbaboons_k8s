# POST /api/discs/master

## Overview
Adds a new disc to the master disc database. All user-submitted discs are created with pending approval status and require admin approval before becoming publicly available.

## Endpoint
```
POST /api/discs/master
```

## Authentication
**Required**: Bearer token in Authorization header.

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `brand` | string | Yes | Disc manufacturer/brand name |
| `model` | string | Yes | Disc model name |
| `speed` | integer | Yes | Flight rating: Speed (1-15) |
| `glide` | integer | Yes | Flight rating: Glide (1-7) |
| `turn` | integer | Yes | Flight rating: Turn (-5 to 2) |
| `fade` | integer | Yes | Flight rating: Fade (0-5) |

### Example Request
```json
{
  "brand": "Innova",
  "model": "Destroyer",
  "speed": 12,
  "glide": 5,
  "turn": -1,
  "fade": 3
}
```

## Response

### Success (201 Created)
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "brand": "Innova",
  "model": "Destroyer",
  "speed": 12,
  "glide": 5,
  "turn": -1,
  "fade": 3,
  "approved": false,
  "added_by_id": 123,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "error": "ValidationError",
  "message": "Brand is required"
}
```

**Possible validation messages:**
- "Brand is required"
- "Model is required"
- "Speed is required"
- "Glide is required"
- "Turn is required"
- "Fade is required"
- "A disc with this brand and model already exists"

#### 401 Unauthorized
```json
{
  "error": "UnauthorizedError",
  "message": "Access token required"
}
```

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
| `approved` | boolean | Always false for new submissions |
| `added_by_id` | integer | User ID who submitted the disc |
| `created_at` | string (ISO 8601) | Disc creation timestamp |
| `updated_at` | string (ISO 8601) | Last modification timestamp |

## Service Implementation
**File:** `services/discs.create.service.js`

### Key Features
- **Comprehensive Validation**: Validates all required flight number fields
- **Duplicate Prevention**: Checks for existing brand/model combinations (case-insensitive)
- **Pending Status**: All user submissions start as `approved = false`
- **User Attribution**: Tracks who submitted the disc via `added_by_id`
- **Admin Approval Required**: Discs need admin approval to become publicly available

### Validation Rules
1. **Required Fields**: All flight numbers and brand/model must be provided
2. **Type Checking**: Uses `typeof` to validate number fields (allows 0 values)
3. **Duplicate Check**: Case-insensitive matching for brand and model
4. **Automatic Tracking**: Sets submitter ID and timestamps

### Duplicate Detection
```sql
SELECT id, brand, model 
FROM disc_master 
WHERE LOWER(brand) = LOWER($1) AND LOWER(model) = LOWER($2)
```

### Database Operations
- Duplicate check: Case-insensitive brand/model lookup
- Insert disc: Creates new record with `approved = false`

## Example Usage

### Add New Disc
```bash
curl -X POST http://localhost:3000/api/discs/master \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Innova",
    "model": "Destroyer", 
    "speed": 12,
    "glide": 5,
    "turn": -1,
    "fade": 3
  }'
```

### Response
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "brand": "Innova",
  "model": "Destroyer",
  "speed": 12,
  "glide": 5,
  "turn": -1,
  "fade": 3,
  "approved": false,
  "added_by_id": 123,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

## Flight Number Guidelines

### Speed (1-15)
- **1-3**: Putters (slow, controlled approach)
- **4-5**: Midrange discs (versatile, straight flight)
- **6-8**: Fairway drivers (controlled distance)
- **9-12**: Distance drivers (maximum distance)
- **13-15**: Speed demons (expert level, very fast)

### Glide (1-7)
- **1-2**: Low glide (fights wind, predictable fade)
- **3-4**: Medium glide (balanced flight)
- **5-6**: High glide (longer flight, good for distance)
- **7**: Maximum glide (stays airborne longest)

### Turn (-5 to 2)
- **-5 to -3**: Very understable (turns right for RHBH)
- **-2 to -1**: Understable (slight right turn)
- **0**: Stable (flies straight)
- **1-2**: Overstable (resists turn, reliable fade)

### Fade (0-5)
- **0**: No fade (finishes straight)
- **1**: Minimal fade (slight left finish)
- **2-3**: Moderate fade (reliable left finish)
- **4-5**: Hard fade (strong left finish)

## Approval Process

### Submission Status
- **Initial**: All discs created with `approved = false`
- **Visibility**: Pending discs not visible in public searches
- **Admin Queue**: Admins can view pending discs via admin endpoints

### Admin Review
1. **[GET /api/discs/pending](./GET_discs_pending.md)** - Admins review submissions
2. **[PATCH /api/discs/:id/approve](./PATCH_discs_id_approve.md)** - Admins approve discs
3. **Public Availability** - Approved discs appear in public searches

## Use Cases
- **Community Contribution**: Users add missing discs to database
- **New Disc Releases**: Add newly released disc models
- **Database Completion**: Fill gaps in manufacturer catalogs
- **Custom Discs**: Add specialty or limited edition discs

## Business Rules
- **User Attribution**: All submissions tracked to submitting user
- **Pending by Default**: No automatic approval for user submissions
- **Duplicate Prevention**: Prevents duplicate brand/model combinations
- **Admin Approval Required**: Maintains database quality through moderation

## Security Features
- **Authentication Required**: Must be logged in to submit
- **Input Validation**: Comprehensive field validation
- **SQL Injection Protection**: Parameterized queries
- **Duplicate Prevention**: Prevents spam submissions
- **Moderation Queue**: Admin approval ensures data quality

## Related Endpoints
- **[GET /api/discs/master](./GET_discs_master.md)** - Search approved discs
- **[GET /api/discs/pending](./GET_discs_pending.md)** - List pending discs (admin only)
- **[PATCH /api/discs/:id/approve](./PATCH_discs_id_approve.md)** - Approve pending disc (admin only)
- **[POST /api/bags/:id/discs](../bags/POST_bags_id_discs.md)** - Add disc to bag (uses approved discs)