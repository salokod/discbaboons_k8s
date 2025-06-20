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