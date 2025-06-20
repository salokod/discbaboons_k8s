# auth/refresh vision:

1. Validate refresh token (JWT signature + expiration)
2. Extract userId from refresh token  
3. Generate NEW short-lived access token
4. Return new access token