# DiscBaboons API Documentation

## Base URL
```
http://localhost:8080/api
```

## API Endpoints

### Authentication
- [POST /auth/register](./auth/register.md) - Register a new user account

## General Information

### Response Format
All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

### HTTP Status Codes
- `200` - OK (Success)
- `201` - Created (Resource created successfully)
- `400` - Bad Request (Validation error)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Access denied)
- `404` - Not Found (Resource not found)
- `409` - Conflict (Resource already exists)
- `500` - Internal Server Error (Server error)

### Error Handling
All validation errors return HTTP 400 with a descriptive message. Business logic conflicts (like duplicate resources) return HTTP 409.

## Development

### Testing
```bash
# Run all tests
npm run verify

# Unit tests only
npm test

# Integration tests only
npm run test:integration
```

### Environment
Server runs on port 8080 by default. Configure via `PORT` environment variable.
