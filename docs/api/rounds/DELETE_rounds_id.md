# DELETE /api/rounds/:id

Delete an existing round permanently.

## Endpoint
```
DELETE /api/rounds/:id
```

## Authentication
- **Required**: Yes (Bearer token)
- **Permission**: User must be the round creator (stricter than update permission)

## Parameters

### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | The round ID |

### Request Body
No request body is required for this endpoint.

## Request Examples

### Delete a round
```bash
DELETE /api/rounds/123e4567-e89b-12d3-a456-426614174000
```

## Response Examples

### Success Response (200 OK)
```json
{
  "success": true
}
```

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
  "error": "Access token required"
}
```

### 403 Forbidden - Not the Round Creator
```json
{
  "success": false,
  "message": "Permission denied: Only the round creator can delete the round"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Round not found"
}
```

## Business Rules

### Permissions
- Only the round creator can delete a round
- A user is the round creator if their user ID matches the `created_by_id` field
- This is stricter than the update permission (which allows any participant to edit)

### Deletion Behavior
- **Hard Delete**: The round is permanently removed from the database
- **CASCADE Cleanup**: Related data is automatically deleted:
  - All round players (`round_players` table)
  - All scores for the round (`scores` table) 
  - All side bets for the round (`side_bets` table)
  - All side bet participants (`side_bet_participants` table)
- **Irreversible**: Once deleted, the round and all associated data cannot be recovered

### Validation
- **UUID Format**: Round ID must be a valid UUID format
- **Round Existence**: Round must exist in the database
- **Creator Permission**: Only the user who created the round can delete it

## Implementation Notes

### Database Operations
1. Validates round ID format (UUID regex)
2. Checks if round exists and retrieves `created_by_id`
3. Validates user is the round creator
4. Executes `DELETE FROM rounds WHERE id = $1`
5. Database CASCADE constraints handle related data cleanup automatically

### Security Considerations
- UUID format validation prevents injection attacks
- Permission checking ensures only creators can delete rounds
- Authentication required to access endpoint
- Hard delete prevents data recovery (consider carefully before use)

### CASCADE Relationships
The following related data is automatically deleted when a round is deleted:

```sql
-- These tables have CASCADE foreign keys to rounds
round_players      -- All players in the round
scores            -- All scores recorded for the round  
side_bets         -- All side bets created for the round
side_bet_participants -- All participants in side bets
```

## Usage Examples

### JavaScript (using fetch)
```javascript
const deleteRound = async (roundId, token) => {
  const response = await fetch(`/api/rounds/${roundId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const result = await response.json();
  return result; // { success: true }
};
```

### cURL
```bash
curl -X DELETE \
  https://api.example.com/api/rounds/123e4567-e89b-12d3-a456-426614174000 \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

## Design Decisions

### Hard Delete vs Soft Delete
This endpoint implements **hard delete** for the following reasons:
- Simpler implementation (no need for `deleted_at` fields)
- Clear data cleanup (related data is automatically removed)
- No database bloat from "deleted" records
- Matches user expectation that "delete" means permanent removal

### Stricter Permissions
Delete permission is limited to **creators only** (not all participants like update):
- Prevents accidental deletion by any participant
- Maintains data integrity by limiting destructive actions
- Follows principle of least privilege
- Aligns with common user expectations (only the creator should delete)

### CASCADE Cleanup
Database CASCADE foreign keys handle cleanup automatically:
- Ensures referential integrity
- Prevents orphaned records
- Simplifies application logic
- Guarantees complete cleanup even if application logic changes

## Related Endpoints

- `GET /api/rounds/:id` - View round details before deletion
- `PUT /api/rounds/:id` - Update round instead of deleting
- `PUT /api/rounds/:id` with `status: 'cancelled'` - Cancel round without deleting