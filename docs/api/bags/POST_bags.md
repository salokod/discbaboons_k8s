# POST /api/bags

## Overview
Creates a new disc golf bag for the authenticated user.

## Endpoint
```
POST /api/bags
```

## Authentication
**Required**: Bearer token in Authorization header.

## Request Body
```json
{
  "name": "string",
  "description": "string",  // Optional
  "is_public": boolean,     // Optional, defaults to false
  "is_friends_visible": boolean  // Optional, defaults to false
}
```

### Field Requirements

| Field | Type | Required | Constraints | Default |
|-------|------|----------|-------------|---------|
| `name` | string | Yes | 1-100 characters, unique per user | - |
| `description` | string | No | Max 500 characters | null |
| `is_public` | boolean | No | true/false | false |
| `is_friends_visible` | boolean | No | true/false | false |

### Validation Rules
- **Name uniqueness**: Case-insensitive unique constraint per user
- **Name length**: 1-100 characters
- **Description length**: Max 500 characters (if provided)
- **Boolean validation**: `is_public` and `is_friends_visible` must be valid booleans

## Response

### Success (201 Created)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": 123,
  "name": "Tournament Bag",
  "description": "My main tournament setup",
  "is_public": false,
  "is_friends_visible": true,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "error": "ValidationError",
  "message": "Bag name is required"
}
```

**Possible validation messages:**
- "userId is required"
- "Bag name is required"
- "Bag name must be 100 characters or less"
- "Description must be 500 characters or less"
- "is_public must be a boolean"
- "is_friends_visible must be a boolean"
- "Bag with this name already exists for this user"

#### 401 Unauthorized
```json
{
  "error": "UnauthorizedError",
  "message": "Access token required"
}
```

## Service Implementation
**File:** `services/bags.create.service.js`

### Key Features
- Input validation for all fields
- Case-insensitive duplicate name checking
- Default value handling for boolean fields
- User association via authenticated userId
- Length constraints for name and description

### Security Features
- **User Isolation**: Bags are tied to authenticated user only
- **Name Uniqueness**: Prevents duplicate bag names per user (case-insensitive)
- **Input Validation**: Strict validation of all input fields

### Database Operations
- Duplicate check: `SELECT id FROM bags WHERE user_id = $1 AND LOWER(name) = LOWER($2)`
- Create bag: `INSERT INTO bags (user_id, name, description, is_public, is_friends_visible) VALUES (...)`

## Example Usage

### Minimal Bag Creation
```bash
curl -X POST http://localhost:3000/api/bags \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Bag"
  }'
```

### Full Bag Creation
```bash
curl -X POST http://localhost:3000/api/bags \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tournament Bag",
    "description": "My competitive disc golf setup for tournaments",
    "is_public": false,
    "is_friends_visible": true
  }'
```

### Invalid Request (Duplicate Name)
```bash
curl -X POST http://localhost:3000/api/bags \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "tournament bag"  // Case-insensitive duplicate
  }'
```

## Visibility Settings

### Privacy Options
- **Private** (`is_public: false`, `is_friends_visible: false`): Only visible to owner
- **Friends Only** (`is_public: false`, `is_friends_visible: true`): Visible to friends
- **Public** (`is_public: true`): Visible to everyone

### Use Cases
- **Tournament Bag**: Often friends-visible to share setups
- **Practice Bag**: Often private for experimenting
- **Showcase Bag**: Public for demonstrating disc combinations

## Related Endpoints
- **[GET /api/bags](./GET_bags.md)** - List user's bags
- **[GET /api/bags/:id](./GET_bags_id.md)** - Get specific bag
- **[PUT /api/bags/:id](./PUT_bags_id.md)** - Update bag
- **[DELETE /api/bags/:id](./DELETE_bags_id.md)** - Delete bag
- **[POST /api/bags/:id/discs](./POST_bags_id_discs.md)** - Add discs to bag