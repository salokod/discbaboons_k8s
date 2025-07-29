# GET /api/rounds/:id/scores

Get all scores for a specific round with dynamic par calculation.

## Endpoint
`GET /api/rounds/:id/scores`

## Authentication
Bearer token required. User must be authenticated.

## Rate Limiting
- **Window**: 10 minutes
- **Max Requests**: 100 per IP address
- **Purpose**: Support frequent access during active play
- **Headers**: Standard rate limit headers included in response

## Authorization
User must be a participant in the round (creator or player).

## Path Parameters
- `id` (string, required) - UUID of the round

## Response Format

### Success Response (200 OK)
Returns an object organized by player ID with comprehensive scoring data:

```json
{
  "550e8400-e29b-41d4-a716-446655440001": {
    "username": "john_doe",
    "guestName": null,
    "isGuest": false,
    "holes": {
      "1": {
        "strokes": 4,
        "par": 3,
        "relative": 1
      },
      "2": {
        "strokes": 3,
        "par": 4,
        "relative": -1
      }
    },
    "total": 7,
    "totalPar": 7,
    "relativeScore": 0
  },
  "550e8400-e29b-41d4-a716-446655440002": {
    "username": null,
    "guestName": "Guest Player",
    "isGuest": true,
    "holes": {
      "1": {
        "strokes": 5,
        "par": 3,
        "relative": 2
      }
    },
    "total": 5,
    "totalPar": 3,
    "relativeScore": 2
  }
}
```

### Response Structure
- **Player ID (UUID)**: Each key represents a player's unique ID
  - `username` (string|null) - Username for registered users, null for guests
  - `guestName` (string|null) - Display name for guest players, null for registered users
  - `isGuest` (boolean) - Whether this is a guest player
  - `holes` (object) - Hole-by-hole scoring data
    - **Hole Number**: Each key represents a hole number
      - `strokes` (number) - Number of strokes taken
      - `par` (number) - Par value for this hole (dynamic lookup from round_hole_pars)
      - `relative` (number) - Relative score (strokes - par)
  - `total` (number) - Total strokes across all scored holes
  - `totalPar` (number) - Total par across all scored holes
  - `relativeScore` (number) - Total relative score (total - totalPar)

### Error Responses

#### 400 Bad Request
Invalid round ID format:
```json
{
  "success": false,
  "message": "Round ID must be a valid UUID"
}
```

#### 401 Unauthorized
Missing or invalid authentication token:
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
  "message": "Too many scoring requests, please try again in 10 minutes"
}
```

#### 403 Forbidden
User is not a participant in the round:
```json
{
  "success": false,
  "message": "You must be a participant in this round to view scores"
}
```

#### 404 Not Found
Round does not exist:
```json
{
  "success": false,
  "message": "Round not found"
}
```

## Dynamic Par Calculation
- Par values are retrieved from the `round_hole_pars` table for each hole
- If no explicit par is set for a hole, defaults to par 3 (disc golf standard)
- Changes to hole pars are reflected immediately in score calculations
- Relative scores are calculated dynamically: `strokes - par`

## Empty Scores Handling
- If no scores exist for the round, returns all players with empty `holes` objects
- Total values will be 0 for players without scores
- This allows frontend to display all participants even before scoring begins

## Example Usage

### cURL
```bash
curl -X GET "http://localhost:3000/api/rounds/550e8400-e29b-41d4-a716-446655440000/scores" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript (fetch)
```javascript
const response = await fetch(`/api/rounds/${roundId}/scores`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const scores = await response.json();
```

## Business Rules
1. **Participant Access**: Only round participants can view scores
2. **Dynamic Par**: Par values are always current from round_hole_pars table
3. **Mixed Players**: Supports both registered users and guest players
4. **Complete History**: Shows all scored holes for each player
5. **Real-time**: Reflects latest scores and par changes immediately

## Related Endpoints
- `POST /api/rounds/:id/scores` - Submit scores
- `PUT /api/rounds/:id/holes/:holeNumber/par` - Set hole par
- `GET /api/rounds/:id/pars` - Get all pars
- `GET /api/rounds/:id` - Get round details (includes pars)
- `GET /api/rounds/:id/leaderboard` - Get leaderboard view