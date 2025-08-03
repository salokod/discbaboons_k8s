# GET /api/rounds/:id/skins

Get skins calculation results for a round.

## Authentication
**Required**: Bearer token

## Rate Limiting
- **Window**: 10 minutes
- **Max Requests**: 100 per IP address
- **Purpose**: Prevent excessive skins data requests
- **Headers**: Standard rate limit headers included in response

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
      "carriedOver": 0
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
      "totalValue": "5.00",
      "moneyIn": 5,
      "moneyOut": -5,
      "total": 0
    },
    "player2-uuid": {
      "skinsWon": 2,
      "totalValue": "10.00",
      "moneyIn": 10,
      "moneyOut": -5,
      "total": 5
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
- `carriedOver` (number): **Number of skins carried INTO this hole from previous ties**

#### Player Summary Object
Each player UUID (as string key) contains:
- `skinsWon` (number): Total number of holes won by this player
- `totalValue` (string): Total dollar value won by this player
- `moneyIn` (number): Money received from winning skins
- `moneyOut` (number): Money paid when losing holes (negative values)
- `total` (number): Net running balance (moneyIn + moneyOut)

## Error Responses

### 401 Unauthorized
**Condition**: No authentication token provided

**Content**:
```json
{
  "success": false,
  "message": "Access token required"
}
```

### 429 Too Many Requests
**Condition**: Rate limit exceeded

**Content**:
```json
{
  "success": false,
  "message": "Too many skins requests, please try again in 10 minutes"
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

#### Invalid round ID format
**Condition**: Round ID is not a valid UUID

**Content**:
```json
{
  "success": false,
  "message": "Round ID must be a valid UUID"
}
```

#### Skins not enabled
**Condition**: Skins are not enabled for this round

**Content**:
```json
{
  "success": false,
  "message": "Skins are not enabled for this round"
}
```

## Business Logic

### Skins Game Rules
1. **Winner Detection**: Player with lowest score on each hole wins
2. **Tie Handling**: When players tie, skins carry over to the next hole
   - **Critical**: No money changes hands on tied holes - skins just accumulate
3. **Carry-Over Accumulation**: Multiple ties cause skins to stack (e.g., $5 + $5 = $10)
4. **Payment Logic**: When someone wins with carry-over, losers pay for ALL accumulated skins
5. **Sequential Processing**: Holes are processed in starting_hole order for proper carry-over logic
6. **Non-Hole-1 Starting Support**: Rounds starting on any hole (e.g., hole 5) process correctly
   - **Play Order**: Follows starting_hole sequence (5→6→7→8→9→1→2→3 for hole-5 start)
   - **Carry-Over Boundary**: Skins properly carry from hole 9 to hole 1 in the sequence
   - **Display Accuracy**: `carriedOver` field shows actual skins carried INTO each hole

### Money Tracking (Running Balance System) ✅ **UPDATED 2024**
The money tracking system uses a simple flow-based approach for clear visibility:

**Money Flow Fields**:
- `moneyIn` (number): Money received from winning skins
- `moneyOut` (number): Money paid when losing holes (negative values)  
- `total` (number): Net running balance (moneyIn + moneyOut)

**Mathematical Balance**: The sum of all players' `total` values equals zero (money doesn't disappear)

**Examples**:
- 3 players, $5 skins, Player A wins hole with 2 carry-over: A gets +$30, others pay -$15 each
- Total check: +$30 + (-$15) + (-$15) = $0 ✅
- Individual balances can be positive or negative, but round total always balances

### Carry-Over Field Details
The `carriedOver` field represents **skins carried INTO the current hole**, not skins generated by it:

**Example - Sequential Ties:**
- Hole 1: Tie → `carriedOver: 0` (no skins brought in), generates 1 skin for hole 2
- Hole 2: Tie → `carriedOver: 1` (1 skin brought in from hole 1), generates 2 total for hole 3  
- Hole 3: Winner → `carriedOver: 2` (2 skins brought in), wins total of 3 skins ($15.00 at $5/hole)

**Example - Hole 5 Start:**
- Hole 9: Tie → `carriedOver: 0`, generates 1 skin for hole 1
- Hole 1: Tie → `carriedOver: 1`, generates 2 total for hole 2
- Hole 2: Tie → `carriedOver: 2`, generates 3 total for hole 3
- Hole 3: Winner → `carriedOver: 3`, wins 4 total skins

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

## Recent Updates

### Carry-Over Display Fix (2024)
**Issue**: The `carriedOver` field previously showed `1` for all tied holes, regardless of how many skins were actually carried into that hole.

**Fix**: Updated the skins calculation logic to properly track and display the number of skins carried INTO each hole:
- Tied holes now show `carriedOver: 0` if no skins were brought in (first tie in sequence)  
- Subsequent tied holes show the actual accumulated carry-over amount
- Winner holes display the total skins that were carried in for that victory

**Impact**: More accurate skins tracking, especially for rounds with multiple consecutive ties or rounds starting on holes other than hole 1.