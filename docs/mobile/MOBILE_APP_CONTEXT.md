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

## Implementation Progress

### Completed ✅
- [x] Basic project setup with React Navigation
- [x] Design system (colors, typography, spacing)
- [x] Theme system with light/dark/blackout modes
- [x] Base components (Button, Input, AppContainer)
- [x] Theme Context and hooks
- [x] 55+ tests passing with 100% success rate

### In Progress 🚧
- [ ] LoginScreen with DiscBaboons logo
- [ ] Form validation for login
- [ ] API integration setup

### Upcoming 📋
- [ ] JWT token storage with react-native-keychain
- [ ] Navigation structure (Auth vs App navigators)
- [ ] Registration flow
- [ ] Password recovery flow

## Key Technical Decisions

1. **No TypeScript** (for now) - Using PropTypes for type checking
2. **No Redux** - React Context sufficient for current needs
3. **No UI library** - Building custom components for full control
4. **StyleSheet.create** - For performance over inline styles
5. **Theme-aware from start** - All components built with theme support

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

## Next Steps

1. Create LoginScreen using established patterns
2. Implement form validation
3. Set up API service layer
4. Implement secure token storage

---

*This document should be updated as new architectural decisions are made and patterns are established.*