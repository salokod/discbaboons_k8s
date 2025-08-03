# PUT /api/bags/:id/discs/:contentId

## Overview
Updates an existing disc in a bag, allowing modification of custom flight numbers, brand/model overrides, and other disc properties. Only the bag owner can edit discs in their bags.

## Endpoint
```
PUT /api/bags/:id/discs/:contentId
```

## Authentication
**Required**: Bearer token in Authorization header.

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Unique identifier of the bag containing the disc |
| `contentId` | integer | Yes | Unique identifier of the bag content to update |

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `speed` | integer | No | Custom speed rating (1-15) |
| `glide` | integer | No | Custom glide rating (1-7) |
| `turn` | integer | No | Custom turn rating (-5 to 2) |
| `fade` | integer | No | Custom fade rating (0-5) |
| `brand` | string | No | Custom brand name override (max 50 chars) |
| `model` | string | No | Custom model name override (max 50 chars) |

### Example Request
```json
{
  "speed": 10,
  "glide": 4,
  "turn": -2,
  "fade": 2,
  "brand": "Custom Thrower",
  "model": "Modified Beast"
}
```

### Partial Update Example
```json
{
  "speed": 11,
  "turn": -1
}
```

## Response

### Success (200 OK)
```json
{
  "success": true,
  "bag_content": {
    "id": 456,
    "bag_id": "550e8400-e29b-41d4-a716-446655440000",
    "disc_master_id": "770e8400-e29b-41d4-a716-446655440000",
    "speed": 10,
    "glide": 4,
    "turn": -2,
    "fade": 2,
    "brand": "Custom Thrower",
    "model": "Modified Beast",
    "is_lost": false,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "error": "ValidationError",
  "message": "speed must be between 1 and 15"
}
```

**Possible validation messages:**
- "userId is required"
- "bagId is required"
- "contentId is required"
- "updateData is required"
- "speed must be between 1 and 15"
- "glide must be between 1 and 7"
- "turn must be between -5 and 2"
- "fade must be between 0 and 5"
- "brand must be a string with maximum 50 characters"
- "model must be a string with maximum 50 characters"

#### 401 Unauthorized
```json
{
  "error": "UnauthorizedError",
  "message": "Access token required"
}
```

#### 403 Forbidden
```json
{
  "error": "AuthorizationError",
  "message": "Content not found or access denied"
}
```

## Response Fields

### Success Response
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always true for successful responses |
| `bag_content` | object | Updated bag content object |

### Bag Content Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique bag content identifier |
| `bag_id` | string (UUID) | Bag containing this disc |
| `disc_master_id` | string (UUID) | Reference to master disc database |
| `speed` | integer | Custom or original speed rating |
| `glide` | integer | Custom or original glide rating |
| `turn` | integer | Custom or original turn rating |
| `fade` | integer | Custom or original fade rating |
| `brand` | string | Custom or original brand name |
| `model` | string | Custom or original model name |
| `is_lost` | boolean | Whether disc is marked as lost |
| `created_at` | string (ISO 8601) | When disc was added to bag |
| `updated_at` | string (ISO 8601) | Last modification timestamp |

## Service Implementation
**File:** `services/bag-contents.edit.service.js`

### Key Features
- **Comprehensive Validation**: Validates all flight number ranges and string lengths
- **Custom Modifications**: Allows overriding master disc data with custom values
- **Owner Authorization**: Ensures user owns the bag before allowing edits
- **Dynamic Updates**: Only updates provided fields
- **Flight Number Validation**: Enforces official disc golf flight number ranges

### Validation Rules

#### Flight Numbers
- **Speed**: 1-15 (putters to distance drivers)
- **Glide**: 1-7 (low to high glide)
- **Turn**: -5 to 2 (very understable to overstable)
- **Fade**: 0-5 (no fade to hard fade)

#### String Fields
- **Brand**: Maximum 50 characters
- **Model**: Maximum 50 characters

### Database Operations
- Ownership verification: Join with bags table to verify user owns bag
- Dynamic update: Build SET clause based on provided fields
- Timestamp update: Automatically updates `updated_at` field

## Example Usage

### Update Flight Numbers
```bash
curl -X PUT http://localhost:3000/api/bags/550e8400-e29b-41d4-a716-446655440000/discs/456 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "speed": 10,
    "glide": 4,
    "turn": -2,
    "fade": 2
  }'
```

### Update Custom Brand/Model
```bash
curl -X PUT http://localhost:3000/api/bags/550e8400-e29b-41d4-a716-446655440000/discs/456 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Custom Stamp",
    "model": "Tournament Special"
  }'
```

### Partial Update (Speed Only)
```bash
curl -X PUT http://localhost:3000/api/bags/550e8400-e29b-41d4-a716-446655440000/discs/456 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "speed": 11
  }'
```

## Custom Disc Modifications

### Flight Number Customization
Users can customize flight numbers for several reasons:
- **Wear Patterns**: Discs change flight characteristics with use
- **Personal Experience**: Individual throwing style affects flight
- **Weather Conditions**: Flight numbers vary with wind/altitude
- **Custom Modifications**: Physical modifications change flight

### Brand/Model Overrides
Useful for:
- **Custom Stamps**: Special edition or tournament discs
- **Prototypes**: Unreleased or test discs
- **Modifications**: Significantly altered discs
- **Personal Names**: Nickname or custom naming

## Use Cases
- **Disc Seasoning**: Update flight numbers as disc becomes more understable
- **Personal Tuning**: Adjust numbers based on individual experience
- **Custom Discs**: Name and rate custom or modified discs
- **Tournament Preparation**: Fine-tune disc ratings for specific conditions
- **Collection Management**: Maintain accurate personal disc database

## Business Rules
- **Owner Only**: Users can only edit discs in their own bags
- **Partial Updates**: Any combination of fields can be updated
- **Range Validation**: Flight numbers must be within official ranges
- **String Limits**: Brand/model names have character limits
- **Authorization Required**: Must own bag to edit its contents

## Security Features
- **Authentication Required**: Bearer token validation
- **Authorization Verification**: Confirms user owns the bag
- **Input Validation**: Comprehensive validation of all fields
- **SQL Injection Protection**: Parameterized queries
- **Range Enforcement**: Prevents invalid flight number values

## Validation Details

### Flight Number Ranges
Based on official disc golf standards:
- **Speed 1-3**: Putters (approach and putting)
- **Speed 4-5**: Midrange discs (control and accuracy)
- **Speed 6-8**: Fairway drivers (controlled distance)
- **Speed 9-15**: Distance drivers (maximum distance)

### Turn/Fade Relationship
- **High Speed, Low Turn**: Stable distance drivers
- **Low Speed, High Turn**: Understable control discs
- **High Fade**: Reliable finish direction
- **Low Fade**: Straight finishing flight

## Related Endpoints
- **[POST /api/bags/:id/discs](./POST_bags_id_discs.md)** - Add disc to bag
- **[DELETE /api/bags/discs/:contentId](./DELETE_bags_discs_contentId.md)** - Remove disc from bag
- **[PATCH /api/bags/discs/:contentId/lost](./PATCH_bags_discs_contentId_lost.md)** - Mark disc as lost/found
- **[GET /api/bags/:id](./GET_bags_id.md)** - View bag with updated disc
- **[PUT /api/bags/discs/move](./PUT_bags_discs_move.md)** - Move disc between bags