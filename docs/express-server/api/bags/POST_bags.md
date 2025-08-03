# POST /api/bags

## Overview
Creates a new disc bag for the authenticated user.

## Endpoint
```
POST /api/bags
```

## Authentication
**Required**: Bearer token in Authorization header.

## Rate Limiting
- **Window**: 1 hour
- **Max Requests**: 20 per IP address
- **Purpose**: Prevent bag creation spam
- **Headers**: Standard rate limit headers included in response

## Request Size Limit
- **Maximum**: 50KB
- **Applies to**: Request body
- **Error**: Returns 413 Payload Too Large if exceeded

## Request Body
```json
{
  "name": "string (required)",
  "description": "string (optional, max 500 chars)",
  "is_public": "boolean (optional, default: false)",
  "is_friends_visible": "boolean (optional, default: false)"
}
```

### Field Descriptions
- **name** (required): Bag name, maximum 100 characters
- **description** (optional): Bag description, maximum 500 characters
- **is_public** (optional): Whether bag is visible to everyone (default: false)
- **is_friends_visible** (optional): Whether bag is visible to friends (default: false)

## Response

### Success (201 Created)
```json
{
  "success": true,
  "bag": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": 123,
    "name": "Tournament Bag",
    "description": "My go-to bag for competitive play",
    "is_public": false,
    "is_friends_visible": true,
    "created_at": "2025-01-31T14:30:00.000Z",
    "updated_at": "2025-01-31T14:30:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "success": false,
  "message": "Bag name is required"
}
```

```json
{
  "success": false,
  "message": "Bag name must be 100 characters or less"
}
```

```json
{
  "success": false,
  "message": "Bag with this name already exists for this user"
}
```

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
  "message": "Request payload too large. Maximum size is 50KB."
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many bag creation requests, please try again in 1 hour"
}
```

## Business Rules

### Bag Creation
- **Name uniqueness**: Bag names must be unique per user (case-insensitive)
- **Immediate creation**: Bags are created immediately and active
- **Default privacy**: New bags are private by default

### Validation Rules
- **Name**: Required, 1-100 characters
- **Description**: Optional, max 500 characters
- **Privacy flags**: Must be boolean values if provided

## Example Requests

### Basic Bag Creation
```bash
curl -X POST "https://api.discbaboons.com/api/bags" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tournament Bag"
  }'
```

### Bag with Description
```bash
curl -X POST "https://api.discbaboons.com/api/bags" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Practice Bag",
    "description": "Lightweight bag for field work and casual rounds"
  }'
```

### Public Bag
```bash
curl -X POST "https://api.discbaboons.com/api/bags" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Signature Disc Setup",
    "description": "My signature disc selection",
    "is_public": true
  }'
```

### Friends-Only Bag
```bash
curl -X POST "https://api.discbaboons.com/api/bags" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Experimental Setup",
    "description": "Testing new disc combinations",
    "is_friends_visible": true
  }'
```

## Privacy Levels

### Bag Visibility Options
- **Private** (`is_public: false, is_friends_visible: false`): Only owner can see
- **Friends Only** (`is_public: false, is_friends_visible: true`): Owner and friends can see  
- **Public** (`is_public: true`): Everyone can see (friends_visible setting ignored)

## Use Cases
- **Tournament Preparation**: Create specific bags for different tournament formats
- **Course-Specific Bags**: Different disc selections for different course types
- **Skill Development**: Practice bags for working on specific shots
- **Sharing**: Public or friends-only bags to share disc recommendations