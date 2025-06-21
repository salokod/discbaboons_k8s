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
