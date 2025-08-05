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

**Implementation Details:**
- Root navigator checks `isAuthenticated` from AuthContext
- AuthNavigator: Stack navigator for auth flows
- AppNavigator: Tab/Stack navigator for authenticated app
- No manual navigation between Auth/App stacks (automatic based on auth state)

### 2. State Management
- **Auth Context**: Global authentication state
  - `isAuthenticated`: Boolean flag for auth status
  - `user`: User object with profile data
  - `tokens`: Object containing accessToken and refreshToken
  - `login({ user, tokens })`: Function to set authenticated state
  - `logout()`: Function to clear auth state
  - `useAuth()`: Hook to access auth state and functions
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

### Phase 1.5: Theme System Implementation (PIVOT) ✅ COMPLETE
**Rationale**: Before building UI screens, implement a robust theme system to support:
- Light theme (default)
- Dark theme (system preference aware)
- Blackout theme (high contrast black/white only)

**Implementation Steps:**
- [x] Create ThemeContext for theme state management
- [x] Refactor colors.js to support theme variants
- [x] Create theme-aware hooks (useTheme, useThemeColors)
- [x] Update existing components to use theme colors
- [ ] Add theme switcher component for testing (deferred to later)

**Completed Theme System:**
- **themes.js**: Defines light, dark, and blackout color palettes
- **ThemeContext**: Provides theme state and setTheme function
- **useTheme hook**: Access current theme and change it
- **useThemeColors hook**: Get current theme's color palette
- **Updated components**: Button and Input now theme-aware
- **Backward compatibility**: colors.js wraps light theme for legacy code

**Theme Design Decisions:**
- Brand colors (orange/dark blue) consistent across all themes
- Blackout theme uses only black/white (except brand orange)
- Components dynamically update when theme changes
- All tests updated to wrap components with ThemeProvider

### Phase 2: Login Flow - Production-Ready Design (Day 2)

#### LoginScreen Complete Design Requirements

**Visual Layout (Top to Bottom):**
1. **Header Section**
   - DiscBaboons Logo (150x150, centered) - logo contains app name
   - Spacing: xl gap between sections

2. **Form Section**
   - Username Input (required, 4-20 chars)
   - Password Input (required, secure entry)
   - Form validation with real-time feedback
   - Error display area (conditionally visible)
   - Spacing: md gap between inputs

3. **Primary Actions**
   - "Log In" Button (primary variant, full width)
   - Loading state with spinner overlay
   - Success/error feedback

4. **Secondary Actions** 
   - "Forgot Password?" Link (right-aligned)
   - "Forgot Username?" Link (right-aligned)
   - Spacing: sm gap between links

5. **Registration Section**
   - Divider line with "New to DiscBaboons?" text
   - "Create Account" Button (secondary variant, full width)
   - Spacing: lg gap from login form

6. **Footer Links**
   - "Privacy Policy" Link (small, centered)
   - "Terms of Service" Link (small, centered)  
   - "Support" Link (small, centered)
   - Copyright: "© 2024 DiscBaboons" (caption, centered)
   - Spacing: xs gap between links

**Form Validation Rules:**
- Username: 4-20 characters, required
- Password: 8-32 characters, required
- Real-time validation on blur
- Show/hide validation errors
- Disable login button until valid

**Error Handling:**
- Network errors: "Unable to connect. Please check your internet."
- Invalid credentials: "Invalid username or password."
- Server errors: "Something went wrong. Please try again."
- Rate limiting: "Too many attempts. Please wait before trying again."

**Loading States:**
- Button shows spinner + "Logging in..."
- Form inputs disabled during login
- Overlay prevents interaction

**Navigation Integration:**
- "Forgot Password?" → ForgotPasswordScreen
- "Forgot Username?" → ForgotUsernameScreen  
- "Create Account" → RegisterScreen
- Privacy/Terms → WebView screens
- Support → Email/Help screen

#### Implementation Slices:

**PHASE 2 COMPLETE: Production-Ready Login Flow** ✅

**UI/UX Implementation Complete:**
- [x] LoginScreen exports and renders with SafeAreaView + ScrollView
- [x] Logo display (120x120, centered)
- [x] Tab interface (Sign In / Sign Up) with theme-aware styling
- [x] Username/password inputs with real-time validation (4-20 chars, 8-32 chars)
- [x] Form validation with disabled button states
- [x] Error display area with theme-aware styling and proper user feedback
- [x] "Forgot Password?" and "Forgot Username?" links (space-between layout)
- [x] Footer links (Privacy Policy, Terms, Support, Copyright 2025)
- [x] Cross-platform styling (iOS shadows, Android elevation + Material Design)
- [x] Modern theme system (soft #FAFBFC background, white surfaces)
- [x] Loading states for login button ("Logging in..." + disabled state)
- [x] Security testing (password hidden, proper validation)

**API Integration Complete:**
- [x] Environment configuration system (dev: localhost:8080, prod: discbaboons.spirojohn.com)
- [x] Function-based AuthService (login, handleNetworkError)
- [x] Real /api/auth/login endpoint integration
- [x] Proper error handling for 400/401/500+ responses with user-friendly messages
- [x] Network error handling (connection, timeout, server errors)
- [x] JWT response validation and AuthContext integration
- [x] Username trimming (case-sensitive as per backend design)

**Testing Complete:**
- [x] 101 unit tests passing (LoginScreen, AuthService, environment config)
- [x] 7 integration tests passing (API contract validation)
- [x] Platform-specific styling tests (iOS vs Android)
- [x] Error handling and loading state tests
- [x] Cross-platform consistency validation
- [x] All lint checks passing

**Current Status: Ready for Token Storage** 🚀

**Next Phase Priority:**
- [ ] **CRITICAL**: Implement secure JWT token storage with react-native-keychain
- [ ] Token persistence and app restart state restoration
- [ ] Token refresh system and automatic logout on 401

#### API Integration Requirements:

**POST /api/auth/login Integration:**
```javascript
const loginPayload = {
  username: username.trim(),
  password: password
};

// Success Response:
{
  user: { id, username, email },
  tokens: { 
    accessToken: "jwt...",
    refreshToken: "jwt..."
  }
}

// Error Responses:
{
  error: "ValidationError",
  message: "Username must be 4-20 characters"
}
```

**Security Implementation:**
- Store tokens in react-native-keychain (encrypted)
- Clear form data on successful login
- Implement password visibility toggle
- **SHOULD**: Add network timeout handling with AbortController (30s timeout)
- Add biometric prompt option (future enhancement)

#### Placeholder Screens Needed:
1. **ForgotPasswordScreen**: Email input → verification code → new password
2. **ForgotUsernameScreen**: Email input → username sent to email  
3. **RegisterScreen**: Username, email, password, confirm password
4. **PrivacyPolicyScreen**: WebView or ScrollView with policy text
5. **TermsOfServiceScreen**: WebView or ScrollView with terms
6. **SupportScreen**: Contact options and help resources

#### Cross-Platform Considerations:
- iOS: Use SafeAreaView for proper spacing around notch
- Android: Handle back button to close app on login screen
- Both: Keyboard dismissal on tap outside, proper keyboard avoidance
- Consistent visual appearance across both platforms

#### Accessibility Features:
- Screen reader labels for all interactive elements
- **MUST**: Add accessibilityLabel and accessibilityHint to all Input components
- Proper tab order for form navigation
- High contrast support in blackout theme
- Large text scaling support
- Voice control compatibility

### Phase 3: Registration Flow (Day 3)
**RegisterScreen Implementation:**
- [ ] Create RegisterScreen with consistent styling
- [ ] Username input with availability checking
- [ ] Email input with format validation  
- [ ] Password input with strength indicator
- [ ] Confirm password input with matching validation
- [ ] Real-time validation feedback
- [ ] Connect to /api/auth/register endpoint
- [ ] Success flow redirect to login
- [ ] Error handling for conflicts (username/email taken)
- [ ] Link back to LoginScreen
- [ ] Privacy Policy and Terms acceptance checkboxes

**Password Strength Requirements (per API docs):**
- 8-32 characters length
- Must contain: uppercase, lowercase, number, special character
- Visual strength indicator (weak/medium/strong)
- Real-time validation as user types

### Phase 4: Password Recovery Flow (Day 4)
**ForgotPasswordScreen:**
- [ ] Email input for password reset request
- [ ] Connect to /api/auth/forgot-password endpoint  
- [ ] Success confirmation with next steps
- [ ] Resend code functionality
- [ ] Link back to LoginScreen

**ResetPasswordScreen:**
- [ ] 6-digit verification code input
- [ ] New password input with strength validation
- [ ] Confirm new password input
- [ ] Connect to /api/auth/change-password endpoint
- [ ] Success redirect to LoginScreen
- [ ] Code expiration handling (30 minutes)

**ForgotUsernameScreen:**
- [ ] Email input for username recovery
- [ ] Connect to /api/auth/forgot-username endpoint
- [ ] Success confirmation message
- [ ] Link back to LoginScreen

### Phase 5: Support & Legal Screens (Day 5)
**PrivacyPolicyScreen:**
- [ ] ScrollView with full privacy policy text
- [ ] Proper typography and spacing
- [ ] Last updated date
- [ ] Back navigation to previous screen

**TermsOfServiceScreen:**
- [ ] ScrollView with terms and conditions
- [ ] Proper typography and spacing
- [ ] Last updated date
- [ ] Back navigation to previous screen

**SupportScreen:**
- [ ] Contact information display
- [ ] Email support button (opens mail app)
- [ ] FAQ sections with expandable answers
- [ ] App version and build information
- [ ] Link to privacy policy and terms

### Phase 3: Token Management & Security (IMMEDIATE PRIORITY)
**Secure Storage Implementation:**
- [ ] Install and configure react-native-keychain
- [ ] Create secure token storage service (tokenStorage.js)
- [ ] Implement token retrieval on app launch
- [ ] Handle keychain access errors gracefully
- [ ] Update AuthContext to persist tokens securely

**Token Refresh System:**
- [ ] Automatic token refresh using refresh token before expiration
- [ ] Handle 401 responses with auto-logout
- [ ] Token rotation on refresh (per API security)
- [ ] Background refresh before expiration (13 minutes for 15min tokens)
- [ ] Network request interceptor for adding auth headers

**App State Management:**
- [ ] Restore authentication state on app launch from keychain
- [ ] Handle app backgrounding/foregrounding
- [ ] Clear sensitive data on app termination
- [ ] Update root navigation to respect auth state

### Phase 3.5: Password Visibility Toggle ✅ COMPLETE
**LoginScreen Password Visibility:**
- [x] Add password visibility toggle (eye icon) to password input field
- [x] Icon state: 👁️ (show password) ↔️ 🙈 (hide password) 
- [x] Toggle secureTextEntry property on TextInput
- [x] Position icon inside password input field (right side)
- [x] Maintain theme-aware styling (light/dark/blackout themes)
- [x] Add accessibility labels for screen readers
- [x] Include in existing LoginScreen tests

**Implementation Details:**
- Use existing Input component with new `showPasswordToggle` prop
- Add TouchableOpacity with eye icon inside input container
- Toggle between secureTextEntry true/false on press
- Maintain existing validation and error handling
- Apply same pattern to RegisterScreen when implemented

**User Experience Goals:**
- Help users verify password input accuracy
- Reduce login failures from typos
- Modern UX pattern expected in mobile apps
- Accessibility support for password entry

### Phase 4: Registration Flow (NEXT)
**RegisterScreen Implementation:**
- [ ] Create RegisterScreen with consistent styling and theme support
- [ ] Username input with availability checking (case-sensitive)
- [ ] Email input with format validation  
- [ ] Password input with strength indicator
- [ ] Confirm password input with matching validation
- [ ] Real-time validation feedback with same UX patterns as LoginScreen
- [ ] Connect to /api/auth/register endpoint
- [ ] Success flow redirect to login with success message
- [ ] Error handling for conflicts (username/email taken)
- [ ] Privacy Policy and Terms acceptance checkboxes

### Phase 5: Password Recovery Flow
**ForgotPasswordScreen:**
- [ ] Email input for password reset request
- [ ] Connect to /api/auth/forgot-password endpoint  
- [ ] Success confirmation with next steps
- [ ] Resend code functionality
- [ ] Link back to LoginScreen

**ForgotUsernameScreen:**
- [ ] Email input for username recovery
- [ ] Connect to /api/auth/forgot-username endpoint
- [ ] Success confirmation message
- [ ] Link back to LoginScreen

### Phase 6: Support & Legal Screens

### Phase 7: Biometric Authentication (Future Enhancement)
**Biometric Login Implementation:**
- [ ] Install react-native-biometrics or react-native-touch-id
- [ ] Check device biometric capabilities (Face ID, Touch ID, Fingerprint)
- [ ] Prompt user to enable biometric login after successful password login
- [ ] Store encrypted token with biometric protection
- [ ] Add "Login with Face ID/Touch ID" option on login screen
- [ ] Handle biometric failures with fallback to password
- [ ] Settings screen toggle to enable/disable biometric login
- [ ] Clear biometric data on logout
- [ ] Test on devices with and without biometric hardware

**Platform-Specific Implementation:**
- iOS: Face ID requires NSFaceIDUsageDescription in Info.plist
- iOS: Touch ID requires NSFaceIDUsageDescription 
- Android: Fingerprint requires USE_FINGERPRINT permission
- Both: Graceful degradation when biometrics unavailable

### Phase 8: Polish & Production Readiness
**User Experience Enhancements:**
- [ ] Keyboard handling and dismissal
- [ ] Form auto-focus and tab order
- [ ] Loading states for all API calls
- [ ] Success/error toast notifications
- [ ] Pull-to-refresh on error screens

**Accessibility Implementation:**
- [ ] Screen reader labels for all elements
- [ ] High contrast theme support
- [ ] Large text scaling compatibility
- [ ] Voice control navigation
- [ ] Color-blind friendly error states

**Cross-Platform Polish:**
- [ ] iOS SafeAreaView implementation
- [ ] Android back button handling
- [ ] Platform-specific UI adjustments
- [ ] Keyboard avoidance on both platforms
- [ ] Status bar styling

**Testing & Quality Assurance:**
- [ ] Integration tests for complete auth flows
- [ ] Error scenario testing (network, validation, server)
- [ ] Manual testing on iOS and Android devices
- [ ] Performance testing (large forms, slow networks)
- [ ] Security testing (token storage, data clearing)

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

**Phase 1 & 1.5 Testing Achievements:**
- ✅ 55+ tests passing with 100% success rate
- ✅ TDD methodology applied to all components
- ✅ Design system fully tested (colors, typography, spacing, themes)
- ✅ Base components tested and theme-aware (Button, Input, AppContainer)
- ✅ Context structure tested (AuthContext, ThemeContext)
- ✅ Theme system with light, dark, and blackout modes

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
5. Add biometric authentication (Face ID/Touch ID on iOS, Fingerprint on Android)