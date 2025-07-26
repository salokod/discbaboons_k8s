# POST /api/rounds/:id/side-bets

Create a new side bet for a disc golf round.

## Authentication Required
This endpoint requires authentication via Bearer token.

## Request

### HTTP Method
`POST`

### URL
`/api/rounds/:id/side-bets`

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### URL Parameters
- **id** (required): The UUID of the round to create the side bet for

### Request Body
```json
{
  "name": "string (required)",
  "amount": "number (required)",
  "betType": "\"hole\" | \"round\" (required)",
  "description": "string (optional)",
  "holeNumber": "integer (required for hole bets, forbidden for round bets)"
}
```

#### Field Descriptions
- **name** (required): Display name for the side bet (max 200 characters)
- **amount** (required): Dollar amount for the bet (must be positive, up to 2 decimal places)
- **betType** (required): Type of bet, must be either "hole" or "round"
- **description** (optional): Additional details about the bet
- **holeNumber** (conditional): Required for "hole" bets, must be omitted for "round" bets (1-50)

## Response

### Success Response (201 Created)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "round_id": "660f9500-f39c-51e5-b827-557766551111",
  "name": "Closest to Pin Hole 7",
  "description": "Whoever gets closest to the pin on hole 7 wins",
  "amount": "10.00",
  "bet_type": "hole",
  "hole_number": 7,
  "created_by_id": "770a0600-a40d-62f6-c938-668877662222",
  "created_at": "2025-01-20T14:30:00.000Z",
  "updated_at": "2025-01-20T14:30:00.000Z",
  "cancelled_at": null,
  "cancelled_by_id": null
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "success": false,
  "message": "Bet name is required"
}
```

```json
{
  "success": false,
  "message": "Bet amount is required"
}
```

```json
{
  "success": false,
  "message": "Bet amount must be positive"
}
```

```json
{
  "success": false,
  "message": "Bet type is required"
}
```

```json
{
  "success": false,
  "message": "Bet type must be either \"hole\" or \"round\""
}
```

```json
{
  "success": false,
  "message": "Hole number is required for hole bets"
}
```

```json
{
  "success": false,
  "message": "Hole number should not be provided for round bets"
}
```

```json
{
  "success": false,
  "message": "User must be a participant in this round"
}
```

#### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

## Business Rules

### Side Bet Creation
- **Participant Only**: Only round participants can create side bets
- **Auto-Join Creator**: The bet creator is automatically added as a participant
- **Multiple Bets**: Multiple bets of the same type are allowed
- **Bet Types**: Must be either "hole" (resolved during/after specific hole) or "round" (resolved at end of round)
- **Hole Validation**: "hole" bets require holeNumber, "round" bets must not include holeNumber

### Bet Participation
- **Open Joining**: Any round participant can join existing bets
- **No Leaving**: Players cannot leave bets once joined
- **Persistent**: Bets persist even if player is removed from round

### Financial Tracking
- **Pot Calculation**: Total pot = amount × number of participants
- **Winner Declaration**: Anyone can declare/change winners
- **No Pot Splitting**: Single winner takes entire pot
- **Cancellation**: Anyone can cancel bets

## Example Requests

### Round Bet Example
```bash
curl -X POST "https://api.discbaboons.com/api/rounds/660f9500-f39c-51e5-b827-557766551111/side-bets" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Longest Drive",
    "amount": 5.00,
    "betType": "round",
    "description": "Best drive of the entire round"
  }'
```

### Hole-Specific Bet Example
```bash
curl -X POST "https://api.discbaboons.com/api/rounds/660f9500-f39c-51e5-b827-557766551111/side-bets" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Closest to Pin",
    "amount": 10.00,
    "betType": "hole",
    "description": "Closest to the pin on this hole",
    "holeNumber": 7
  }'
```

### Complex Round Bet
```bash
curl -X POST "https://api.discbaboons.com/api/rounds/660f9500-f39c-51e5-b827-557766551111/side-bets" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Most Birdies",
    "amount": 15.00,
    "betType": "round",
    "description": "Player with the most birdies in the round"
  }'
```

## Implementation Notes

- Bet creator is automatically determined from authenticated user
- Creator is auto-joined as participant in the bet
- All monetary amounts stored as DECIMAL(10,2) for precision
- Bet types are restricted to "hole" or "round" with corresponding validation rules
- Hole numbers validated against reasonable range (1-50) but not against specific course
- Transaction used to ensure atomic bet creation and participant addition
- Created timestamp set to current time