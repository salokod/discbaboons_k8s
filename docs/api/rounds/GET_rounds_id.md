# GET /api/rounds/:id

Get detailed information about a specific round, including all players and pars data.

## Authentication
Requires authentication via Bearer token in Authorization header.

## Permissions
Only round participants can access round details:
- Round creator (user who created the round)
- Existing players in the round (both registered users and guests)

## Request

### URL Parameters
- `id` (required): Round UUID

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### Request Body
None required.

## Response

### Success Response (200 OK)
Returns the complete round object with embedded players array and pars data.

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "created_by_id": 123,
  "course_id": "adventist-discovery-park",
  "name": "Saturday Morning Round",
  "start_time": "2024-01-15T09:30:00.000Z",
  "starting_hole": 1,
  "is_private": false,
  "skins_enabled": true,
  "skins_value": "5.00",
  "status": "in_progress",
  "created_at": "2024-01-15T09:30:00.000Z",
  "updated_at": "2024-01-15T09:30:00.000Z",
  "players": [
    {
      "id": "987fcdeb-51a2-43d1-b789-123456789abc",
      "round_id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": 123,
      "guest_name": null,
      "is_guest": false,
      "joined_at": "2024-01-15T09:30:00.000Z",
      "username": "john_player"
    },
    {
      "id": "456e7890-12d3-45a6-b789-987654321fed",
      "round_id": "123e4567-e89b-12d3-a456-426614174000",
      "user_id": null,
      "guest_name": "Mike Guest",
      "is_guest": true,
      "joined_at": "2024-01-15T09:35:00.000Z",
      "username": null
    }
  ],
  "pars": {
    "1": 3,
    "2": 4,
    "3": 3,
    "18": 5
  }
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

#### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

#### 403 Forbidden - Not a Participant
```json
{
  "success": false,
  "message": "You must be a participant in this round to view details"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Round not found"
}
```

## Example Usage

### Get round details as creator
```bash
curl -X GET "https://api.example.com/api/rounds/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get round details as participant
```bash
curl -X GET "https://api.example.com/api/rounds/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Response Fields

### Round Fields
- `id`: Unique round identifier (UUID)
- `created_by_id`: User ID of round creator
- `course_id`: Course identifier where round is played
- `name`: Round name/title
- `start_time`: When the round started (set to creation time)
- `starting_hole`: Which hole the round starts on (1-N)
- `is_private`: Whether round is private
- `skins_enabled`: Whether skins game is active
- `skins_value`: Dollar amount per hole for skins (null if disabled)
- `status`: Round status (in_progress, completed, cancelled)
- `created_at`: Round creation timestamp
- `updated_at`: Last modification timestamp

### Player Fields (in players array)
- `id`: Unique player identifier (UUID)
- `round_id`: Round this player belongs to
- `user_id`: User ID (null for guest players)
- `guest_name`: Name for guest players (null for registered users)
- `is_guest`: Whether this is a guest player
- `joined_at`: When player joined the round
- `username`: Username for registered users (null for guests)

### Pars Fields (in pars object)
- Object with hole numbers as keys and par values as values
- Only includes holes where par has been explicitly set
- Empty object `{}` if no pars have been set for any holes
- Example: `{"1": 3, "2": 4, "18": 5}` means hole 1 is par 3, hole 2 is par 4, hole 18 is par 5

## Business Rules

### Access Control
- **Round Creator**: Can always view round details
- **Round Players**: Can view details if they're a participant in the round
- **Non-Participants**: Cannot access round details (403 error)

### Data Completeness
- Returns ALL round fields from the database
- Includes ALL players with both registered users and guests
- Players are ordered by `joined_at` timestamp (earliest first)
- Username is populated via LEFT JOIN with users table
- Includes ALL pars that have been set for the round
- Pars are ordered by hole number

### Validation Rules
- Round ID must be a valid UUID format
- Round must exist in the database
- User must be authenticated
- User must be a participant (creator or player) in the round

## Security Considerations
- Authentication required for all requests
- UUID validation prevents injection attacks
- Permission checks ensure only participants can view details
- User ID validation ensures requesting user exists
- No sensitive information exposed to unauthorized users

## Related Endpoints
- [GET /api/rounds](./GET_rounds.md) - List user's rounds
- [POST /api/rounds](./POST_rounds.md) - Create new round
- [GET /api/rounds/:id/players](./GET_rounds_id_players.md) - List round players only
- [POST /api/rounds/:id/players](./POST_rounds_id_players.md) - Add players to round
- [DELETE /api/rounds/:id/players/:playerId](./DELETE_rounds_id_players_playerId.md) - Remove player from round
- [GET /api/rounds/:id/pars](./GET_rounds_id_pars.md) - Get pars data only
- [PUT /api/rounds/:id/holes/:holeNumber/par](./PUT_rounds_id_holes_holeNumber_par.md) - Set hole par