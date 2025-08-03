# DELETE /api/rounds/:id/side-bets/:betId

Cancel a side bet for a round.

## Authentication
Requires valid Bearer token in Authorization header.

## Parameters

### Path Parameters
- `id` (string, required): Round ID (UUID format)
- `betId` (string, required): Side bet ID to cancel (UUID format)

## Authorization
- User must be a participant in the round
- Any round participant can cancel any bet (not just the creator)

## Request

```http
DELETE /api/rounds/123e4567-e89b-12d3-a456-426614174000/side-bets/456e7890-e89b-12d3-a456-426614174001
Authorization: Bearer <token>
```

## Response

### Success Response (200 OK)

```json
{
  "success": true
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access token required"
}
```

#### 400 Bad Request - Invalid UUID Format
```json
{
  "success": false,
  "message": "Invalid bet ID format"
}
```

#### 403 Forbidden - User Not Round Participant
```json
{
  "success": false,
  "message": "User must be a participant in this round"
}
```

#### 404 Not Found - Bet Doesn't Exist or Already Cancelled
```json
{
  "success": false,
  "message": "Side bet not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Behavior

When a bet is successfully cancelled:

1. **Database Changes:**
   - Sets `cancelled_at` to current timestamp
   - Sets `cancelled_by_id` to the round player ID of the user who cancelled
   - Updates `updated_at` timestamp

2. **Financial Impact:**
   - Cancelled bets are excluded from all financial calculations
   - No money changes hands (all participants effectively refunded)
   - Cancelled bets don't appear in leaderboard money summaries

3. **Visibility:**
   - Cancelled bets may still appear in some list endpoints with cancelled status
   - Check individual endpoint documentation for cancelled bet handling

## Validation

- `id` must be a valid UUID format
- `betId` must be a valid UUID format
- User must be authenticated
- User must be a participant in the specified round
- Bet must exist and not already be cancelled
- Bet must belong to the specified round

## Examples

### Cancel a bet successfully
```bash
curl -X DELETE \
  'https://api.discbaboons.com/api/rounds/123e4567-e89b-12d3-a456-426614174000/side-bets/456e7890-e89b-12d3-a456-426614174001' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

### Try to cancel non-existent bet
```bash
curl -X DELETE \
  'https://api.discbaboons.com/api/rounds/123e4567-e89b-12d3-a456-426614174000/side-bets/00000000-0000-0000-0000-000000000000' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'

# Response: 404 Not Found
{
  "success": false,
  "message": "Side bet not found"
}
```

## Rate Limiting
- Uses `roundsSideBetsRateLimit` middleware: 20 requests per hour per IP
- No request size limits (DELETE operations have no request body)

## Implementation Notes
- Uses the same rate limiting as other side bet operations
- Follows RESTful delete semantics (soft delete via timestamp)
- Implements proper transaction handling for data consistency
- Validates user ownership through round participation rather than bet ownership

## Related Endpoints
- `GET /api/rounds/:id/side-bets` - List side bets (shows cancelled status)
- `POST /api/rounds/:id/side-bets` - Create side bet
- `PUT /api/rounds/:id/side-bets/:betId` - Update side bet
- `GET /api/rounds/:id/side-bets/:betId` - Get specific side bet