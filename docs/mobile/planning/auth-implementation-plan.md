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

### Phase 3: Token Management & Security ✅ COMPLETE
**Secure Storage Implementation:**
- [x] Install and configure react-native-keychain
- [x] Create secure token storage service (tokenStorage.js)
- [x] Implement token retrieval on app launch
- [x] Handle keychain access errors gracefully
- [x] Update AuthContext to persist tokens securely

**Token Refresh System:**
- [x] Automatic token refresh using refresh token before expiration
- [x] Handle 401 responses with auto-logout
- [x] Token rotation on refresh (per API security)
- [x] Background refresh before expiration (2 minutes before 15min tokens)
- [x] Network request interceptor for adding auth headers

**App State Management:**
- [x] Restore authentication state on app launch from keychain
- [x] Handle app backgrounding/foregrounding
- [x] Clear sensitive data on app termination
- [x] Update root navigation to respect auth state

**Phase 3 Implementation Summary:**
- ✅ **175 tests passing** with comprehensive token management coverage
- ✅ **Secure keychain storage** with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` encryption
- ✅ **Automatic token refresh** 2 minutes before expiration with proper timer cleanup
- ✅ **App state restoration** from stored tokens with JWT payload validation
- ✅ **Production-ready security** with token rotation and immediate logout on failures
- ✅ **Cross-platform compatibility** tested on iOS and Android
- ✅ **Enhanced rate limiting** (10 attempts per 15min) for better development experience
- ✅ **Comprehensive error handling** with network timeouts and graceful degradation

**Files Created/Enhanced:**
- `src/services/tokenStorage.js` - Secure keychain-based persistence
- `src/services/tokenRefresh.js` - Automatic refresh with JWT expiration detection
- `src/context/AuthContext.js` - Enhanced with token lifecycle management
- `__tests__/services/` - Full test coverage for token management
- `apps/express-server/middleware/authRateLimit.middleware.js` - Improved dev limits

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

### Phase 4: Registration Flow ✅ COMPLETE
**RegisterScreen Implementation:**
- [x] Create RegisterScreen with consistent styling and theme support
- [x] Username input with real-time validation (4-20 characters, progressive disclosure)
- [x] Validation helper component with professional styling (green flash success feedback)
- [x] Theme support for all modes (light, dark, blackout) with proper color adaptation
- [x] TDD implementation with comprehensive test coverage (220 tests passing)
- [x] Fix spacing inconsistency between Sign In and Sign Up tabs
- [x] Email input with format validation and validation helper
- [x] Password input with strength validation helper (8-32 chars, uppercase, lowercase, number, special char)
- [x] Confirm password input with matching validation helper
- [x] Connect to /api/auth/register endpoint
- [x] Success flow redirect to login with success message
- [x] Error handling for conflicts (username/email taken)
- [ ] Privacy Policy and Terms acceptance checkboxes (deferred to Phase 6)

**Phase 4 Achievements:**
✅ **Green Flash UX Pattern**: Validation helpers show during errors, flash green on success, then disappear
✅ **Professional Styling**: Status indicators (✓/✗), theme-aware colors, consistent spacing
✅ **Backend Alignment**: Validation rules match auth.register.service.js exactly (4-20 chars, lowercase conversion)
✅ **Full API Integration**: Complete registration flow with success notifications and auto-tab switching
✅ **Comprehensive Testing**: All validation tests with fake timers for reliable async behavior

**Final Implementation Status:**
- Username validation: ✅ Complete with green flash UX
- Email validation: ✅ Complete with format validation
- Password validation: ✅ Complete with complex requirements (uppercase, lowercase, number, special char)
- Confirm password: ✅ Complete with matching validation
- API integration: ✅ Complete with success/error handling
- Success notification: ✅ Complete with tab switching and pre-filled username

### Phase 4.5: UX Polish & Professional Mobile Experience ✅ COMPLETE
**Enhanced User Experience Implementation:**
- [x] **Individual Password Requirement Indicators**: Each requirement (length, uppercase, lowercase, number, special char) shows individual ✓/✗ status with color-coded text and icons
- [x] **Form Auto-Focus Flow**: Seamless keyboard navigation with returnKeyType="next" and auto-focus between fields (username → email → password → confirm password → submit)
- [x] **Keyboard Dismissal**: TouchableWithoutFeedback wrapper with tap-outside-to-dismiss functionality
- [x] **Keyboard Avoidance**: ScrollView with keyboardShouldPersistTaps="handled" for proper iOS and Android keyboard management
- [x] **Enhanced LoginScreen Auto-Focus**: Username → password → submit flow with proper return key handling
- [x] **Professional Color Coding**: Validation helpers dynamically change text and icon colors (green for met requirements, red for unmet)
- [x] **Test Noise Reduction**: Suppressed React act() warnings in test suite for cleaner developer experience
- [x] **Comprehensive Integration Testing**: Full user journey tests following Martin Fowler's Testing Pyramid principles

**Phase 4.5 Technical Achievements:**
✅ **220 Unit Tests Passing**: Complete test coverage including new UX enhancements
✅ **9 Integration Tests**: API contract validation and cross-component behavior testing
✅ **Platform-Specific Testing**: iOS and Android keyboard, styling, and interaction testing
✅ **Progressive Disclosure**: Validation feedback appears only when needed, disappears when requirements met
✅ **Accessibility Enhancements**: Proper keyboard navigation, return key handling, and screen reader support
✅ **Professional UX Patterns**: Individual requirement status tracking with real-time visual feedback

**User Experience Improvements:**
- **Real-time Visual Feedback**: Users see exactly which password requirements are met/unmet as they type
- **Effortless Form Navigation**: Natural tab flow through all form fields using device keyboard
- **Modern Mobile Interactions**: Industry-standard tap-to-dismiss and keyboard avoidance behaviors
- **Reduced User Friction**: Clear visual indicators eliminate guesswork about form requirements
- **Cross-Platform Consistency**: Identical professional experience on both iOS and Android devices

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

### Phase 9: UX Polish & Micro-Interactions (Future Enhancement)
**Subtle Loading Animation for Token Restoration:**
- [ ] Add elegant loading animation during app launch token restoration
- [ ] Security-focused micro-interaction when validating stored tokens
- [ ] Replace generic loading with branded security experience

**Implementation Vision:**
```javascript
// Token restoration loading state
const TokenRestorationScreen = () => (
  <View style={styles.tokenRestoreContainer}>
    <Animated.View style={[styles.securityBadge, fadeInAnimation]}>
      <Text style={styles.lockIcon}>🔐</Text>
      <Text style={styles.restoreText}>Securing your session</Text>
    </Animated.View>
  </View>
);
```

**Design Philosophy:**
- **Security Communication**: Visual cue that session is being securely restored
- **Trust Building**: Professional micro-interaction during keychain access
- **Perceived Performance**: 200ms feels instant with smooth animation
- **Brand Experience**: Custom security animation instead of generic spinner

**User Experience Goals:**
- Communicate security during token restoration (keychain access)
- Reduce perceived wait time during app launch
- Build user trust through polished security interactions
- Provide context for brief loading moments

**Examples from Industry:**
- Banking apps: Security shield animations during session validation
- Password managers: Lock/unlock animations during keychain access
- Secure messaging: Encryption symbols during session restoration

**Technical Implementation:**
- Subtle fade-in animation (200ms duration)
- Security-themed iconography (🔐 → 🔓 transition)
- Professional typography: "Securing your session..."
- Accessible labels for screen readers
- Graceful fallback if animations disabled

## Next Steps After Auth
1. Implement AppNavigator with tab navigation
2. Create bags list screen
3. Add profile/settings screen
4. Implement logout functionality
5. Add biometric authentication (Face ID/Touch ID on iOS, Fingerprint on Android)