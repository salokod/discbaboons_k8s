# POST /api/rounds/:id/players - Add Players to Round (Batch)

Add one or more players (registered users or guests) to an existing round in a single atomic operation.

## Authentication Required
This endpoint requires authentication via Bearer token.

## Rate Limiting
- **Window**: 10 minutes
- **Max Requests**: 30 per IP address
- **Purpose**: Moderate limits for player management operations
- **Headers**: Standard rate limit headers included in response

## Request Size Limit
- **Maximum**: 50KB
- **Applies to**: Request body
- **Error**: Returns 413 Payload Too Large if exceeded

## Request

### HTTP Method
`POST`

### URL
`/api/rounds/:id/players`

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### URL Parameters
- **id** (required): The UUID of the round to add players to

### Request Body
You must provide a `players` array with at least one player object:

```json
{
  "players": [
    { "userId": 123 },
    { "guestName": "John Doe" },
    { "userId": 456 }
  ]
}
```

#### Player Object Fields
Each player object must have **exactly one** of these fields:
- **userId** (integer): ID of a registered user to add to the round
- **guestName** (string): Name of a guest player (for non-registered users)

## Response

### Success Response (201 Created)
Returns an array of all successfully added players:

```json
[
  {
    "id": "660f9500-f3ac-52e5-b827-557766551111",
    "round_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": 123,
    "guest_name": null,
    "is_guest": false,
    "joined_at": "2025-01-20T15:30:00.000Z"
  },
  {
    "id": "770a0600-a4bd-63f6-c938-668877662222",
    "round_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": null,
    "guest_name": "John Doe",
    "is_guest": true,
    "joined_at": "2025-01-20T15:30:00.000Z"
  },
  {
    "id": "880b1700-b5ce-74a7-d049-779988773333",
    "round_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": 456,
    "guest_name": null,
    "is_guest": false,
    "joined_at": "2025-01-20T15:30:00.000Z"
  }
]
```

### Error Responses

#### 400 Bad Request - Missing/Invalid Players Array
```json
{
  "success": false,
  "message": "Players array is required and must contain at least one player"
}
```

#### 400 Bad Request - Invalid Player Data
```json
{
  "success": false,
  "message": "Player at index 0 must include either userId or guestName"
}
```

#### 400 Bad Request - Both Fields Provided
```json
{
  "success": false,
  "message": "Player at index 0 cannot have both userId and guestName"
}
```

#### 400 Bad Request - Duplicate Users in Batch
```json
{
  "success": false,
  "message": "Duplicate userId 123 found in players array"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

#### 413 Payload Too Large
```json
{
  "success": false,
  "message": "Request payload too large. Maximum size is 50KB."
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many player management requests, please try again in 10 minutes"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "You must be the round creator or a player to add new players"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Round not found"
}
```

#### 409 Conflict
```json
{
  "success": false,
  "message": "User 123 is already a player in this round"
}
```

## Business Rules

### Authorization
- **Round Creator**: Can add any players to their round
- **Existing Players**: Can add other players to rounds they're already in
- **Other Users**: Cannot add players to rounds they're not involved with

### Atomic Operation
- **All or Nothing**: All players in the batch are added together or none are added
- **Transaction Safety**: Uses database transactions to ensure consistency
- **Error Handling**: If any player addition fails, the entire operation is rolled back

### Player Types
- **Registered Users**: Must provide valid `userId` of an existing user
- **Guest Players**: Must provide `guestName` (string, no user account required)
- **Mutual Exclusion**: Cannot provide both `userId` and `guestName` for the same player

### Duplicate Prevention
- **Within Batch**: Cannot have duplicate `userId` values in the same request
- **Against Existing**: Cannot add a user who is already a player in the round
- **Guest Players**: Can add multiple guests with the same name (no duplicate checking)

### Auto-Join
- **No Invitations**: Players are automatically added to the round (no acceptance required)
- **Immediate Access**: Players can participate in the round immediately after being added

## Example Requests

### Add Single Registered User
```bash
curl -X POST "https://api.discbaboons.com/api/rounds/550e8400-e29b-41d4-a716-446655440000/players" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "players": [
      {"userId": 123}
    ]
  }'
```

### Add Single Guest Player
```bash
curl -X POST "https://api.discbaboons.com/api/rounds/550e8400-e29b-41d4-a716-446655440000/players" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "players": [
      {"guestName": "John Doe"}
    ]
  }'
```

### Add Multiple Players (Mixed)
```bash
curl -X POST "https://api.discbaboons.com/api/rounds/550e8400-e29b-41d4-a716-446655440000/players" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "players": [
      {"userId": 123},
      {"guestName": "John Doe"},
      {"userId": 456},
      {"guestName": "Jane Smith"}
    ]
  }'
```

## Common Use Cases

### Adding Multiple Friends to Round
```json
{
  "players": [
    {"userId": 456},
    {"userId": 789},
    {"userId": 101}
  ]
}
```

### Adding Mix of Friends and Walk-Up Players
```json
{
  "players": [
    {"userId": 456},
    {"guestName": "Mike from the parking lot"},
    {"guestName": "Sarah (friend's cousin)"}
  ]
}
```

### Adding Tournament Group
```json
{
  "players": [
    {"userId": 123},
    {"userId": 456},
    {"userId": 789},
    {"userId": 101}
  ]
}
```

## Migration from Single Player API

### Old Single Player Format (Deprecated)
```json
{"userId": 123}
```

### New Batch Format
```json
{
  "players": [
    {"userId": 123}
  ]
}
```

## Implementation Notes

- Players are added with `joined_at` timestamp set to current time
- Guest players have no access to the round outside of being tracked for scoring
- Round creators are automatically added as players when the round is created (no need to add themselves)
- Maximum player limit is not enforced (let users manage their own group sizes)
- Database constraints prevent duplicate user entries but allow multiple guests with same name
- All operations are performed within a single database transaction
- Player order in response matches the order in the request
- Timestamps are returned in ISO 8601 format

## Performance Considerations

- **Batch Size**: No hard limit, but consider practical limits for UX (recommend max 10-20 players per request)
- **Database Performance**: Uses efficient bulk operations within transactions
- **Response Time**: Scales linearly with number of players being added

## Error Recovery

If a batch operation fails:
1. **Check Error Message**: Specific validation errors will indicate which player(s) caused the failure
2. **Fix Invalid Data**: Correct the player data and retry
3. **Retry Strategy**: Safe to retry the entire batch operation as it's idempotent for valid data