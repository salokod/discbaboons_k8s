# React Native PR Review Guide

## Overview
This guide ensures consistent, high-quality code reviews for our React Native mobile app, following Martin Fowler's testing pyramid principles and using MoSCoW prioritization.

## Review Categories (MoSCoW)

### 🔴 MUST Fix (Blocking - PR cannot be merged)

#### Security & Data Protection
- [ ] No hardcoded API keys, secrets, or sensitive data
- [ ] No sensitive data stored in AsyncStorage (use react-native-keychain)
- [ ] All API calls use proper authentication headers
- [ ] No console.log statements with sensitive information

#### Cross-Platform Consistency
- [ ] UI renders identically on iOS and Android (unless platform-specific is justified)
- [ ] All platform-specific code uses Platform.OS or Platform.select
- [ ] Safe area handling implemented (notches, status bars)
- [ ] Keyboard handling works correctly on both platforms

#### Performance & Memory
- [ ] Large lists use FlatList/SectionList (not ScrollView with map)
- [ ] Images are optimized and use proper sizing
- [ ] No memory leaks (cleanup in useEffect returns)
- [ ] Heavy computations wrapped in useMemo/useCallback

#### Testing (Martin Fowler's Pyramid)
- [ ] Unit tests for all business logic and utilities
- [ ] Component tests for all new/modified components
- [ ] Integration tests for navigation flows
- [ ] All tests pass on both iOS and Android

#### Core Functionality
- [ ] Error boundaries implemented for crash protection
- [ ] Loading states for all async operations
- [ ] Error states with user-friendly messages
- [ ] Offline handling where applicable

### 🟡 SHOULD Fix (Important but not blocking)

#### Code Quality & Consistency
- [ ] Components use ThemeContext for all colors
- [ ] PropTypes defined for all props
- [ ] defaultProps provided for optional props
- [ ] Consistent naming conventions (PascalCase components, camelCase functions)
- [ ] No unused imports or variables

#### Accessibility
- [ ] accessibilityLabel on interactive elements
- [ ] accessibilityHint where helpful
- [ ] testID for e2e testing
- [ ] Proper focus management

#### State Management
- [ ] Local state vs context usage is appropriate
- [ ] No unnecessary re-renders (check with React DevTools)
- [ ] Form validation provides immediate feedback
- [ ] State updates are batched when possible

#### Testing Coverage
- [ ] Edge cases covered in tests
- [ ] Error scenarios tested
- [ ] User interactions tested (onPress, onChangeText, etc.)
- [ ] Navigation flows tested

### 🟢 COULD Do (Nice to have improvements)

#### Performance Optimizations
- [ ] Components wrapped in React.memo where beneficial
- [ ] Lazy loading for heavy screens
- [ ] Image caching strategies
- [ ] Bundle size optimization

#### Developer Experience
- [ ] Helpful code comments for complex logic
- [ ] Storybook stories for reusable components
- [ ] TypeScript types (if using TS)
- [ ] README updates for new features

#### UI/UX Enhancements
- [ ] Smooth animations and transitions
- [ ] Haptic feedback (where appropriate)
- [ ] Pull-to-refresh on lists
- [ ] Skeleton loaders instead of spinners

### ⚫ WON'T Do (Out of scope)
Document any suggestions that are out of scope for this PR but might be valuable for future work.

## Review Checklist

### Before Reviewing
1. Pull the branch locally
2. Run the app on both iOS and Android simulators
3. Run all tests: `npm test`
4. Check lint: `npm run lint`

### During Review

#### Logic & Architecture
- **Question**: Is this the simplest solution that could work?
- **Question**: Could this be reused elsewhere?
- **Question**: Are there existing patterns in the codebase this should follow?
- **Check**: No duplicate code that could be extracted
- **Check**: Separation of concerns (UI, business logic, data)

#### Readability
- Can you understand what the code does without extensive comments?
- Are variable and function names descriptive?
- Is the code flow easy to follow?
- Are complex sections documented?

#### Reusability
- Are components generic enough to be reused?
- Is business logic separated from UI components?
- Are utilities extracted to shared folders?
- Could this benefit other parts of the app?

#### Testing Pyramid (Martin Fowler)
```
         /\
        /e2e\      (Few - Critical user journeys)
       /------\
      /  Int.  \   (Some - Component integration)
     /----------\
    /   Unit     \ (Many - Business logic, utilities)
   /--------------\
```

- **Unit Tests**: Pure functions, utilities, reducers
- **Integration Tests**: Component behavior, navigation
- **E2E Tests**: Critical user paths only

### Platform-Specific Checks

#### iOS
- [ ] Tested on iPhone with notch
- [ ] Tested on iPad (if supporting tablets)
- [ ] Safe areas handled correctly
- [ ] iOS-specific features work (if any)

#### Android
- [ ] Tested on different screen sizes
- [ ] Back button behavior correct
- [ ] Android-specific features work (if any)
- [ ] Keyboard handling doesn't break layout

## Example Review Comment Format

```markdown
**[MUST/SHOULD/COULD]** - Brief description

**Issue**: Detailed explanation of the problem
**Suggestion**: How to fix it
**Example**: Code snippet if helpful

**Question**: Any clarifying questions about the implementation choice
```

## Common Issues to Watch For

### Performance
- Inline function definitions in render (causes unnecessary re-renders)
- Missing key props in lists
- Large images not optimized
- Unnecessary state updates

### Security
- API keys in code
- Sensitive data in logs
- Unvalidated user input
- Missing authentication checks

### Cross-Platform
- Hardcoded dimensions instead of responsive design
- Platform-specific components without fallbacks
- Different behavior between platforms
- Style differences not justified

### Testing
- Missing test cases for error states
- No tests for user interactions
- Platform-specific behavior not tested
- Async operations not properly tested

## Review Response Guidelines

### For Reviewers
1. Be specific and constructive
2. Provide examples when possible
3. Acknowledge good patterns you see
4. Ask questions to understand context
5. Use MoSCoW categorization consistently

### for PR Authors
1. Respond to all comments
2. Explain implementation choices
3. Update PR description with changes made
4. Re-request review after addressing feedback
5. Document any WON'T items for future consideration

## Quick Reference

### Must-Have Patterns
```javascript
// Theme-aware components
const colors = useThemeColors();

// Proper cleanup
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);

// Platform handling
const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
});

// Error boundaries
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### Red Flags
```javascript
// ❌ Hardcoded colors
style={{ color: '#000000' }}

// ❌ Console logs
console.log(userToken);

// ❌ No error handling
const data = await fetch(url);

// ❌ No loading state
return loading ? <List /> : null;
```

## Enforcement

- All PRs require at least one approval
- All MUST items must be addressed before merge
- SHOULD items should be addressed or justified
- COULD items are optional but encouraged
- Automated checks run for linting and tests

This guide ensures consistent, high-quality React Native code that works reliably across platforms while maintaining excellent user experience and developer maintainability.