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
  "holeNumber": "integer (required for hole bets, forbidden for round bets)",
  "participants": "array of player UUIDs (required)"
}
```

#### Field Descriptions
- **name** (required): Display name for the side bet (max 200 characters)
- **amount** (required): Dollar amount for the bet (must be positive, up to 2 decimal places)
- **betType** (required): Type of bet, must be either "hole" or "round"
- **description** (optional): Additional details about the bet
- **holeNumber** (conditional): Required for "hole" bets, must be omitted for "round" bets (1-50)
- **participants** (required): Array of round_players.id UUIDs to include in the bet. Must contain at least 2 participants (bets cannot be made with yourself). All participants must be valid round players.

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

```json
{
  "success": false,
  "message": "All participants must be players in this round"
}
```

```json
{
  "success": false,
  "message": "Participants array is required"
}
```

```json
{
  "success": false,
  "message": "At least 2 participants are required for a bet"
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
- **Required Participants**: `participants` array is required - specify all players who will be in the bet
- **Creator Inclusion**: Creator should be included in the `participants` array (not added automatically)
- **Atomic Creation**: Bet and all participants are added in a single database transaction
- **Multiple Bets**: Multiple bets of the same type are allowed
- **Bet Types**: Must be either "hole" (resolved during/after specific hole) or "round" (resolved at end of round)
- **Hole Validation**: "hole" bets require holeNumber, "round" bets must not include holeNumber

### Bet Participation
- **Creation-Time Only**: All participants must be specified when creating the bet
- **Participant Validation**: All participant UUIDs must be valid round_players.id values
- **No Joining After Creation**: Players cannot join bets after creation (no separate join endpoint)
- **Editing Participants**: Participant list can be modified via PUT endpoint (future feature)
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

### Bet with Specific Participants
```bash
curl -X POST "https://api.discbaboons.com/api/rounds/660f9500-f39c-51e5-b827-557766551111/side-bets" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ace Pool",
    "amount": 20.00,
    "betType": "round",
    "description": "First ace of the round",
    "participants": [
      "770a0600-a40d-62f6-c938-668877662222",
      "880b1700-b51e-73g7-d049-779988773333", 
      "990c2800-c62f-84h8-e15a-88aa99884444"
    ]
  }'
```

## Implementation Notes

- Bet creator is automatically determined from authenticated user
- **Participants Logic**: `participants` array is required and all specified players are added to the bet
- **Atomic Operations**: Bet creation and participant additions happen in a single database transaction
- **Validation**: All participant UUIDs validated against round_players table before bet creation
- **Error Handling**: If any participant is invalid, entire operation is rolled back
- All monetary amounts stored as DECIMAL(10,2) for precision
- Bet types are restricted to "hole" or "round" with corresponding validation rules
- Hole numbers validated against reasonable range (1-50) but not against specific course
- Created timestamp set to current time

## Getting Player UUIDs

To use the `participants` array, you need the round_players.id UUIDs (not user.id). Get these from:
- `GET /api/rounds/:id/players` - Returns all players with their round_players.id values
- `GET /api/rounds/:id` - Includes players array in the round details response

**Important**: Use `round_players.id` (the UUID), not `user_id` (the integer) in the participants array.