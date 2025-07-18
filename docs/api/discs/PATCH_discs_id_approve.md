# PATCH /api/discs/:id/approve

## Overview
Approves a pending disc submission, making it publicly available in disc searches. This admin-only endpoint is used to moderate user-submitted disc data.

## Endpoint
```
PATCH /api/discs/:id/approve
```

## Authentication
**Required**: Bearer token in Authorization header with admin privileges.

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Unique identifier of the disc to approve |

## Response

### Success (200 OK)
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "brand": "Dynamic Discs",
  "model": "Lucid Truth",
  "speed": 5,
  "glide": 5,
  "turn": 0,
  "fade": 2,
  "approved": true,
  "added_by_id": 456,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T11:00:00.000Z"
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "error": "UnauthorizedError",
  "message": "Access token required"
}
```

#### 403 Forbidden
```json
{
  "error": "AuthorizationError",
  "message": "Admin access required"
}
```

#### 404 Not Found
```json
{
  "error": "NotFoundError",
  "message": "Disc not found"
}
```

## Response Fields

### Approved Disc Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique disc identifier |
| `brand` | string | Disc manufacturer/brand |
| `model` | string | Disc model name |
| `speed` | integer | Flight rating: Speed (1-15) |
| `glide` | integer | Flight rating: Glide (1-7) |
| `turn` | integer | Flight rating: Turn (-5 to 2) |
| `fade` | integer | Flight rating: Fade (0-5) |
| `approved` | boolean | Now true after approval |
| `added_by_id` | integer | User ID who originally submitted the disc |
| `created_at` | string (ISO 8601) | Original submission timestamp |
| `updated_at` | string (ISO 8601) | Approval timestamp |

## Service Implementation
**File:** `services/discs.approve.service.js`

### Key Features
- **Existence Check**: Validates disc exists before approval
- **Simple Approval**: Sets `approved = true` and updates timestamp
- **Admin Only**: Requires admin authorization middleware
- **Immediate Effect**: Approved discs become immediately available in searches

### Database Operations
- Disc lookup: `SELECT * FROM disc_master WHERE id = $1`
- Approval update: `UPDATE disc_master SET approved = true, updated_at = NOW() WHERE id = $1`

## Example Usage

### Approve Pending Disc
```bash
curl -X PATCH http://localhost:3000/api/discs/770e8400-e29b-41d4-a716-446655440000/approve \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

### Response
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "brand": "Dynamic Discs",
  "model": "Lucid Truth",
  "speed": 5,
  "glide": 5,
  "turn": 0,
  "fade": 2,
  "approved": true,
  "added_by_id": 456,
  "created_at": "2024-01-15T10:30:00.000Z",
  "updated_at": "2024-01-15T11:00:00.000Z"
}
```

## Approval Effects

### Immediate Availability
Once approved, the disc becomes available in:
- **[GET /api/discs/master](./GET_discs_master.md)** searches
- **Bag Content Addition**: Users can add approved discs to bags
- **Public Discovery**: Disc appears in filtered searches

### Workflow Integration
1. **User Submission**: User submits disc via **[POST /api/discs/master](./POST_discs_master.md)**
2. **Pending Queue**: Disc appears in **[GET /api/discs/pending](./GET_discs_pending.md)**
3. **Admin Review**: Admin reviews accuracy and legitimacy
4. **Approval**: Admin uses this endpoint to approve
5. **Public Availability**: Disc immediately available to all users

## Admin Responsibilities

### Review Criteria
- **Flight Number Accuracy**: Verify against official specifications
- **Brand/Model Correctness**: Ensure proper naming conventions
- **Duplicate Detection**: Check for existing similar entries
- **Data Quality**: Validate completeness and accuracy

### Quality Control
- **Official Sources**: Cross-reference with manufacturer data
- **Community Standards**: Maintain consistent naming conventions
- **Spam Prevention**: Reject duplicate or invalid submissions
- **Database Integrity**: Ensure high-quality disc database

## Business Rules
- **Admin Authorization Required**: Only admin users can approve discs
- **Irreversible Action**: No built-in way to "unapprove" discs
- **Immediate Effect**: Approval takes effect immediately
- **User Attribution Preserved**: Original submitter credit maintained

## Use Cases
- **Content Moderation**: Approve legitimate disc submissions
- **Database Curation**: Maintain high-quality disc database
- **Community Contributions**: Enable user-driven database growth
- **Quality Assurance**: Ensure accurate flight number data

## Security Features
- **Admin Authorization**: Multiple authorization layers
- **Role-Based Access**: Strictly limited to admin users
- **Existence Validation**: Confirms disc exists before approval
- **SQL Injection Protection**: Parameterized queries

## Performance Considerations
- **Simple Update**: Minimal database operations
- **Immediate Indexing**: Approved discs immediately searchable
- **Cache Invalidation**: May require cache updates for search results
- **Low Frequency**: Admin operations are typically infrequent

## Related Endpoints
- **[GET /api/discs/pending](./GET_discs_pending.md)** - List discs awaiting approval
- **[POST /api/discs/master](./POST_discs_master.md)** - Submit new discs for approval
- **[GET /api/discs/master](./GET_discs_master.md)** - Search approved discs
- **[POST /api/bags/:id/discs](../bags/POST_bags_id_discs.md)** - Add approved discs to bags

## Future Enhancements
- **Batch Approval**: Approve multiple discs at once
- **Rejection Endpoint**: Formally reject inappropriate submissions
- **Approval Notes**: Add admin comments to approval process
- **Audit Trail**: Track admin approval actions for accountability