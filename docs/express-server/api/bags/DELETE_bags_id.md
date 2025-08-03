# DELETE /api/bags/:id

## Overview
Permanently deletes a bag and all its contents. Only the bag owner can delete their bags. This action cannot be undone.

## Endpoint
```
DELETE /api/bags/:id
```

## Authentication
**Required**: Bearer token in Authorization header.

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Unique identifier of the bag to delete |

## Response

### Success (200 OK)
```json
{
  "success": true,
  "message": "Bag deleted successfully"
}
```

### Error Responses

#### 400 Bad Request - Validation Errors
```json
{
  "error": "ValidationError",
  "message": "bagId is required"
}
```

**Possible validation messages:**
- "userId is required"
- "bagId is required"

#### 401 Unauthorized
```json
{
  "error": "UnauthorizedError",
  "message": "Access token required"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Bag not found"
}
```

## Service Implementation
**File:** `services/bags.delete.service.js`

### Key Features
- **Owner Validation**: Ensures user owns the bag before deletion
- **UUID Validation**: Validates bag ID format before database query
- **Cascade Deletion**: Database handles deletion of bag contents via foreign key constraints
- **Safe Deletion**: Only deletes if user owns the bag

### Deletion Logic
1. **Input Validation**: Validates user ID and bag ID
2. **UUID Format Check**: Validates bag ID is proper UUID format
3. **Owner Verification**: Deletes only if user owns the bag
4. **Cascade Handling**: Database automatically deletes related bag contents

### Database Operations
- Delete with ownership check: `DELETE FROM bags WHERE id = $1 AND user_id = $2`
- Automatic cascade: Related `bag_contents` records deleted by foreign key constraints

## Example Usage

### Delete Bag
```bash
curl -X DELETE http://localhost:3000/api/bags/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Response
```json
{
  "success": true,
  "message": "Bag deleted successfully"
}
```

## Deletion Effects

### Immediate Effects
- **Bag Removal**: Bag permanently deleted from database
- **Content Deletion**: All discs in bag automatically removed
- **Privacy Changes**: Bag no longer visible to friends/public
- **Search Removal**: Bag no longer appears in any searches

### Cascade Deletion
Database foreign key constraints automatically handle:
- **Bag Contents**: All `bag_contents` records for the bag
- **Related Data**: Any other data referencing the bag

### Irreversible Action
- **No Recovery**: Deleted bags cannot be restored
- **Data Loss**: All bag contents and metadata permanently lost
- **User Responsibility**: Users should be warned about permanent deletion

## UUID Validation

### Format Checking
```javascript
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
```

### Benefits
- **Early Validation**: Prevents invalid database queries
- **Performance**: Avoids unnecessary database calls
- **Security**: Prevents potential injection attempts
- **User Experience**: Clear error for malformed IDs

## Use Cases
- **Bag Cleanup**: Remove unused or old bags
- **Seasonal Management**: Delete temporary tournament bags
- **Privacy Management**: Remove bags no longer wanted
- **Account Cleanup**: Clean up before account deletion
- **Mistake Correction**: Remove incorrectly created bags

## Business Rules
- **Owner Only**: Users can only delete their own bags
- **Permanent Action**: No undo functionality available
- **Cascade Deletion**: All bag contents automatically deleted
- **UUID Validation**: Bag ID must be valid UUID format

## Security Features
- **Authentication Required**: Bearer token validation
- **Owner Verification**: Can only delete own bags
- **SQL Injection Protection**: Parameterized queries
- **UUID Validation**: Prevents invalid ID injection
- **User Isolation**: Strictly enforced ownership

## Safety Considerations

### Data Loss Prevention
- **User Confirmation**: Frontend should confirm deletion
- **Clear Warnings**: Users should understand permanence
- **Alternative Actions**: Consider archiving vs deletion
- **Backup Strategy**: Consider soft deletion for recovery

### Database Integrity
- **Foreign Key Constraints**: Ensure cascade deletion works properly
- **Transaction Safety**: Database handles deletion atomically
- **Constraint Violations**: Proper error handling for conflicts

## Performance Considerations
- **Simple Operation**: Single DELETE query with ownership check
- **Cascade Efficiency**: Database handles related record deletion
- **Minimal Load**: Operation completes quickly
- **Index Usage**: Uses primary key and user_id indexes

## Related Endpoints
- **[GET /api/bags/:id](./GET_bags_id.md)** - Get bag details before deletion
- **[PUT /api/bags/:id](./PUT_bags_id.md)** - Update bag (alternative to deletion)
- **[GET /api/bags](./GET_bags.md)** - List remaining bags after deletion
- **[POST /api/bags](./POST_bags.md)** - Create new bag to replace deleted one
- **[POST /api/bags/:id/discs](./POST_bags_id_discs.md)** - Add discs (unavailable after deletion)

## Alternative Actions
Instead of deletion, consider:
- **Privacy Update**: Make bag private instead of deleting
- **Archive Flag**: Add archive functionality for soft deletion
- **Content Transfer**: Move discs to another bag before deletion
- **Backup Export**: Export bag data before deletion