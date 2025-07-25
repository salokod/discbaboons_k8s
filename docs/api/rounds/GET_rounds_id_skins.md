# GET /api/rounds/:id/skins

Get skins calculation results for a round.

## Authentication
**Required**: Bearer token

## Parameters

### Path Parameters
- `id` (string, required): Round UUID

## Response

### Success Response
**Code**: 200 OK

**Content**:
```json
{
  "roundId": "550e8400-e29b-41d4-a716-446655440000",
  "skinsEnabled": true,
  "skinsValue": "5.00",
  "holes": {
    "1": {
      "winner": "player1-uuid",
      "winnerScore": 3,
      "skinsValue": "5.00",
      "carriedOver": 0
    },
    "2": {
      "winner": null,
      "tied": true,
      "tiedScore": 3,
      "skinsValue": "5.00",
      "carriedOver": 1
    },
    "3": {
      "winner": "player2-uuid",
      "winnerScore": 2,
      "skinsValue": "10.00",
      "carriedOver": 1
    }
  },
  "playerSummary": {
    "player1-uuid": {
      "skinsWon": 1,
      "totalValue": "5.00"
    },
    "player2-uuid": {
      "skinsWon": 1,
      "totalValue": "10.00"
    }
  },
  "totalCarryOver": 0
}
```

### Response Fields

#### Root Level
- `roundId` (string): The round UUID
- `skinsEnabled` (boolean): Whether skins are enabled for this round
- `skinsValue` (string): Dollar value per hole (e.g., "5.00")
- `holes` (object): Hole-by-hole skins results
- `playerSummary` (object): Summary of skins won per player
- `totalCarryOver` (number): Number of skins currently carried over to next hole

#### Holes Object
Each hole number (as string key) contains:
- `winner` (string|null): Player UUID who won the hole, or null for ties
- `winnerScore` (number): The winning score (only present when winner exists)
- `tied` (boolean): True if the hole was tied (only present for ties)
- `tiedScore` (number): The tied score (only present for ties)
- `skinsValue` (string): Dollar value of skins on this hole (includes carry-over)
- `carriedOver` (number): Number of skins carried over to this hole

#### Player Summary Object
Each player UUID (as string key) contains:
- `skinsWon` (number): Total number of holes won by this player
- `totalValue` (string): Total dollar value won by this player

## Error Responses

### 401 Unauthorized
**Condition**: No authentication token provided

**Content**:
```json
{
  "error": "Access token required"
}
```

### 404 Not Found
**Condition**: Round does not exist

**Content**:
```json
{
  "success": false,
  "message": "Round not found"
}
```

### 403 Forbidden
**Condition**: User is not a participant in the round

**Content**:
```json
{
  "success": false,
  "message": "You must be a participant in this round to view skins"
}
```

### 400 Bad Request
**Condition**: Invalid round ID format

**Content**:
```json
{
  "success": false,
  "message": "Round ID must be a valid UUID"
}
```

## Business Logic

### Skins Game Rules
1. **Winner Detection**: Player with lowest score on each hole wins
2. **Tie Handling**: When players tie, skins carry over to the next hole
3. **Carry-Over Accumulation**: Multiple ties cause skins to stack (e.g., $5 + $5 = $10)
4. **Sequential Processing**: Holes are processed in numerical order for proper carry-over logic

### Permissions
- Only round participants (creator or players) can view skins results
- Both registered users and guest players are included in calculations
- Results are calculated in real-time based on current scores and pars

### Data Dependencies
- Requires scores to be entered for accurate calculations
- Uses current par values from `round_hole_pars` table (defaults to par 3)
- Only includes holes where at least one player has entered a score

## Example Usage

```bash
curl -X GET \
  https://api.discbaboons.com/api/rounds/550e8400-e29b-41d4-a716-446655440000/skins \
  -H 'Authorization: Bearer your-jwt-token'
```

## Notes
- Results are calculated dynamically on each request
- Skins calculations update automatically when scores or pars change
- Empty holes object indicates no scores have been entered yet
- Carry-over logic ensures fair distribution of accumulated skins