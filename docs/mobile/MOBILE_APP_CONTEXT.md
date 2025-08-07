# React Native Mobile App - Implementation Context

## Overview
This document tracks architectural decisions, patterns, and implementation details for the DiscBaboons React Native mobile app. It serves as a living reference for development consistency and AI assistance context.

## Architecture Decisions

### Theme System (Phase 1.5) ✅
**Decision**: Implement a comprehensive theme system before building UI screens

**Implementation**:
- **Three themes**: Light (default), Dark, and Blackout (high contrast)
- **ThemeContext**: Global theme state management with React Context
- **Theme structure**:
  ```javascript
  themes = {
    light: { background: '#FFFFFF', text: '#212121', ... },
    dark: { background: '#121212', text: '#FFFFFF', ... },
    blackout: { background: '#000000', text: '#FFFFFF', ... }
  }
  ```

**Key Patterns**:
1. Brand colors (primary: #ec7032, secondary: #1d1d41) remain consistent across all themes
2. Blackout theme uses only black/white except for brand orange
3. Components use `useThemeColors()` hook for theme-aware styling
4. Backward compatibility maintained through colors.js wrapper

**Files Created**:
- `src/design-system/themes.js` - Theme definitions
- `src/context/ThemeContext.js` - Theme state management
- `src/design-system/colors.js` - Deprecated, wraps light theme for compatibility

### Component Architecture

**Base Components Created**:

1. **Button Component**
   - Props: `title`, `onPress`, `variant` (primary/secondary)
   - Theme-aware styling using `useThemeColors()`
   - Primary variant: Filled with brand orange
   - Secondary variant: Outlined with border
   - Includes PropTypes and defaultProps

2. **Input Component**
   - Props: `placeholder`, `value`, `onChangeText`, `secureTextEntry`
   - Theme-aware borders and backgrounds
   - Uses surface color for background
   - Supports password fields via secureTextEntry

3. **AppContainer Component**
   - Simple wrapper component for consistent screen layout
   - Accepts children for composition pattern

### Design System

**Typography** (`src/design-system/typography.js`):
```javascript
{
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: 'normal' },
  caption: { fontSize: 14, fontWeight: 'normal' }
}
```

**Spacing** (`src/design-system/spacing.js`):
```javascript
{
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32
}
```

### Testing Strategy

**Patterns Established**:
1. All components require ThemeProvider wrapper in tests
2. TDD approach with thin slices (start with "exports function" tests)
3. Test file location: `__tests__/component-name/`
4. Integration tests use React Native Testing Library
5. Mock external dependencies appropriately

**Example Test Pattern**:
```javascript
const { getByTestId } = render(
  <ThemeProvider>
    <Component />
  </ThemeProvider>
);
```

### State Management

**AuthContext** (created but not yet implemented):
- Placeholder for authentication state
- Will handle JWT tokens and user session
- Structure ready for Phase 2 implementation

**ThemeContext** (fully implemented):
- Uses useState for theme selection
- Provides theme name and setTheme function
- useMemo optimization for context value

### Development Standards

**Linting Configuration**:
- ESLint enforces PropTypes for all components
- Requires defaultProps for all non-required props
- Function components preferred (converted from arrow functions by linter)
- Destructuring enforcement in function parameters

**File Organization**:
```
apps/mobile-app/
├── src/
│   ├── components/       # Reusable UI components
│   ├── context/         # React Context providers
│   ├── design-system/   # Colors, typography, spacing, themes
│   ├── screens/         # Screen components (next phase)
│   ├── services/        # API integration (future)
│   └── utils/          # Helper functions (future)
├── __tests__/          # Test files mirror src structure
```

## LoginScreen Implementation (Phase 2) ✅

### Architecture & Patterns

#### Component Structure
- **Functional component** with PropTypes validation
- **SafeAreaView + ScrollView** combination for proper keyboard handling
- **Theme-aware styling** using `useThemeColors()` hook
- **Platform-specific adjustments** via `Platform.select()`

#### Key Design Decisions

**1. Tab Interface**
```javascript
// Single screen handles both login and registration flows
const [activeTab, setActiveTab] = useState('signin');
```
- Sign In / Sign Up tabs with smooth transitions
- Tab switching maintains form state
- Active tab has elevated styling with theme colors

**2. Real-time Form Validation**
```javascript
const isUsernameValid = useMemo(() => username.length >= 4 && username.length <= 20, [username]);
const isPasswordValid = useMemo(() => password.length >= 8 && password.length <= 32, [password]);
const isFormValid = useMemo(() => isUsernameValid && isPasswordValid, [isUsernameValid, isPasswordValid]);
```
- Validation rules match backend requirements exactly
- Button disabled state provides immediate feedback
- No form submission without valid inputs

**3. Dual Error Source Pattern**
```javascript
{(errorMessage || loginError) && (
  <View testID="error-message" style={styles.errorContainer}>
    <Text style={styles.errorText}>{errorMessage || loginError}</Text>
  </View>
)}
```
- Props-based errors (errorMessage) for external control
- Local state errors (loginError) for API responses
- Auto-clear errors on input change for better UX

**4. Loading States**
```javascript
title={isLoading && activeTab === 'signin' ? 'Logging in...' : 'Log In'}
disabled={!isFormValid || isLoading}
```
- Loading state integrated into button text
- Form inputs remain visible during loading
- Prevents double-submission with disabled state

**5. Password Visibility Toggle**
```javascript
<Input
  placeholder="Password"  
  secureTextEntry
  showPasswordToggle  // Professional flat icons (eye-outline ↔ eye-off-outline)
  textContentType="password"
/>
```
- Modern flat icons from @react-native-vector-icons/ionicons
- Perfect vertical alignment using transform
- Theme-aware icon colors
- Full accessibility support

#### API Integration Pattern
```javascript
try {
  const { user, tokens } = await authLogin(username, password);
  triggerSuccessHaptic();
  login({ user, tokens }); // Update AuthContext
} catch (error) {
  triggerErrorHaptic();
  const errorMsg = handleNetworkError(error);
  setLoginError(errorMsg);
}
```

#### Testing Patterns Established
```javascript
describe('LoginScreen', () => {
  // 1. Component structure tests
  it('should display the DiscBaboons logo');
  it('should have username input field');
  
  // 2. Form validation tests  
  describe('Form Validation', () => {
    it('should disable login button initially when form is empty');
    it('should enable login button when both username and password are valid');
  });
  
  // 3. User interaction tests
  describe('User Interactions', () => {
    it('should call login function when valid form is submitted');
    it('should show loading state during login');
    it('should handle login errors');
  });
  
  // 4. Platform-specific tests
  describe('Platform-Specific Styling', () => {
    it('should apply iOS-specific styles');
    it('should apply Android-specific styles');
  });
  
  // 5. Password visibility toggle tests
  describe('Password Visibility Toggle', () => {
    it('should show password visibility toggle button');
    it('should toggle password visibility when pressed');
    it('should have proper accessibility labels');
  });
});
```

#### Test Coverage Achievement
- **122 tests passing** with comprehensive coverage
- Screen integration tests (25 tests)
- Component unit tests (97 tests) 
- Cross-platform behavior validation
- Accessibility compliance testing
- Error state and loading state coverage

## Implementation Progress

### Completed ✅
- [x] Basic project setup with React Navigation
- [x] Design system (colors, typography, spacing)
- [x] Theme system with light/dark/blackout modes
- [x] Base components (Button, Input, AppContainer)
- [x] Theme Context and hooks
- [x] **LoginScreen** with DiscBaboons logo and full UX
- [x] **Form validation** with real-time feedback
- [x] **API integration** with express-server endpoints
- [x] **Token Management & Security** (Phase 3) - JWT storage with keychain
- [x] **Password Visibility Toggle** (Phase 3.5) - Professional flat icons
- [x] **122+ tests passing** with comprehensive coverage

### In Progress 🚧
- [ ] RegisterScreen (Phase 4) - Following LoginScreen patterns

### Upcoming 📋
- [ ] Password recovery flow (ForgotPasswordScreen)
- [ ] Support & Legal screens
- [ ] Biometric authentication (Face ID/Touch ID)

## Key Technical Decisions

1. **No TypeScript** (for now) - Using PropTypes for type checking
2. **No Redux** - React Context sufficient for current needs
3. **No UI library** - Building custom components for full control
4. **StyleSheet.create** - For performance over inline styles
5. **Theme-aware from start** - All components built with theme support
6. **Functional Components Only** - No class components, use hooks for all logic including error boundaries

## API Integration Plans

**Endpoints to integrate**:
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/refresh
- POST /api/auth/forgot-password
- POST /api/auth/change-password

**Security approach**:
- JWT storage in react-native-keychain
- Refresh token rotation
- Auto-logout on 401 responses

## Platform-Specific Considerations

**iOS**:
- Safe area handling required for notch devices
- Platform.OS checks where needed

**Android**:
- Back button handling to be implemented
- Keyboard avoiding view considerations

## Testing Requirements

### Cross-Platform Testing
**Critical Requirement**: All features MUST be tested on both iOS and Android simulators/devices

**Testing Protocol**:
1. Run all automated tests: `npm test`
2. Manual testing on iOS Simulator
3. Manual testing on Android Emulator
4. Verify UI consistency between platforms
5. Test platform-specific features separately

**Platform-Specific Test Areas**:
- **iOS**: Safe area insets, notch handling, iOS-specific gestures
- **Android**: Back button behavior, keyboard handling, Android-specific UI patterns

### Testing Achievements

- TDD methodology strictly followed
- Components tested in isolation
- Theme switching tested
- User interactions tested (onPress, onChangeText)
- Cross-platform consistency verified on both iOS and Android
- Security-focused input field testing implemented

### Security Testing Patterns

**Critical for Mobile Apps**: Security testing is paramount in mobile development due to sensitive user data.

**Password Field Security Tests**:
```javascript
// CRITICAL: Verify password fields hide text
const passwordInput = getByPlaceholderText('Password');
expect(passwordInput.props.secureTextEntry).toBe(true);

// CONTRAST: Verify non-sensitive fields show text
const usernameInput = getByPlaceholderText('Username');
expect(usernameInput.props.secureTextEntry).toBeFalsy();
```

**Why Security Testing Matters**:
1. **Data Protection**: Prevents accidental exposure of sensitive information
2. **User Trust**: Users expect password fields to behave securely
3. **Compliance**: Many regulations require proper handling of sensitive data
4. **Regression Prevention**: Catches security regressions during refactoring

**Security Test Categories**:
- **Input Validation**: Ensure secure text entry for passwords
- **State Management**: Verify sensitive data isn't logged or exposed
- **Storage Testing**: Confirm secure storage practices (tokens, credentials)
- **Network Security**: Validate encrypted data transmission (future)

**Mobile-Specific Security Concerns**:
- **Screenshot Protection**: Sensitive screens hidden from app switcher
- **Clipboard Security**: Passwords not copied to clipboard accidentally
- **Biometric Integration**: Secure authentication methods tested
- **Background State**: App behavior when backgrounded with sensitive data

**Testing Priorities** (High to Low):
1. **🔴 CRITICAL**: Password field security, token storage, API authentication
2. **🟡 IMPORTANT**: Input validation, state exposure, clipboard protection
3. **🟢 BENEFICIAL**: Biometrics, screenshot protection, background behavior

## Next Steps

1. Create LoginScreen using established patterns
2. Implement form validation
3. Set up API service layer
4. Implement secure token storage

---

*This document should be updated as new architectural decisions are made and patterns are established.*