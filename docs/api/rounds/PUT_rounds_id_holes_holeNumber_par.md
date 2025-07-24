# PUT /api/rounds/:id/holes/:holeNumber/par

Set or update the par value for a specific hole in a round.

## Description

Any participant in a round can set or update the par value for any hole. This enables dynamic par management during gameplay, allowing players to correct par values as they discover the actual difficulty of each hole.

## Endpoint

`PUT /api/rounds/:id/holes/:holeNumber/par`

## Authentication

Requires valid JWT token in Authorization header.

## Parameters

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | The round ID |
| `holeNumber` | Integer | Yes | The hole number (1-50) |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `par` | Integer | Yes | Par value for the hole (1-10) |

## Example Request

```javascript
PUT /api/rounds/550e8400-e29b-41d4-a716-446655440000/holes/1/par
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "par": 4
}
```

## Success Response

**Code:** `200 OK`

```json
{
  "success": true
}
```

## Error Responses

### 400 Bad Request - Missing Par
```json
{
  "success": false,
  "message": "Par is required"
}
```

### 400 Bad Request - Invalid Par Range
```json
{
  "success": false,
  "message": "Par must be between 1 and 10"
}
```

### 400 Bad Request - Invalid Hole Number
```json
{
  "success": false,
  "message": "Hole number must be between 1 and 50"
}
```

### 400 Bad Request - Hole Number Exceeds Course
```json
{
  "success": false,
  "message": "Hole number cannot exceed course hole count (18)"
}
```

### 400 Bad Request - Invalid UUID
```json
{
  "success": false,
  "message": "Round ID must be a valid UUID"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Access denied. Please log in."
}
```

### 403 Forbidden - Not a Participant
```json
{
  "success": false,
  "message": "Permission denied: User is not a participant in this round"
}
```

### 404 Not Found - Round Not Found
```json
{
  "success": false,
  "message": "Round not found"
}
```

## Business Rules

### Permission Model
- **Any round participant** can set par for any hole
- Round creator and all players have equal par-setting privileges
- Non-participants cannot set par values

### Par Management
- **Default Par**: All holes default to par 3 (disc golf standard)
- **Upsert Behavior**: Creates new par record or updates existing
- **Audit Trail**: Tracks who set/changed each par value with timestamps
- **Real-time Updates**: Par changes take effect immediately

### Validation Rules
- Par value must be between 1 and 10
- Hole number must be between 1 and 50
- **Hole number must not exceed course hole count**
- Round must exist and be accessible
- User must be authenticated and participate in round

## Database Impact

### Tables Modified
- `round_hole_pars`: Creates or updates par record
  - Stores: round_id, hole_number, par, set_by_player_id, timestamps

### Automatic Triggers (Future)
- Score recalculation for affected hole
- Skins recalculation from affected hole forward
- Real-time notifications to other players

## Use Cases

### Setting Initial Par
When players arrive at a hole and determine the appropriate par:
```javascript
// Players reach hole 7 and decide it's a par 4
PUT /api/rounds/abc123/holes/7/par
{ "par": 4 }
```

### Correcting Par During Play
When players realize the par was set incorrectly:
```javascript
// After playing hole 3, realize it should be par 5, not 4
PUT /api/rounds/abc123/holes/3/par
{ "par": 5 }
```

### Course Discovery
For user-submitted courses without known pars:
```javascript
// Setting par for each hole as players experience them
PUT /api/rounds/abc123/holes/1/par  // { "par": 3 }
PUT /api/rounds/abc123/holes/2/par  // { "par": 4 }
PUT /api/rounds/abc123/holes/3/par  // { "par": 3 }
```

## Integration Notes

### Frontend Implementation
- Display current par with edit button
- Allow quick par selection (1-10)
- Show who last set the par and when
- Reflect changes immediately in scorecard

### Mobile Considerations
- Touch-friendly par selection interface
- Offline support with sync when online
- Visual feedback for par changes

## Related Endpoints

- `GET /api/rounds/:id/pars` - Get all round pars
- `POST /api/rounds/:id/scores` - Submit scores (uses current par values)
- `GET /api/rounds/:id/leaderboard` - View leaderboard (calculated with current pars)

## Version History

- **v1.0** - Initial implementation with basic par management
- Supports upsert functionality and audit trail
- Ready for future score/skins recalculation integration