# PATCH /api/discs/:id/deny

## Overview
Denies a pending disc submission, marking it as rejected with a reason. This admin-only endpoint is used to moderate user-submitted disc data and provide feedback for rejections.

## Endpoint
```
PATCH /api/discs/:id/deny
```

## Authentication
**Required**: Bearer token in Authorization header with admin privileges.

## Rate Limiting
- **Window**: 1 hour
- **Limit**: 50 admin operations per IP address
- **Purpose**: Prevents admin endpoint abuse while allowing efficient moderation
- **Headers Returned**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Time when limit resets

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string (UUID) | Yes | Unique identifier of the disc to deny |

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | Yes | Reason for denying the disc submission |

### Example Request Body
```json
{
  "reason": "Duplicate entry - this disc already exists in the database"
}
```

## Response

### Success (200 OK)
```json
{
  "success": true,
  "disc": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "brand": "Dynamic Discs",
    "model": "Lucid Truth",
    "speed": 5,
    "glide": 5,
    "turn": 0,
    "fade": 2,
    "approved": false,
    "denied": true,
    "denied_reason": "Duplicate entry - this disc already exists in the database",
    "denied_at": "2024-01-15T11:00:00.000Z",
    "denied_by_id": 789,
    "added_by_id": 456,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Denial reason is required"
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
  "message": "Admin access required"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Disc not found"
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many admin operations, please try again in 1 hour"
}
```

**Rate Limit Headers:**
- `X-RateLimit-Limit`: 50
- `X-RateLimit-Remaining`: 0
- `X-RateLimit-Reset`: [timestamp]

## Response Fields

### Denied Disc Object
| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique disc identifier |
| `brand` | string | Disc manufacturer/brand |
| `model` | string | Disc model name |
| `speed` | integer | Flight rating: Speed (1-15) |
| `glide` | integer | Flight rating: Glide (1-7) |
| `turn` | integer | Flight rating: Turn (-5 to 2) |
| `fade` | integer | Flight rating: Fade (0-5) |
| `approved` | boolean | Remains false after denial |
| `denied` | boolean | Now true after denial |
| `denied_reason` | string | Admin-provided reason for denial |
| `denied_at` | string (ISO 8601) | Denial timestamp |
| `denied_by_id` | integer | Admin user ID who denied the disc |
| `added_by_id` | integer | User ID who originally submitted the disc |
| `created_at` | string (ISO 8601) | Original submission timestamp |
| `updated_at` | string (ISO 8601) | Denial timestamp |

## Service Implementation
**File:** `services/discs.deny.service.js`

### Key Features
- **Existence Check**: Validates disc exists before denial
- **Reason Required**: Mandatory denial reason for user feedback
- **Admin Tracking**: Records which admin denied the disc
- **Timestamp Recording**: Tracks when denial occurred
- **Immediate Effect**: Denied discs are excluded from pending lists

### Database Operations
- Disc lookup: `SELECT * FROM disc_master WHERE id = $1`
- Denial update: `UPDATE disc_master SET denied = true, denied_reason = $1, denied_at = NOW(), denied_by_id = $2 WHERE id = $3`

## Example Usage

### Deny Pending Disc
```bash
curl -X PATCH http://localhost:3000/api/discs/770e8400-e29b-41d4-a716-446655440000/deny \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Duplicate entry - this disc already exists in the database"}'
```

### Response
```json
{
  "success": true,
  "disc": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "brand": "Dynamic Discs",
    "model": "Lucid Truth",
    "speed": 5,
    "glide": 5,
    "turn": 0,
    "fade": 2,
    "approved": false,
    "denied": true,
    "denied_reason": "Duplicate entry - this disc already exists in the database",
    "denied_at": "2024-01-15T11:00:00.000Z",
    "denied_by_id": 789,
    "added_by_id": 456,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
```

## Denial Effects

### Immediate Exclusion
Once denied, the disc is excluded from:
- **[GET /api/discs/pending](./GET_discs_pending.md)** lists (filtered out)
- **Future Consideration**: Disc won't appear in admin approval queues
- **User Feedback**: Original submitter can see denial reason

### Workflow Integration
1. **User Submission**: User submits disc via **[POST /api/discs/master](./POST_discs_master.md)**
2. **Pending Queue**: Disc appears in **[GET /api/discs/pending](./GET_discs_pending.md)**
3. **Admin Review**: Admin reviews accuracy and legitimacy
4. **Denial**: Admin uses this endpoint to deny with reason
5. **Exclusion**: Disc removed from pending queues but preserved for audit

## Admin Responsibilities

### Review Criteria
- **Duplicate Detection**: Check for existing similar entries
- **Data Quality**: Validate completeness and accuracy
- **Flight Number Accuracy**: Verify against official specifications
- **Brand/Model Correctness**: Ensure proper naming conventions

### Feedback Guidelines
- **Clear Reasoning**: Provide specific, actionable denial reasons
- **Educational Value**: Help users understand submission standards
- **Consistency**: Apply uniform standards across all reviews
- **Professional Tone**: Maintain respectful communication

## Common Denial Reasons
- **"Duplicate entry - this disc already exists in the database"**
- **"Invalid flight numbers - please verify against official specifications"**
- **"Incomplete submission - missing required flight rating information"**
- **"Brand/model name does not match official manufacturer naming"**
- **"Fictional or non-existent disc model"**

## Business Rules
- **Admin Authorization Required**: Only admin users can deny discs
- **Reason Mandatory**: Denial reason must be provided
- **Immediate Effect**: Denial takes effect immediately
- **User Attribution Preserved**: Original submitter information maintained
- **Audit Trail**: Denial information preserved for accountability

## Use Cases
- **Quality Control**: Reject invalid or duplicate submissions
- **Database Integrity**: Maintain high-quality disc database
- **User Education**: Provide feedback on submission standards
- **Spam Prevention**: Remove inappropriate or fictional entries

## Security Features
- **Admin Authorization**: Multiple authorization layers
- **Role-Based Access**: Strictly limited to admin users
- **Existence Validation**: Confirms disc exists before denial
- **SQL Injection Protection**: Parameterized queries
- **Input Validation**: Ensures denial reason is provided

## Performance Considerations
- **Simple Update**: Minimal database operations
- **Immediate Filtering**: Denied discs immediately excluded from pending lists
- **Audit Preservation**: Denial information maintained for reporting
- **Low Frequency**: Admin operations are typically infrequent

## Related Endpoints
- **[GET /api/discs/pending](./GET_discs_pending.md)** - List discs awaiting approval (excludes denied)
- **[PATCH /api/discs/:id/approve](./PATCH_discs_id_approve.md)** - Approve pending discs
- **[POST /api/discs/master](./POST_discs_master.md)** - Submit new discs for approval
- **[GET /api/discs/master](./GET_discs_master.md)** - Search approved discs

## Future Enhancements
- **Batch Denial**: Deny multiple discs at once
- **Denial Categories**: Standardized denial reason categories
- **User Notifications**: Email notifications for denial feedback
- **Appeal Process**: Allow users to address denial reasons and resubmit
- **Denial Analytics**: Track common denial reasons for improvement