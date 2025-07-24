# POST /api/rounds/:id/scores

Submit or update scores for players in a round. Supports batch submission of multiple scores and allows retroactive score changes.

## Authentication
Requires authentication via Bearer token in Authorization header.

## Permissions
Only round participants can submit scores:
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
```json
{
  "scores": [
    {
      "playerId": "987fcdeb-51a2-43d1-b789-123456789abc",
      "holeNumber": 1,
      "strokes": 3
    },
    {
      "playerId": "456e7890-12d3-45a6-b789-987654321fed", 
      "holeNumber": 1,
      "strokes": 4
    },
    {
      "playerId": "987fcdeb-51a2-43d1-b789-123456789abc",
      "holeNumber": 2,
      "strokes": 5
    }
  ]
}
```

#### Request Fields
- `scores` (required): Array of score objects
  - `playerId` (required): UUID of the player (from round_players table)
  - `holeNumber` (required): Integer between 1 and course hole count
  - `strokes` (required): Integer between 1 and 20

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "scoresSubmitted": 3
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
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
  "message": "Scores array is required"
}
```

```json
{
  "success": false,
  "message": "Scores array cannot be empty"
}
```

```json
{
  "success": false,
  "message": "Player ID must be a valid UUID"
}
```

```json
{
  "success": false,
  "message": "Hole number must be between 1 and 50"
}
```

```json
{
  "success": false,
  "message": "Hole number cannot exceed course hole count (18)"
}
```

```json
{
  "success": false,
  "message": "Strokes must be between 1 and 20"
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
  "message": "Permission denied: User is not a participant in this round"
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

### Submit multiple scores for different players
```bash
curl -X POST "https://api.example.com/api/rounds/123e4567-e89b-12d3-a456-426614174000/scores" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "scores": [
      {
        "playerId": "987fcdeb-51a2-43d1-b789-123456789abc",
        "holeNumber": 1,
        "strokes": 3
      },
      {
        "playerId": "456e7890-12d3-45a6-b789-987654321fed",
        "holeNumber": 1, 
        "strokes": 4
      }
    ]
  }'
```

### Update existing score (retroactive change)
```bash
curl -X POST "https://api.example.com/api/rounds/123e4567-e89b-12d3-a456-426614174000/scores" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "scores": [
      {
        "playerId": "987fcdeb-51a2-43d1-b789-123456789abc",
        "holeNumber": 5,
        "strokes": 6
      }
    ]
  }'
```

## Business Rules

### Score Submission
- **Batch API**: Submit multiple scores in a single request for better performance
- **Upsert Logic**: New scores are inserted, existing scores are updated (based on round_id + player_id + hole_number)
- **Retroactive Changes**: Players can update scores from previous holes at any time
- **No Par Field**: Scores only store strokes; par values are looked up dynamically from round_hole_pars table

### Validation Rules
- Round must exist and requesting user must be a participant
- Player IDs must be valid UUIDs from the round_players table
- Hole numbers must be within course hole count (1 to course.hole_count)
- Strokes must be realistic (1-20 range)
- All fields are required for each score object

### Database Operations
- Uses upsert (INSERT ... ON CONFLICT DO UPDATE) for efficient score management
- Maintains audit trail with created_at and updated_at timestamps
- No par field stored with scores - calculated dynamically for relative scoring

### Future Enhancements
- **Skins Recalculation**: Score changes will trigger automatic skins recalculation from affected hole forward
- **Real-time Notifications**: Score submissions will notify other players via WebSocket
- **Offline Support**: Scores can be cached locally and synced when connection is restored

## Security Considerations
- Authentication required for all requests
- UUID validation prevents injection attacks
- Permission checks ensure only participants can submit scores
- User ID validation ensures requesting user exists
- Course hole count validation prevents invalid hole numbers

## Related Endpoints
- [GET /api/rounds/:id](./GET_rounds_id.md) - Get round details including pars
- [GET /api/rounds/:id/pars](./GET_rounds_id_pars.md) - Get pars data only
- [PUT /api/rounds/:id/holes/:holeNumber/par](./PUT_rounds_id_holes_holeNumber_par.md) - Set hole par
- [GET /api/rounds/:id/scores](./GET_rounds_id_scores.md) - Get scores with dynamic par lookup (upcoming)
- [GET /api/rounds/:id/leaderboard](./GET_rounds_id_leaderboard.md) - Real-time leaderboard (upcoming)