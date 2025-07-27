# GET /api/rounds/:id/side-bets

List all side bets for a specific round with player money summary.

## Request

### Route Parameters
- `id` (string, required): The UUID of the round

### Authentication
- Requires valid JWT token
- User must be a participant (creator or player) in the round

## Response

### Success Response (200 OK)
```json
{
  "roundId": "123e4567-e89b-12d3-a456-426614174000",
  "sideBets": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174001",
      "name": "Closest to Pin #3",
      "description": "Whoever gets closest to the pin on hole 3",
      "amount": "5.00",
      "betType": "hole",
      "holeNumber": 3,
      "status": "active",
      "createdById": "uuid-of-creator-player",
      "createdAt": "2025-01-27T10:30:00Z",
      "updatedAt": "2025-01-27T10:30:00Z",
      "cancelledAt": null,
      "cancelledById": null,
      "participants": [
        {
          "playerId": "player-uuid-1",
          "userId": 123,
          "displayName": "John Doe"
        },
        {
          "playerId": "player-uuid-2", 
          "userId": 456,
          "displayName": "Jane Smith"
        }
      ]
    },
    {
      "id": "789e0123-e89b-12d3-a456-426614174002", 
      "name": "Best Round Score",
      "description": null,
      "amount": "10.00",
      "betType": "round",
      "holeNumber": null,
      "status": "cancelled",
      "createdById": "uuid-of-creator-player-2",
      "createdAt": "2025-01-27T09:15:00Z",
      "updatedAt": "2025-01-27T11:45:00Z",
      "cancelledAt": "2025-01-27T11:45:00Z",
      "cancelledById": "uuid-of-canceller-player",
      "participants": [
        {
          "playerId": "player-uuid-1",
          "userId": 123,
          "displayName": "John Doe"
        },
        {
          "playerId": "player-uuid-3",
          "userId": 789,
          "displayName": "Bob Wilson"
        }
      ]
    }
  ],
  "playerSummary": [
    {
      "playerId": "player-uuid-1",
      "userId": 123,
      "displayName": "John Doe",
      "moneyIn": "0.00",
      "moneyOut": "5.00",
      "total": "-5.00",
      "betCount": 1
    },
    {
      "playerId": "player-uuid-2",
      "userId": 456,
      "displayName": "Jane Smith",
      "moneyIn": "0.00",
      "moneyOut": "5.00",
      "total": "-5.00",
      "betCount": 1
    },
    {
      "playerId": "player-uuid-3",
      "userId": 789,
      "displayName": "Bob Wilson",
      "moneyIn": "0.00",
      "moneyOut": "0.00",
      "total": "0.00",
      "betCount": 0
    }
  ]
}
```

### Side Bet Object Properties
- `id` (string): Unique identifier for the side bet
- `name` (string): Name/description of the side bet
- `description` (string|null): Optional detailed description of the bet
- `amount` (string): Monetary amount of the bet (formatted to 2 decimal places)
- `betType` (string): Type of bet - "hole" or "round"
- `holeNumber` (number|null): Specific hole number for hole bets, null for round bets
- `status` (string): Current status - "active" or "cancelled" (completed status requires winner tracking)
- `createdById` (string): UUID of the round_players record for the bet creator
- `createdAt` (string): ISO timestamp when bet was created
- `updatedAt` (string): ISO timestamp when bet was last updated
- `cancelledAt` (string|null): ISO timestamp when bet was cancelled, null if active
- `cancelledById` (string|null): UUID of the round_players record who cancelled the bet
- `participants` (array): Array of participant objects with playerId, userId, and displayName

### Participant Object Properties
- `playerId` (string): UUID of the round_players record
- `userId` (number|null): Integer user ID from users table (null for guest players)
- `displayName` (string): Display name of the participant (username for users, guest_name for guests)

### Player Summary Properties
- `playerId` (string): UUID of the round_players record
- `userId` (number|null): Integer user ID from users table (null for guest players)
- `displayName` (string): Display name of the player (username for users, guest_name for guests)
- `moneyIn` (string): Total amount won by this player from side bets (formatted to 2 decimal places)
- `moneyOut` (string): Total amount at risk by this player in active side bets (formatted to 2 decimal places)
- `total` (string): Net money for this player (moneyIn - moneyOut, formatted to 2 decimal places)
- `betCount` (number): Number of active side bets this player is participating in (excludes cancelled bets)

**Note**: The sum of all player totals will always equal zero, ensuring mathematical balance.

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Round ID must be a valid UUID"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
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
  "message": "Round not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Notes

- Only participants (creator or players) of the round can view side bets
- Side bets are returned in chronological order (oldest first)
- Player summary includes all round players with their money calculations
- Money calculations currently only track money at risk (moneyOut) for active bets
- Status is derived from `cancelled_at` field: null = "active", non-null = "cancelled"
- Winner tracking and completed bet money calculations will be added in future iterations
- The participants array shows all players who are part of each side bet (both registered users and guests)
- Guest players have `userId: null` and display their `guest_name` as `displayName`
- Mathematical balance is maintained across all participants