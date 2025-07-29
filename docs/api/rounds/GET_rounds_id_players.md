# GET /api/rounds/:id/players

Get all players in a round, including both registered users and guest players.

## Endpoint
```
GET /api/rounds/:id/players
```

## Authentication
- **Required**: Yes
- **Type**: Bearer token

## Rate Limiting
- **Window**: 10 minutes
- **Max Requests**: 30 per IP address
- **Purpose**: Moderate limits for player management operations
- **Headers**: Standard rate limit headers included in response

## Permission Requirements
- User must be the round creator OR an existing player in the round
- Returns 403 if user doesn't have permission to view players

## Path Parameters
| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| `id`      | string | Yes      | Round ID (UUID)       |

## Response Format

### Success Response (200 OK)
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "round_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": 42,
    "is_guest": false,
    "guest_name": null,
    "joined_at": "2024-01-15T10:30:00.000Z",
    "username": "john_doe"
  },
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "round_id": "123e4567-e89b-12d3-a456-426614174000",
    "user_id": null,
    "is_guest": true,
    "guest_name": "Jane Smith",
    "joined_at": "2024-01-15T10:35:00.000Z",
    "username": null
  }
]
```

### Error Responses

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
  "message": "Too many player management requests, please try again in 10 minutes"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "You must be the round creator or a player to view players"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Round not found"
}
```

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Round ID is required"
}
```

## Response Fields

### Player Object
| Field       | Type    | Description                                    |
|-------------|---------|------------------------------------------------|
| `id`        | string  | Unique player ID (UUID)                       |
| `round_id`  | string  | Round ID this player belongs to               |
| `user_id`   | number  | User ID (null for guest players)              |
| `is_guest`  | boolean | Whether this is a guest player                 |
| `guest_name`| string  | Guest player name (null for registered users) |
| `joined_at` | string  | ISO timestamp when player joined the round    |
| `username`  | string  | Username (null for guest players)             |

## Business Rules

### Player Types
- **Registered Users**: Have `user_id` and `username`, `is_guest` is false
- **Guest Players**: Have `guest_name`, `is_guest` is true, `user_id` and `username` are null

### Ordering
- Players are ordered by `joined_at` timestamp (earliest first)
- Round creator is typically first since they're auto-added at round creation

### Permission Model
- Round creators can always view players
- Players in the round can view other players
- Users not in the round cannot view players (403 error)

## Usage Examples

### Get Round Players
```bash
curl -X GET \
  "https://api.discbaboons.com/api/rounds/123e4567-e89b-12d3-a456-426614174000/players" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Response with Mixed Player Types
```json
[
  {
    "id": "player-uuid-1",
    "round_id": "round-uuid",
    "user_id": 1,
    "is_guest": false,
    "guest_name": null,
    "joined_at": "2024-01-15T10:00:00.000Z",
    "username": "round_creator"
  },
  {
    "id": "player-uuid-2", 
    "round_id": "round-uuid",
    "user_id": 2,
    "is_guest": false,
    "guest_name": null,
    "joined_at": "2024-01-15T10:05:00.000Z",
    "username": "friend_player"
  },
  {
    "id": "player-uuid-3",
    "round_id": "round-uuid", 
    "user_id": null,
    "is_guest": true,
    "guest_name": "My Golf Buddy",
    "joined_at": "2024-01-15T10:10:00.000Z",
    "username": null
  }
]
```

## Related Endpoints
- [POST /api/rounds/:id/players](./POST_rounds_id_players.md) - Add players to round
- [GET /api/rounds](./GET_rounds.md) - List user's rounds
- [POST /api/rounds](./POST_rounds.md) - Create new round

## Implementation Notes
- Uses LEFT JOIN with users table to get usernames
- Performs permission checks before returning data
- Returns empty array if round has no players (though this shouldn't happen since creator is auto-added)
- All timestamps are in ISO 8601 format with UTC timezone