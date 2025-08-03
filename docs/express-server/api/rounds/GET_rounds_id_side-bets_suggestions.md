# GET /api/rounds/:id/side-bets/suggestions

Get bet suggestions for creating side bets in a round.

## Authentication
Requires valid JWT token in Authorization header.

## Parameters

### Path Parameters
- `id` (string, required) - Round UUID

## Response

### Success Response (200 OK)
```json
{
  "roundId": "123e4567-e89b-12d3-a456-426614174000",
  "suggestions": [
    {
      "category": "lowest_score",
      "name": "Lowest Score",
      "description": "Player with the lowest total score wins",
      "popularity": 0.85
    },
    {
      "category": "first_birdie",
      "name": "First Birdie", 
      "description": "First player to score under par on any hole",
      "popularity": 0.72
    },
    {
      "category": "closest_to_pin",
      "name": "Closest to Pin",
      "description": "Closest tee shot to the pin on a specific hole",
      "popularity": 0.68
    }
  ]
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Round not found"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "You must be a participant in this round to view side bet suggestions"
}
```

## Response Fields

### Suggestion Object
- `category` (string) - Standardized bet category identifier
- `name` (string) - Human-readable bet name
- `description` (string) - Explanation of how the bet works
- `popularity` (number) - Popularity score between 0 and 1

## Bet Categories

### Auto-Calculable Categories
- `lowest_score` - Total strokes winner
- `first_birdie` - First under par score
- `first_eagle` - First 2+ under par score
- `most_birdies` - Count of under par scores
- `most_pars` - Count of equal to par scores
- `least_bogeys` - Fewest over par scores
- `no_bogeys` - No over par scores
- `best_back_nine` - Best last 9 holes
- `best_front_nine` - Best first 9 holes
- `most_consecutive_pars` - Longest par streak
- `last_to_finish` - Based on score submission time

### Manual Resolution Categories
- `closest_to_pin` - Hole-specific distance measurement
- `longest_drive` - Hole-specific distance measurement
- `custom` - User-defined criteria

## Notes

- Suggestions are currently static but will eventually be personalized based on:
  - Historical bet preferences
  - Round participants' playing history
  - Course characteristics
- Popularity scores indicate how often each bet type is used
- Categories enable future analytics and automated resolution