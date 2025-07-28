# PUT /api/rounds/:id/side-bets/:betId

Update an existing side bet for a disc golf round, including declaring winners and managing bet status.

## Authentication Required
This endpoint requires authentication via Bearer token.

## Request

### HTTP Method
`PUT`

### URL
`/api/rounds/:id/side-bets/:betId`

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### URL Parameters
- **id** (required): The UUID of the round containing the side bet
- **betId** (required): The UUID of the side bet to update

### Request Body
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "winnerId": "string (optional)"
}
```

#### Field Descriptions
- **name** (optional): Updated display name for the side bet (max 200 characters)
- **description** (optional): Updated additional details about the bet  
- **winnerId** (optional): UUID of the participant who won the bet (side_bet_participants.player_id)
  - Set to a valid participant UUID to **declare winner** (Active → Completed)
  - Set to `null` to **clear winner** and reactivate bet (Completed → Active)
  - Must be a participant in this specific side bet, not just the round

## Response

### Success Response (200 OK)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "round_id": "660f9500-f39c-51e5-b827-557766551111",
  "name": "Updated Bet Name",
  "description": "Updated description of the bet",
  "amount": "10.00",
  "bet_type": "hole",
  "hole_number": 7,
  "created_by_id": "770a0600-a40d-62f6-c938-668877662222",
  "created_at": "2025-01-20T14:30:00.000Z",
  "updated_at": "2025-01-20T15:45:00.000Z",
  "cancelled_at": null,
  "cancelled_by_id": null
}
```

**Note**: Winner information is stored in the `side_bet_participants` table and visible in the `GET /api/rounds/:id/side-bets` response, not in the bet record itself.

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "success": false,
  "message": "Bet ID is required"
}
```

```json
{
  "success": false,
  "message": "Round ID is required"
}
```

```json
{
  "success": false,
  "message": "Update data is required"
}
```

```json
{
  "success": false,
  "message": "Invalid winnerId: player not found in this bet"
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
  "message": "User must be a participant in this round"
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

### Update Permissions
- **Round Participants Only**: Only participants in the round can update side bets
- **Any Participant**: Any round participant can update any side bet (not just the creator)
- **Partial Updates**: Only provided fields will be updated, others remain unchanged
- **Atomic Updates**: All field updates happen in a single database transaction

### Winner Declaration & Bet Status Management
- **Bet Status Transitions**: 
  - **Active → Completed**: Set `winnerId` to a valid participant UUID to declare a winner
  - **Completed → Active**: Set `winnerId` to `null` to clear winner and reactivate bet
- **Mistake Correction Workflow**:
  1. Declare wrong winner: `PUT { "winnerId": "wrong-player-id" }` → Bet completed
  2. Realize mistake: `PUT { "winnerId": null }` → Bet reactivated (back to active)
  3. Declare correct winner: `PUT { "winnerId": "correct-player-id" }` → Bet completed correctly
- **Winner Validation**: 
  - `winnerId` must be a valid participant in this specific side bet
  - Cannot declare someone as winner who isn't participating in the bet
  - Must use `side_bet_participants.player_id` (round_players UUID), not `user_id`
- **Winner Management**: 
  - Only one participant can be winner at a time
  - Setting new winner automatically clears previous winner
  - Winner changes are tracked with timestamps and who declared them
- **Money Calculation**: Winner status affects money flow calculations shown in GET endpoint

### Field Updates
- **Name Updates**: Bet name can be changed at any time
- **Description Updates**: Bet description can be added, updated, or cleared
- **Immutable Fields**: Amount, bet type, and hole number cannot be changed after creation
- **Automatic Timestamp**: updated_at is automatically set to current time

## Example Requests

### Update Bet Name and Description
```bash
curl -X PUT "https://api.discbaboons.com/api/rounds/660f9500-f39c-51e5-b827-557766551111/side-bets/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Closest to Pin",
    "description": "Winner gets closest to the pin on hole 7 - updated rules"
  }'
```

### Declare Winner (Complete Bet)
```bash
curl -X PUT "https://api.discbaboons.com/api/rounds/660f9500-f39c-51e5-b827-557766551111/side-bets/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "winnerId": "880b1700-b51e-73g7-d049-779988773333"
  }'
```

### Reactivate Bet (Clear Winner, Fix Mistakes)
```bash
curl -X PUT "https://api.discbaboons.com/api/rounds/660f9500-f39c-51e5-b827-557766551111/side-bets/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "winnerId": null
  }'
```

### Update Multiple Fields and Declare Winner
```bash
curl -X PUT "https://api.discbaboons.com/api/rounds/660f9500-f39c-51e5-b827-557766551111/side-bets/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Final Ace Pool",
    "description": "First hole-in-one wins the pot - COMPLETED",
    "winnerId": "990c2800-c62f-84h8-e15a-88aa99884444"
  }'
```

### Complete Mistake Correction Workflow
```bash
# Step 1: Realize wrong winner was declared
curl -X PUT "https://api.discbaboons.com/api/rounds/660f9500-f39c-51e5-b827-557766551111/side-bets/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "winnerId": null }'

# Step 2: Declare correct winner
curl -X PUT "https://api.discbaboons.com/api/rounds/660f9500-f39c-51e5-b827-557766551111/side-bets/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "winnerId": "correct-player-id" }'
```

## Implementation Notes

- User authorization verified against round_players table, not side bet creator
- Updates use database transactions to ensure atomicity
- Only provided fields in request body are updated
- updated_at timestamp automatically set on any update
- **Winner Logic**: Uses side_bet_participants table with is_winner, won_at, declared_by_id fields
- **Winner Validation**: Ensures winnerId is a valid participant in the specific side bet
- **Status Transitions**: 
  - Setting winnerId: clears all previous winners, then sets new winner
  - Setting winnerId to null: clears all winners (reactivates bet)
- Money calculations are performed in the GET endpoint, not during winner declaration
- All monetary amounts maintain DECIMAL(10,2) precision
- Winners can be changed multiple times (useful for mistake correction)

## Related Endpoints

- `GET /api/rounds/:id/side-bets` - List all side bets with money calculations and winner information
- `POST /api/rounds/:id/side-bets` - Create new side bet with participants
- `GET /api/rounds/:id/players` - Get round players (use their `id` field for winnerId)

## Getting Player UUIDs for winnerId

To declare a winner, you need the correct `round_players.id` UUID:

```bash
# Get all round players
GET /api/rounds/:id/players

# Response includes player IDs you can use as winnerId
{
  "players": [
    {
      "id": "player-uuid-here",  // ← Use this for winnerId
      "user_id": 123,
      "username": "john_doe",
      "is_guest": false
    }
  ]
}
```

**Important**: Use `round_players.id` (UUID), not `user_id` (integer) for the `winnerId` field.