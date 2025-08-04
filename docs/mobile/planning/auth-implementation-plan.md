# React Native Authentication Implementation Plan

## Overview
Build a complete authentication flow for the DiscBaboons mobile app with consistent styling across iOS and Android.

## Architecture

### 1. Navigation Structure
```
App.js
├── AuthNavigator (Not Authenticated)
│   ├── LoginScreen (default)
│   ├── RegisterScreen
│   ├── ForgotUsernameScreen
│   ├── ForgotPasswordScreen
│   └── ResetPasswordScreen
└── AppNavigator (Authenticated)
    └── HomeScreen (placeholder for bags list)
```

### 2. State Management
- **Auth Context**: Global authentication state
- **Token Storage**: Secure storage for JWT & refresh tokens
- **Auto-refresh**: Handle token refresh transparently

### 3. Design System Components

#### Core Components
1. **AppContainer** - Consistent screen wrapper with logo
2. **Input** - Styled text input with validation
3. **Button** - Primary/Secondary button styles
4. **Link** - Text link for navigation
5. **Alert** - Error/success messages
6. **LoadingOverlay** - Loading states

#### Style Constants
```javascript
// colors.js
export const colors = {
  // Brand Colors
  primary: '#ec7032',      // Orange (logo color)
  secondary: '#1d1d41',    // Dark Blue
  
  // Semantic Colors
  success: '#4CAF50',      // Green
  error: '#D32F2F',        // Red (slightly muted)
  warning: '#F57C00',      // Amber
  info: '#0288D1',         // Light Blue
  
  // Neutrals
  background: '#FFFFFF',   // White
  surface: '#F5F5F5',      // Light gray
  surfaceDark: '#1d1d41',  // Dark blue surface
  
  // Text Colors
  text: '#212121',         // Almost black
  textLight: '#757575',    // Medium gray
  textOnPrimary: '#FFFFFF', // White on orange
  textOnSecondary: '#FFFFFF', // White on dark blue
  
  // Borders & Dividers
  border: '#E0E0E0',       // Light gray
  divider: '#BDBDBD',      // Medium gray
  
  // Overlays
  overlay: 'rgba(29, 29, 65, 0.7)', // Dark blue overlay
  
  white: '#FFFFFF',
  black: '#000000',
};

// typography.js
export const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: 'normal' },
  caption: { fontSize: 14, fontWeight: 'normal' },
};

// spacing.js
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

## Implementation Phases

### Phase 1: Setup & Infrastructure (Day 1)
- [ ] Install React Navigation
- [ ] Install required dependencies (react-native-keychain, etc.)
- [ ] Create folder structure
- [ ] Set up design system (colors, typography, spacing)
- [ ] Create base components (AppContainer, Input, Button)
- [ ] Set up AuthContext

### Phase 2: Login Flow (Day 2)
- [ ] Create LoginScreen with logo
- [ ] Implement form validation
- [ ] Connect to /api/auth/login endpoint
- [ ] Handle JWT token storage
- [ ] Error handling & display
- [ ] Loading states

### Phase 3: Registration Flow (Day 3)
- [ ] Create RegisterScreen
- [ ] Password strength indicator
- [ ] Email validation
- [ ] Connect to /api/auth/register endpoint
- [ ] Success flow to login

### Phase 4: Password Recovery (Day 4)
- [ ] ForgotPasswordScreen (email input)
- [ ] ResetPasswordScreen (code + new password)
- [ ] Connect to forgot-password endpoints
- [ ] ForgotUsernameScreen
- [ ] Email sent confirmation screens

### Phase 5: Token Management (Day 5)
- [ ] Implement token refresh logic
- [ ] Auto-logout on 401
- [ ] Axios interceptors for auth headers
- [ ] Secure token storage
- [ ] App state restoration

### Phase 6: Polish & Testing (Day 6)
- [ ] Keyboard handling
- [ ] Form accessibility
- [ ] Error boundary
- [ ] Integration tests
- [ ] Manual testing on both platforms

## API Integration

### Endpoints to Implement
1. **POST /api/auth/login**
   - Input: username, password
   - Output: accessToken, refreshToken

2. **POST /api/auth/register**
   - Input: username, email, password
   - Output: success message

3. **POST /api/auth/refresh**
   - Input: refreshToken
   - Output: new accessToken

4. **POST /api/auth/forgot-password**
   - Input: email
   - Output: success (code sent)

5. **POST /api/auth/change-password**
   - Input: email, resetCode, newPassword
   - Output: success

6. **POST /api/auth/forgot-username**
   - Input: email
   - Output: success (username sent)

## Security Considerations
- Use react-native-keychain for secure token storage
- Clear tokens on logout
- Validate all inputs client-side
- Handle network errors gracefully
- Implement rate limiting awareness
- Clear sensitive data from memory

## Testing Strategy
- Unit tests for validation functions
- Component tests for each screen
- Integration tests for auth flows
- Manual testing on iOS & Android
- Test error scenarios
- Test token expiration

## Success Criteria
- [ ] User can register with valid credentials
- [ ] User can login and receive tokens
- [ ] Tokens are securely stored
- [ ] App maintains auth state on restart
- [ ] User can recover password
- [ ] User can recover username
- [ ] Consistent UI/UX on both platforms
- [ ] All forms are accessible
- [ ] Error messages are helpful
- [ ] Loading states are clear

## Next Steps After Auth
1. Implement AppNavigator with tab navigation
2. Create bags list screen
3. Add profile/settings screen
4. Implement logout functionality
5. Add biometric authentication (optional)