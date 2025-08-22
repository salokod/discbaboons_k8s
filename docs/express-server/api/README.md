# DiscBaboons API Documentation

## Overview
Comprehensive API for disc golf bag management, friend networking, and course discovery. Built with Node.js, Express, and PostgreSQL.

## Base URL
```
https://discbaboons.spirojohn.com/api
```

## Authentication
Most endpoints require authentication using Bearer tokens:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Get access tokens via the [authentication endpoints](#authentication).

## API Endpoints

### 🔐 Authentication
Manage user accounts, login, and token refresh.

- **[POST /auth/register](./auth/POST_register.md)** - Create new user account
- **[POST /auth/login](./auth/POST_login.md)** - Login and receive tokens
- **[POST /auth/refresh](./auth/POST_refresh.md)** - Refresh access token
- **[POST /auth/forgot-username](./auth/POST_forgot-username.md)** - Recover username via email  
- **[POST /auth/forgot-password](./auth/POST_forgot-password.md)** - Request password reset
- **[POST /auth/change-password](./auth/POST_change-password.md)** - Complete password reset

[📖 View all authentication endpoints](./auth/)

### 🎒 Bag Management
Create and manage disc golf bags and their contents.

#### Bags
- **[GET /bags](./bags/GET_bags.md)** - List user's bags
- **[POST /bags](./bags/POST_bags.md)** - Create new bag
- **[GET /bags/:id](./bags/GET_bags_id.md)** - Get bag details with contents
- **[PUT /bags/:id](./bags/PUT_bags_id.md)** - Update bag
- **[DELETE /bags/:id](./bags/DELETE_bags_id.md)** - Delete bag

#### Bag Contents
- **[POST /bags/:id/discs](./bags/POST_bags_id_discs.md)** - Add disc to bag
- **[PUT /bags/:id/discs/:contentId](./bags/PUT_bags_id_discs_contentId.md)** - Edit disc in bag
- **[DELETE /bags/discs/:contentId](./bags/DELETE_bags_discs_contentId.md)** - Remove disc
- **[PATCH /bags/discs/:contentId/lost](./bags/PATCH_bags_discs_contentId_lost.md)** - Mark disc as lost/found
- **[PATCH /bags/discs/bulk-mark-lost](./bags/PATCH_bags_discs_bulk-mark-lost.md)** - Mark multiple discs as lost
- **[PUT /bags/discs/move](./bags/PUT_bags_discs_move.md)** - Move discs between bags

#### Lost Discs & Friends
- **[GET /bags/lost-discs](./bags/GET_bags_lost-discs.md)** - List user's lost discs
- **[GET /bags/friends/:friendUserId](./bags/GET_bags_friends_friendUserId.md)** - List friend's visible bags
- **[GET /bags/friends/:friendUserId/:bagId](./bags/GET_bags_friends_friendUserId_bagId.md)** - Get friend's bag details

[📖 View all bag endpoints](./bags/)

### 🥏 Disc Master Database
Browse and manage the disc master database.

- **[GET /discs/master](./discs/GET_discs_master.md)** - Search discs with advanced filtering
- **[POST /discs/master](./discs/POST_discs_master.md)** - Add new disc (pending approval)
- **[GET /discs/pending](./discs/GET_discs_pending.md)** - List pending discs (admin only)
- **[PATCH /discs/:id/approve](./discs/PATCH_discs_id_approve.md)** - Approve disc (admin only)

[📖 View all disc endpoints](./discs/)

### 🏌️ Course Database
Discover disc golf courses for round planning.

- **[GET /courses](./courses/GET_courses.md)** - Search 7,000+ disc golf courses
- **[GET /courses/:id](./courses/GET_courses_id.md)** - Get course details *(coming soon)*
- **[POST /courses](./courses/POST_courses.md)** - Submit new course *(coming soon)*

[📖 View all course endpoints](./courses/)

### 👥 Friends System
Connect with other disc golfers and share bags.

- **[GET /friends](./friends/GET_friends.md)** - List accepted friends
- **[POST /friends/request](./friends/POST_friends_request.md)** - Send friend request
- **[POST /friends/respond](./friends/POST_friends_respond.md)** - Accept/decline request
- **[GET /friends/requests](./friends/GET_friends_requests.md)** - List pending requests

[📖 View all friend endpoints](./friends/)

### 👤 User Profiles
Manage user profiles and privacy settings.

- **[GET /profile](./profile/GET_profile.md)** - Get own profile
- **[PUT /profile](./profile/PUT_profile.md)** - Update profile and privacy
- **[GET /profile/search](./profile/GET_profile_search.md)** - Search public profiles (no auth)

[📖 View all profile endpoints](./profile/)

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "ErrorType",
  "message": "Human readable error message"
}
```

### Paginated Response
```json
{
  "items": [...],
  "total": 150,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

## HTTP Status Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| 200 | OK | Successful request |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data, validation errors |
| 401 | Unauthorized | Missing or invalid access token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate data (email/username) |
| 500 | Internal Server Error | Server-side errors |

## Error Types

| Error Type | HTTP Code | Description |
|------------|-----------|-------------|
| ValidationError | 400 | Invalid input data |
| UnauthorizedError | 401 | Authentication required |
| AuthorizationError | 403 | Insufficient permissions |
| NotFoundError | 404 | Resource not found |
| ConflictError | 409 | Duplicate resource |

## Data Types

### Common Field Types
- **UUID**: String in format `550e8400-e29b-41d4-a716-446655440000`
- **Timestamp**: ISO 8601 format `2024-01-15T10:30:00.000Z`
- **Flight Numbers**: Integers representing disc flight characteristics
  - Speed: 1-15
  - Glide: 1-7  
  - Turn: -5 to 2
  - Fade: 0-5

### Flight Number Filtering
Many endpoints support flight number range filtering:
- **Single Value**: `speed=9`
- **Range**: `speed=8-10`
- **Negative Range**: `turn=-3--1`

## Support
For API support and questions:
- GitHub Issues: [discbaboons_k8s/issues](https://github.com/user/discbaboons_k8s/issues)