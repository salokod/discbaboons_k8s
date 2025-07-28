# GET /api/rounds/:id/side-bets/:betId

Get details for a specific side bet in a disc golf round.

## Authentication Required
This endpoint requires authentication via Bearer token.

## Request

### HTTP Method
`GET`

### URL
`/api/rounds/:id/side-bets/:betId`

### Headers
```
Authorization: Bearer <access_token>
```

### URL Parameters
- **id** (required): The UUID of the round containing the side bet
- **betId** (required): The UUID of the specific side bet to retrieve

## Response

### Success Response (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "roundId": "660f9500-f39c-51e5-b827-557766551111",
  "name": "Closest to Pin Hole 7",
  "description": "Winner takes all on hole 7",
  "amount": "10.00",
  "betType": "hole",
  "holeNumber": 7,
  "status": "active",
  "createdById": "770a0600-a40d-62f6-c938-668877662222",
  "createdAt": "2025-01-20T14:30:00.000Z",
  "updatedAt": "2025-01-20T14:30:00.000Z",
  "cancelledAt": null,
  "cancelledById": null,
  "participants": [
    {
      "playerId": "880b1700-b51e-73g7-d049-779988773333",
      "userId": 123,
      "displayName": "john_doe",
      "isWinner": false,
      "wonAt": null,
      "declaredById": null,
      "betAmount": -10.00
    },
    {
      "playerId": "990c2800-c62f-84h8-e15a-88aa99884444",
      "userId": null,
      "displayName": "Guest Player",
      "isWinner": false,
      "wonAt": null,
      "declaredById": null,
      "betAmount": -10.00
    }
  ]
}
```

### Field Descriptions
- **id**: Unique identifier for the side bet
- **roundId**: The round this bet belongs to
- **name**: Display name of the bet
- **description**: Additional details about the bet (optional)
- **amount**: Dollar amount of the bet per participant
- **betType**: Type of bet ("hole" or "round")
- **holeNumber**: Specific hole number (only for "hole" type bets)
- **status**: Current status ("active", "completed", or "cancelled")
- **createdById**: UUID of the round player who created the bet
- **participants**: Array of players participating in the bet
  - **playerId**: UUID of the round player
  - **userId**: Database user ID (null for guests)
  - **displayName**: Username or guest name
  - **isWinner**: Whether this participant won the bet
  - **wonAt**: Timestamp when declared as winner
  - **declaredById**: UUID of player who declared the winner
  - **betAmount**: Financial position (-amount for owed, +amount for winnings)

### Status Determination
- **active**: No winner declared
- **completed**: At least one participant has `isWinner = true`
- **cancelled**: Bet has been cancelled (`cancelledAt` is set)

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid bet ID format"
}
```

```json
{
  "success": false,
  "message": "Invalid round ID format"
}
```

#### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "You must be a participant in this round to view side bets"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Side bet not found"
}
```

## Business Rules

### Access Control
- **Authentication Required**: Must provide valid Bearer token
- **Round Participants Only**: Only players in the round can view side bet details
- **Guest Support**: Guest players (with null userId) are included in participants

### Data Visibility
- **Full Details**: Participants can see all bet information including winner status
- **Winner Information**: Shows who won, when they won, and who declared them winner
- **Dynamic Status**: Status is calculated based on winner presence, not stored

## Example Requests

### Get Active Side Bet
```bash
curl -X GET "https://api.discbaboons.com/api/rounds/660f9500-f39c-51e5-b827-557766551111/side-bets/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Completed Side Bet (with winner)
Response will show:
```json
{
  "status": "completed",
  "participants": [
    {
      "playerId": "880b1700-b51e-73g7-d049-779988773333",
      "userId": 123,
      "displayName": "john_doe",
      "isWinner": true,
      "wonAt": "2025-01-20T15:45:00.000Z",
      "declaredById": "990c2800-c62f-84h8-e15a-88aa99884444",
      "betAmount": 10.00
    },
    {
      "playerId": "990c2800-c62f-84h8-e15a-88aa99884444",
      "userId": 456,
      "displayName": "jane_smith",
      "isWinner": false,
      "wonAt": null,
      "declaredById": null,
      "betAmount": -10.00
    }
  ]
}
```

## Implementation Notes

- Uses `side_bets` and `side_bet_participants` tables with LEFT JOIN for guest support
- Winner information stored in `side_bet_participants` table
- Status calculated dynamically based on participant data
- Validates both bet existence and user round participation
- Returns consistent error format with `success: false` for errors
- Validates UUID format for betId and roundId parameters to prevent 500 errors
- Calculates financial positions: winners show positive amounts, losers show negative

## Related Endpoints

- `GET /api/rounds/:id/side-bets` - List all side bets for a round
- `POST /api/rounds/:id/side-bets` - Create a new side bet
- `PUT /api/rounds/:id/side-bets/:betId` - Update bet or declare winner