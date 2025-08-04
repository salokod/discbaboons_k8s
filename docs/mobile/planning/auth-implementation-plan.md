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

## How to Implement - TDD & Learning Approach

### TDD Methodology for React Native
1. **Thinnest Possible Slices**: 
   - Start with "exports expected structure" tests
   - Add one piece of functionality at a time
   - Each slice should take 5-10 minutes to implement
   - Stop after each slice for human validation

2. **Test-First Cycle**:
   - Write failing test (RED)
   - Write minimal code to pass (GREEN) 
   - Explain the design choice and implications (TEACH)
   - Human runs tests to confirm
   - Refactor if needed
   - Repeat

3. **Learning Moments**:
   - Explain WHY each React Native pattern is used
   - Discuss cross-platform implications of each choice
   - Show alternative approaches and trade-offs
   - Point out production-grade considerations

### Cross-Platform Consistency Strategy
1. **Custom Components First**: Never rely on default platform styling
2. **Explicit Styling**: Always define colors, fonts, spacing explicitly
3. **Platform-Specific Handling**: Use Platform.select() when needed
4. **Testing on Both**: Verify appearance on iOS and Android simulators

### Production-Grade Standards
1. **JavaScript ES6+**: Clean imports/exports, modern syntax
2. **Error Boundaries**: Wrap components that might fail
3. **Accessibility**: Add accessibilityLabel and accessibilityHint
4. **Performance**: Use React.memo, useMemo, useCallback appropriately
5. **Security**: Never store sensitive data in AsyncStorage
6. **Testing**: Unit tests for logic, integration tests for user flows

### Component Development Pattern
```javascript
// 1. Define prop validation with PropTypes
// 2. Create component with explicit styles
// 3. Add accessibility props
// 4. Handle platform differences
// 5. Export with proper validation

import PropTypes from 'prop-types';

const Button = ({ title, onPress, variant = 'primary', disabled = false }) => {
  // Implementation
};

Button.propTypes = {
  title: PropTypes.string.isRequired,
  onPress: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary']),
  disabled: PropTypes.bool,
};
```

### Slice Size Guidelines
- **Micro-slice**: Export structure, basic props validation
- **Mini-slice**: Add one style property (color, typography, spacing)
- **Small-slice**: Add one behavior (onPress, validation, state)
- **Medium-slice**: Combine 2-3 mini-slices for complete feature

### Teaching Focus Areas
1. **React Native Fundamentals**: Components, styling, navigation
2. **Cross-Platform Patterns**: Platform-specific code, consistent UI
3. **State Management**: Context, hooks, persistence
4. **Testing Strategies**: Jest, React Native Testing Library
5. **Performance**: Re-renders, memory, bundle size
6. **Security**: Token storage, input validation, network requests

### Quality Gates
- All tests pass before moving to next slice
- Component renders identically on iOS/Android
- No accessibility warnings
- JavaScript linting passes
- Code follows established patterns

## Implementation Phases

### Phase 1: Setup & Infrastructure (Day 1) ✅ COMPLETE
- [x] Install React Navigation
- [x] Install required dependencies (react-native-keychain, prop-types)
- [x] Create folder structure
- [x] Set up design system (colors, typography, spacing)
- [x] Create base components (AppContainer, Input, Button)
- [x] Set up AuthContext

**Completed Components:**
- **Button**: TouchableOpacity with title, onPress, variants - fully tested
- **Input**: TextInput with placeholder, value, onChangeText - fully tested  
- **AppContainer**: View wrapper for children composition - fully tested
- **Design System**: Complete color palette, typography scale, spacing tokens
- **AuthContext**: Basic context structure ready for state management

**File Structure Created:**
```
src/
├── components/
│   ├── Button.js + tests
│   ├── Input.js + tests
│   └── AppContainer.js + tests
├── context/
│   └── AuthContext.js + tests
├── design-system/
│   ├── colors.js + tests
│   ├── typography.js + tests
│   └── spacing.js + tests
├── screens/ (ready for Phase 2)
├── services/ (ready for API integration)
└── utils/ (ready for helpers)
```

### Phase 1.5: Theme System Implementation (PIVOT)
**Rationale**: Before building UI screens, implement a robust theme system to support:
- Light theme (default)
- Dark theme (system preference aware)
- Blackout theme (high contrast black/white only)

**Implementation Steps:**
- [ ] Create ThemeContext for theme state management
- [ ] Refactor colors.js to support theme variants
- [ ] Create theme-aware hooks (useTheme, useThemeColors)
- [ ] Update existing components to use theme colors
- [ ] Add theme switcher component for testing

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

**Phase 1 Testing Achievements:**
- ✅ 39 tests passing with 100% success rate
- ✅ TDD methodology applied to all components
- ✅ Design system fully tested (colors, typography, spacing)
- ✅ Base components tested (Button, Input, AppContainer)
- ✅ Context structure tested and ready

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