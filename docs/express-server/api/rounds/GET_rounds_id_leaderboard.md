# GET /api/rounds/:id/leaderboard

Get real-time leaderboard for a round with player rankings, scores, skins information, and side bet summaries.

## Endpoint
```
GET /api/rounds/:id/leaderboard
```

## Authentication
- **Required**: Yes (Bearer token)

## Rate Limiting
- **Window**: 10 minutes
- **Max Requests**: 100 per IP address
- **Purpose**: Prevent excessive leaderboard requests
- **Headers**: Standard rate limit headers included in response

## Parameters

### Path Parameters
- `id` (string, required): Round UUID

## Permissions
- Only round participants (creator or players) can view the leaderboard

## Response Format

### Success Response (200 OK)
```json
{
  "players": [
    {
      "playerId": "550e8400-e29b-41d4-a716-446655440000",
      "username": "johndoe",
      "guestName": null,
      "isGuest": false,
      "position": 1,
      "totalStrokes": 15,
      "totalPar": 18,
      "relativeScore": -3,
      "holesCompleted": 6,
      "currentHole": 7,
      "skinsWon": 0,
      "moneyIn": 0,
      "moneyOut": 0,
      "total": 0,
      "sideBetsWon": 1,
      "sideBetsNetGain": 25.00,
      "overallNetGain": 25.00
    },
    {
      "playerId": "550e8400-e29b-41d4-a716-446655440001",
      "username": null,
      "guestName": "Jane Guest",
      "isGuest": true,
      "position": 2,
      "totalStrokes": 17,
      "totalPar": 15,
      "relativeScore": 2,
      "holesCompleted": 5,
      "currentHole": 6,
      "skinsWon": 0,
      "moneyIn": 0,
      "moneyOut": 0,
      "total": 0,
      "sideBetsWon": 0,
      "sideBetsNetGain": -15.00,
      "overallNetGain": -15.00
    }
  ],
  "roundSettings": {
    "skinsEnabled": true,
    "skinsValue": "5.00",
    "currentCarryOver": 0
  }
}
```

### Response Fields

#### Players Array
Each player object contains:
- `playerId` (string): Player UUID
- `username` (string|null): Username for registered users, null for guests
- `guestName` (string|null): Name for guest players, null for registered users
- `isGuest` (boolean): Whether this is a guest player
- `position` (number): Current leaderboard position (1 = first place)
- `totalStrokes` (number): Total strokes across all completed holes
- `totalPar` (number): Total par across all completed holes
- `relativeScore` (number): Total strokes relative to par (negative = under par)
- `holesCompleted` (number): Number of holes with scores recorded
- `currentHole` (number): Next hole number to play (highest completed + 1)
- `skinsWon` (number): Number of skins won (real-time calculation when skins are enabled)
- `moneyIn` (number): Money won from skins game
- `moneyOut` (number): Money owed/paid from skins game
- `total` (number): Net skins money (moneyIn + moneyOut)
- `sideBetsWon` (number): Number of side bets won by this player
- `sideBetsNetGain` (number): Net profit/loss from all side bets (positive = profit, negative = loss)
- `overallNetGain` (number): Combined net gain from skins and side bets (total + sideBetsNetGain)

#### Round Settings
- `skinsEnabled` (boolean): Whether skins game is enabled for this round
- `skinsValue` (string): Dollar amount per hole for skins game
- `currentCarryOver` (number): Current skins carry-over amount waiting to be won

## Sorting Logic
Players are sorted by:
1. **Primary**: Total strokes (ascending) - lowest score first
2. **Secondary**: Holes completed (descending) - more holes completed = better position when tied

## Error Responses

### 400 Bad Request - Invalid UUID
```json
{
  "success": false,
  "message": "Round ID must be a valid UUID"
}
```

### 401 Unauthorized - Missing Authentication
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many leaderboard requests, please try again in 10 minutes"
}
```

### 403 Forbidden - Not a Participant
```json
{
  "success": false,
  "message": "You must be a participant in this round to view leaderboard"
}
```

### 404 Not Found - Round Not Found
```json
{
  "success": false,
  "message": "Round not found"
}
```

## Example Usage

### Basic Request
```bash
curl -X GET \
  http://localhost:3000/api/rounds/550e8400-e29b-41d4-a716-446655440000/leaderboard \
  -H "Authorization: Bearer your_jwt_token_here"
```

### Example Response - Empty Round
```json
{
  "players": [
    {
      "playerId": "550e8400-e29b-41d4-a716-446655440000",
      "username": "roundcreator",
      "guestName": null,
      "isGuest": false,
      "position": 1,
      "totalStrokes": 0,
      "totalPar": 0,
      "relativeScore": 0,
      "holesCompleted": 0,
      "currentHole": 1,
      "skinsWon": 0,
      "moneyIn": 0,
      "moneyOut": 0,
      "total": 0,
      "sideBetsWon": 0,
      "sideBetsNetGain": 0,
      "overallNetGain": 0
    }
  ],
  "roundSettings": {
    "skinsEnabled": false,
    "skinsValue": null,
    "currentCarryOver": 0
  }
}
```

### Example Response - Active Round
```json
{
  "players": [
    {
      "playerId": "550e8400-e29b-41d4-a716-446655440001",
      "username": null,
      "guestName": "Pro Guest",
      "isGuest": true,
      "position": 1,
      "totalStrokes": 12,
      "totalPar": 15,
      "relativeScore": -3,
      "holesCompleted": 5,
      "currentHole": 6,
      "skinsWon": 3,
      "moneyIn": 15,
      "moneyOut": -20,
      "total": -5,
      "sideBetsWon": 2,
      "sideBetsNetGain": 30.00,
      "overallNetGain": 25.00
    },
    {
      "playerId": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john_player",
      "guestName": null,
      "isGuest": false,
      "position": 2,
      "totalStrokes": 16,
      "totalPar": 15,
      "relativeScore": 1,
      "holesCompleted": 5,
      "currentHole": 6,
      "skinsWon": 0,
      "moneyIn": 0,
      "moneyOut": -12.5,
      "total": -12.5,
      "sideBetsWon": 0,
      "sideBetsNetGain": -20.00,
      "overallNetGain": -32.50
    }
  ],
  "roundSettings": {
    "skinsEnabled": true,
    "skinsValue": "2.50",
    "currentCarryOver": 0
  }
}
```

## Notes

### Skins Integration
This endpoint includes **real-time skins calculation** when skins are enabled:

- **Real-time Calculation**: Skins are calculated dynamically based on current scores
  - `skinsWon` shows actual skins won by each player
  - `moneyIn`/`moneyOut`/`total` display profit/loss for each player
  - `currentCarryOver` displays any skins waiting to be won due to ties
  - Calculations respect the round's starting hole order
  - Carry-over logic automatically accumulates skins from tied holes

- **Graceful Degradation**: If skins calculation encounters issues:
  - Leaderboard continues to function with score data
  - Skins fields default to 0 to prevent disruption
  - No error is thrown to the user

### Side Bet Integration
This endpoint includes **real-time side bet summaries** for comprehensive financial tracking:

- **Real-time Calculation**: Side bet data is calculated dynamically based on current bet status
  - `sideBetsWon` shows number of side bets won by each player
  - `sideBetsNetGain` displays net profit/loss from all side bets
  - `overallNetGain` combines skins and side bet gains for total financial picture
  - Calculations include both completed and active side bets
  - Winner determination is based on current bet declarations

- **Graceful Degradation**: If side bet calculation encounters issues:
  - Leaderboard continues to function with score and skins data
  - Side bet fields default to 0 to prevent disruption
  - No error is thrown to the user

### Real-time Usage
This endpoint is designed for real-time leaderboard updates during rounds:
- Call after each score submission to get updated rankings
- Players can see their current position and progress
- Shows which hole each player is currently on
- Provides complete scoring statistics for analysis

### Performance Considerations
- Results are calculated in real-time from current scores
- No caching implemented yet - consider for high-traffic scenarios
- Efficient sorting algorithm handles ties appropriately
- Database queries are optimized with proper indexing