# auth/refresh vision:

1. Validate refresh token (JWT signature + expiration)
2. Extract userId from refresh token  
3. Generate NEW short-lived access token
4. Return new access token

# 🎯 Profile Endpoints Strategy

User Journey:
User logs in → Gets JWT token  
App calls GET /api/profile → Returns empty/null profile (user has no data)  
App detects empty profile → Shows "Complete your profile!" prompts  
User fills out profile → App calls PUT /api/profile to save data  
App periodically checks → Continues prompting until profile is complete  

---

# 🐵 Baboon Friend Finder Flow (Proposed)

## Overview

- Users can see a list of their connected baboons (friends).
- Users can search for other baboons by username or location.
- Results show a list of matching users with public info (not a deep dive into a single profile).
- Optionally, users can send friend requests or connect from the search results.

## Example React Native Flow

1. **User logs in**  
   → App stores JWT

2. **User visits "Baboon Friend Finder" page**  
   → App displays:
      - List of current friends/connections (with public info)
      - Search bar and filters (username, city, etc.)

3. **User enters a search (e.g., username or city)**  
   → App calls `/api/profile/search?username=...&city=...`

4. **App displays a list of matching baboons**  
   → Each item shows public info (name, city, etc. as allowed by privacy settings)
   → Option to "Connect" or "Send Friend Request" next to each result

5. **User can tap a result for a quick view (optional)**  
   → Shows a modal or card with public info (not a full profile page)

6. **User can manage connections**  
   → Accept/reject requests, remove friends, etc.

---

## Data Model Example for Search Results

```json
[
  {
    "user_id": 123,
    "name": "Alice Example",
    "city": "San Francisco",
    "isNamePublic": true,
    "isLocationPublic": true
  },
  {
    "user_id": 456,
    "name": null,
    "city": "Portland",
    "isNamePublic": false,
    "isLocationPublic": true
  }
]
```

---

## Notes

- Search endpoint only returns fields marked as public.
- No need for a dedicated "view one profile" page—focus is on lists and quick actions.
- App should handle missing public info gracefully (e.g., "Name hidden", "Location hidden").
- Privacy toggles are still managed in the profile edit screen.

---

# Next Steps

- Implement `GET /api/profile/search` endpoint (with privacy filtering).
- Add friend/connection endpoints as needed.
- Continue TDD for


 📝 Baboon App: Database & Friendship Design Notes

## Friendship System Design

**Chosen Approach:**  
We use a `friendship_requests` table to manage friend connections between users.  
- When a user (the "requester") sends a friend request to another user (the "recipient"), a row is created with `status: 'pending'`.
- The recipient can approve (`status: 'accepted'`) or deny (`status: 'denied'`) the request.
- Only when the status is `'accepted'` are users considered friends and can see each other's discs/bags (according to privacy settings).
- If a user deletes their account, all related friendship requests (sent or received) are automatically deleted (`onDelete: Cascade`), keeping the database clean.

**Why this approach?**
- **Clarity:** Each request is explicit, and the status is easy to track.
- **Flexibility:** Supports future features like blocking, re-requesting, or tracking request history.
- **Data Hygiene:** Cascade deletes ensure no orphaned requests remain if a user is removed.

**Prisma Schema Example:**
```prisma
model users {
  id           Int                   @id @default(autoincrement())
  // ...other fields...
  sentRequests     friendship_requests[] @relation("Requester")
  receivedRequests friendship_requests[] @relation("Recipient")
}

model friendship_requests {
  id           Int      @id @default(autoincrement())
  requester_id Int
  recipient_id Int
  status       String   // 'pending', 'accepted', 'denied'
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  requester    users    @relation("Requester", fields: [requester_id], references: [id], onDelete: Cascade)
  recipient    users    @relation("Recipient", fields: [recipient_id], references: [id], onDelete: Cascade)

  @@unique([requester_id, recipient_id])
  @@index([recipient_id])
}
```

POST /api/friends/request — Send a friend request
POST /api/friends/respond — Approve or deny a request
GET /api/friends/requests — List incoming/outgoing requests
GET /api/friends — List all accepted friends


# Managing Disc Database

This section documents the backend API and logic for managing the disc database, including admin review of pending discs.

---

## Endpoints Overview

### 1. `GET /api/discs/master`
- **Purpose:** List all approved discs (default for regular users).
- **Auth:** Required (JWT).
- **Query params:** Supports filtering and pagination.
- **Example request:**
  ```
  GET /api/discs/master?brand=Innova&speed=7&limit=10&offset=0
  ```
- **Example response:**
  ```json
  [
    {
      "id": 1,
      "brand": "Innova",
      "model": "Leopard",
      "speed": 7,
      "glide": 5,
      "turn": -2,
      "fade": 1,
      "approved": true
    }
  ]
  ```

### 2. `POST /api/discs/master`
- **Purpose:** Submit a new disc for review (always created as pending).
- **Auth:** Required (JWT).
- **Payload example:**
  ```json
  {
    "brand": "Discraft",
    "model": "Buzzz",
    "speed": 5,
    "glide": 4,
    "turn": -1,
    "fade": 1,
    "added_by_id": 123
  }
  ```
- **Response:** The created disc (with `approved: false`).

---

### 3. `GET /api/discs/pending`
- **Purpose:** Admin-only endpoint to view all pending discs (not yet approved).
- **Auth:** Required (JWT, must be admin).
- **Query params:** Supports filtering and pagination (same as `/master`), but always returns only `approved: false`.
- **Example request:**
  ```
  GET /api/discs/pending?brand=Discraft&limit=5
  ```
- **Example response:**
  ```json
  [
    {
      "id": 42,
      "brand": "Discraft",
      "model": "Buzzz",
      "speed": 5,
      "glide": 4,
      "turn": -1,
      "fade": 1,
      "approved": false
    }
  ]
  ```

---

## How it Works

### #file:discs.routes.js
- Defines all disc-related endpoints.
- `/master` endpoints are for all authenticated users.
- `/pending` endpoint is protected by both `authenticateToken` and `isAdmin` middleware, and uses a middleware to force `approved=false` in the query.

### #file:discs.list.service.js
- Handles filtering, sorting, and pagination for disc queries.
- Supports filters like `brand`, `model`, `speed`, etc.
- Only returns approved discs by default, unless `approved=false` is specified (as in `/pending`).

### #file:discs.create.service.js
- Handles creation of new discs.
- All new discs are created with `approved: false` (pending review).
- Checks for duplicates (case-insensitive on brand/model).

---

## Example Admin Flow

1. **User submits a new disc via `POST /api/discs/master`.**
   - The disc is created as pending (`approved: false`).
2. **Admin logs in and visits the pending discs page.**
   - The frontend calls `GET /api/discs/pending`.
   - Only discs with `approved: false` are returned.
3. **Admin reviews and (in future) can approve or reject discs.**

---

**Breadcrumbs:**  
- All disc creation is pending by default.
- Only admins can see