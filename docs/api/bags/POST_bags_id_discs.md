# POST /api/bags/:id/discs

## Overview
Adds a disc to a specific bag, with optional custom properties that override disc master defaults.

## Endpoint
```
POST /api/bags/:id/discs
```

## Authentication
**Required**: Bearer token in Authorization header.

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Unique bag identifier |

## Request Body
```json
{
  "disc_id": "string (UUID)",  // Required
  "notes": "string",           // Optional
  "weight": number,            // Optional
  "condition": "string",       // Optional
  "plastic_type": "string",    // Optional
  "color": "string",           // Optional
  "speed": integer,            // Optional - overrides disc master
  "glide": integer,            // Optional - overrides disc master
  "turn": integer,             // Optional - overrides disc master
  "fade": integer,             // Optional - overrides disc master
  "brand": "string",           // Optional - overrides disc master
  "model": "string"            // Optional - overrides disc master
}
```

### Field Requirements

| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `disc_id` | string (UUID) | Yes | Must reference existing disc_master | - |
| `notes` | string | No | User notes about this disc | null |
| `weight` | number | No | Disc weight in grams | null |
| `condition` | string | No | new, good, worn, beat-in | null |
| `plastic_type` | string | No | Champion, Star, etc. | null |
| `color` | string | No | Disc color | null |
| `speed` | integer | No | 1-15 | disc_master.speed |
| `glide` | integer | No | 1-7 | disc_master.glide |
| `turn` | integer | No | -5 to 2 | disc_master.turn |
| `fade` | integer | No | 0-5 | disc_master.fade |
| `brand` | string | No | Max 50 chars | disc_master.brand |
| `model` | string | No | Max 50 chars | disc_master.model |

## Response

### Success (201 Created)
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "user_id": 123,
  "bag_id": "550e8400-e29b-41d4-a716-446655440000",
  "disc_id": "770e8400-e29b-41d4-a716-446655440000",
  "notes": "My favorite fairway driver",
  "weight": "175.0",
  "condition": "good",
  "plastic_type": "Champion",
  "color": "Red",
  "speed": 9,
  "glide": 5,
  "turn": -1,
  "fade": 2,
  "brand": "Innova",
  "model": "Thunderbird",
  "is_lost": false,
  "added_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "error": "ValidationError",
  "message": "disc_id is required"
}
```

**Possible validation messages:**
- "user_id is required"
- "bag_id is required"
- "disc_id is required"
- "speed must be between 1 and 15"
- "glide must be between 1 and 7"
- "turn must be between -5 and 2"
- "fade must be between 0 and 5"
- "brand must be a string with maximum 50 characters"
- "model must be a string with maximum 50 characters"

#### 403 Forbidden - Authorization Error
```json
{
  "error": "AuthorizationError",
  "message": "Bag not found or access denied"
}
```

#### 404 Not Found
```json
{
  "error": "NotFoundError", 
  "message": "Disc not found"
}
```

#### 401 Unauthorized
```json
{
  "error": "UnauthorizedError",
  "message": "Access token required"
}
```

## Service Implementation
**File:** `services/bag-contents.add.service.js`

### Key Features
- **Bag ownership validation**: Only bag owner can add discs
- **Disc existence validation**: Validates disc_id references valid disc
- **Pending disc authorization**: Users can only add their own pending discs
- **Custom property overrides**: User values override disc master defaults
- **Flight number validation**: Validates all flight numbers within valid ranges
- **String validation**: Validates custom brand/model length constraints

### Security Features
- **Ownership Verification**: `WHERE id = $1 AND user_id = $2` for bag access
- **Pending Disc Control**: Only approved discs or user's own pending discs allowed
- **Input Validation**: Comprehensive validation of all optional fields

### Data Hierarchy
When adding a disc, the service follows this priority:
1. **User Custom Values**: If provided, use user's custom flight numbers/names
2. **Disc Master Fallback**: If not provided, use disc_master defaults
3. **Null Coalescing**: Uses `??` operator for proper null/undefined handling

### Database Operations
- Bag validation: `SELECT id, user_id, name FROM bags WHERE id = $1 AND user_id = $2`
- Disc validation: `SELECT id, brand, model, speed, glide, turn, fade, approved, added_by_id FROM disc_master WHERE id = $1`
- Content creation: Complex INSERT with all fields and timestamps

## Example Usage

### Basic Disc Addition
```bash
curl -X POST http://localhost:3000/api/bags/550e8400-e29b-41d4-a716-446655440000/discs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "disc_id": "770e8400-e29b-41d4-a716-446655440000"
  }'
```

### Full Disc Addition with Custom Properties
```bash
curl -X POST http://localhost:3000/api/bags/550e8400-e29b-41d4-a716-446655440000/discs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "disc_id": "770e8400-e29b-41d4-a716-446655440000",
    "notes": "Beat in for turnover shots",
    "weight": 175.0,
    "condition": "beat-in",
    "plastic_type": "Champion",
    "color": "Red",
    "speed": 9,
    "glide": 5,
    "turn": -2,
    "fade": 1,
    "brand": "Innova",
    "model": "Thunderbird"
  }'
```

### Custom Flight Numbers
```bash
curl -X POST http://localhost:3000/api/bags/550e8400-e29b-41d4-a716-446655440000/discs \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "disc_id": "770e8400-e29b-41d4-a716-446655440000",
    "notes": "Custom flight numbers for my throw",
    "speed": 8,
    "glide": 4,
    "turn": -2,
    "fade": 2
  }'
```

## Use Cases
- **New Disc Addition**: Adding discs to bags from disc master database
- **Custom Properties**: Personalizing disc properties (weight, condition, plastic)
- **Flight Number Customization**: Adjusting flight numbers based on personal experience
- **Disc Cataloging**: Building personal disc collection with detailed information

## Related Endpoints
- **[GET /api/bags/:id](./GET_bags_id.md)** - View bag contents
- **[PUT /api/bags/:id/discs/:contentId](./PUT_bags_id_discs_contentId.md)** - Edit disc in bag
- **[DELETE /api/bags/discs/:contentId](./DELETE_bags_discs_contentId.md)** - Remove disc from bag
- **[PATCH /api/bags/discs/:contentId/lost](./PATCH_bags_discs_contentId_lost.md)** - Mark disc as lost
- **[GET /api/discs/master](../discs/GET_discs_master.md)** - Browse available discs