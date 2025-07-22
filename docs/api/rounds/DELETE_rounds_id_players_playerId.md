# DELETE /api/rounds/:id/players/:playerId

Remove a player from a round.

## Authentication
Requires authentication via Bearer token in Authorization header.

## Permissions
- Round creator can remove any player (except cannot remove themselves)
- Players can remove themselves from the round
- Other players cannot remove each other

## Request

### URL Parameters
- `id` (required): Round UUID
- `playerId` (required): Player UUID to remove

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body
None required.

## Response

### Success Response (200 OK)
```json
{
  "success": true
}
```

### Error Responses

#### 400 Bad Request - Invalid Parameters
```json
{
  "success": false,
  "message": "Round ID is required"
}
```

```json
{
  "success": false,
  "message": "Round ID must be a valid UUID"
}
```

```json
{
  "success": false,
  "message": "Player ID is required"
}
```

```json
{
  "success": false,
  "message": "Player ID must be a valid UUID"
}
```

#### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

#### 403 Forbidden - Insufficient Permissions
```json
{
  "success": false,
  "message": "You can only remove yourself or you must be the round creator"
}
```

#### 404 Not Found - Round Not Found
```json
{
  "success": false,
  "message": "Round not found"
}
```

#### 404 Not Found - Player Not Found
```json
{
  "success": false,
  "message": "Player not found in this round"
}
```

## Example Usage

### Remove another player (as round creator)
```bash
curl -X DELETE "https://api.example.com/api/rounds/123e4567-e89b-12d3-a456-426614174000/players/987fcdeb-51a2-43d1-b789-123456789abc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Remove yourself from a round
```bash
curl -X DELETE "https://api.example.com/api/rounds/123e4567-e89b-12d3-a456-426614174000/players/456e7890-12d3-45a6-b789-987654321fed" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Business Rules

### Permission Model
- **Round Creator**: Can remove any player from the round (except themselves)
- **Player Self-Removal**: Any player can remove themselves from the round
- **No Cross-Player Removal**: Players cannot remove other players (only creator can)

### Validation Rules
- Round ID must be a valid UUID format
- Player ID must be a valid UUID format
- Round must exist in the database
- Player must exist in the specified round
- User must have appropriate permissions (creator or self-removal)

### Data Integrity
- Player is permanently removed from the round_players table
- All associated data (scores, side bet participations) should be handled by cascade delete constraints
- Round continues to exist even if all players are removed

## Security Considerations
- Authentication required for all requests
- UUID validation prevents injection attacks
- Permission checks prevent unauthorized player removal
- User ID validation ensures requesting user exists

## Related Endpoints
- [POST /api/rounds/:id/players](./POST_rounds_id_players.md) - Add players to round
- [GET /api/rounds/:id/players](./GET_rounds_id_players.md) - List round players
- [GET /api/rounds](./GET_rounds.md) - List user's rounds
- [POST /api/rounds](./POST_rounds.md) - Create new round