# GET /api/rounds/:id/pars

Get all par values that have been set for a round.

## Description

Returns an object with hole numbers as keys and par values as values. Only holes that have explicit par values set are included in the response. Holes without par values default to 3 (disc golf standard) but are not included in the response object.

## Endpoint

`GET /api/rounds/:id/pars`

## Authentication

Requires valid JWT token in Authorization header.

## Rate Limiting
- **Window**: 10 minutes
- **Max Requests**: 100 per IP address
- **Purpose**: Prevent excessive scoring-related requests
- **Headers**: Standard rate limit headers included in response

## Parameters

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | The round ID |

## Example Request

```javascript
GET /api/rounds/550e8400-e29b-41d4-a716-446655440000/pars
Authorization: Bearer <jwt_token>
```

## Success Response

**Code:** `200 OK`

```json
{
  "1": 3,
  "2": 4,
  "5": 5,
  "9": 4,
  "18": 3
}
```

### Response Format

- Returns an object where keys are hole numbers (as strings) and values are par values (as integers)
- Only holes with explicitly set par values are included
- Empty object `{}` is returned if no pars have been set for the round

## Error Responses

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

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many scoring requests, please try again in 10 minutes"
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
- Only round participants (creator or players) can view par values
- Non-participants receive a 403 error

### Par Management
- This endpoint only returns explicitly set par values
- Holes without set pars default to 3 in the application but are not returned by this endpoint
- Par values are shared across all players in the round
- Any participant can set/change par values using the PUT endpoint

## Database Query

```sql
SELECT hole_number, par, set_by_player_id, created_at 
FROM round_hole_pars 
WHERE round_id = $1 
ORDER BY hole_number
```

## Use Cases

### Initial Round Setup
When starting a round, fetch existing pars to display:
```javascript
const response = await fetch(`/api/rounds/${roundId}/pars`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const pars = await response.json();
// Returns: { "1": 3, "2": 4, ... } or {} if no pars set
```

### Score Display
Use par values to calculate relative scores:
```javascript
const pars = await getPars(roundId);
const holePar = pars[holeNumber] || 3; // Default to 3 if not set
const relativeScore = strokes - holePar;
```

### Scorecard Rendering
Display pars on scorecard, using defaults for unset holes:
```javascript
const pars = await getPars(roundId);
for (let hole = 1; hole <= 18; hole++) {
  const par = pars[hole] || 3; // Default par 3
  displayHolePar(hole, par);
}
```

## Integration Notes

### Frontend Implementation
- Cache par values locally to avoid repeated API calls
- Update cache when pars are changed via PUT endpoint
- Display default par 3 for holes not in response

### Mobile Considerations
- Lightweight response format minimizes data usage
- Consider bundling with round details to reduce API calls

## Related Endpoints

- `PUT /api/rounds/:id/holes/:holeNumber/par` - Set/update par for a specific hole
- `GET /api/rounds/:id` - Get round details (will include pars in future)
- `POST /api/rounds/:id/scores` - Submit scores (uses par values for calculations)

## Future Enhancements

- Include audit information (who set each par and when)
- Batch par setting endpoint for initial round setup
- Historical par tracking for round analysis

## Version History

- **v1.0** - Initial implementation
- Returns simple key-value object for efficient data transfer
- Foundation for score calculation and display features