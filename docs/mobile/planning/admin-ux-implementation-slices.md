# Admin UX Implementation Slices - Delivery Guide

## Overview
This document provides thin, testable implementation slices for the admin UX improvements. Each slice follows TDD methodology and can be completed independently.

## Critical Implementation Order
**IMPORTANT**: These slices must be implemented in order. Each builds on the previous one.

---

## SLICE 1: Add Admin Theme Colors
**Estimated Time**: 15 minutes

### Objective
Add admin-specific colors to the theme system for visual differentiation

### Context
- File: `/apps/mobile-app/src/design-system/themes.js`
- Current themes: light, dark, blackout
- Pattern: Each theme is an object with color properties

### Test First
```javascript
// __tests__/design-system/themes.test.js
describe('Admin theme colors', () => {
  it('should have adminAccent color in light theme', () => {
    expect(themes.light.adminAccent).toBe('#FFD700');
  });
  
  it('should have adminBackground color in light theme', () => {
    expect(themes.light.adminBackground).toBe('rgba(255, 215, 0, 0.1)');
  });
  
  it('should have adminAccent color in dark theme', () => {
    expect(themes.dark.adminAccent).toBe('#FFD700');
  });
  
  it('should have adminBackground color in dark theme', () => {
    expect(themes.dark.adminBackground).toBe('rgba(255, 215, 0, 0.15)');
  });
  
  it('should have adminAccent in blackout theme', () => {
    expect(themes.blackout.adminAccent).toBe('#FFFFFF');
  });
});
```

### Implementation
Add to each theme object:
- `adminAccent`: Gold color for badges/icons
- `adminBackground`: Subtle background for admin sections

### Acceptance Criteria
- [ ] Tests pass for all three themes
- [ ] Colors accessible via `useThemeColors().adminAccent`
- [ ] No visual regression in existing components

---

## SLICE 2: Create AdminBadge Component
**Estimated Time**: 30 minutes

### Objective
Create a reusable component to indicate admin status

### Context
- Location: `/apps/mobile-app/src/components/settings/AdminBadge.js`
- Pattern: Follow existing component patterns (see Button.js)
- Dependencies: useThemeColors, Icon from ionicons

### Test First
```javascript
// __tests__/components/settings/AdminBadge.test.js
import { render, screen } from '@testing-library/react-native';
import AdminBadge from '../../../src/components/settings/AdminBadge';

describe('AdminBadge', () => {
  it('should export a component', () => {
    expect(AdminBadge).toBeDefined();
  });
  
  it('should render Admin text', () => {
    render(<AdminBadge />);
    expect(screen.getByText('Admin')).toBeTruthy();
  });
  
  it('should have testID for testing', () => {
    render(<AdminBadge />);
    expect(screen.getByTestId('admin-badge')).toBeTruthy();
  });
  
  it('should accept size prop', () => {
    const { rerender } = render(<AdminBadge size="small" />);
    expect(screen.getByTestId('admin-badge-small')).toBeTruthy();
    
    rerender(<AdminBadge size="large" />);
    expect(screen.getByTestId('admin-badge-large')).toBeTruthy();
  });
});
```

### Implementation Requirements
- Shield icon with "Admin" text
- Two sizes: 'small' (default) and 'large'
- Use adminAccent color from theme
- Horizontal layout with icon + text

### Acceptance Criteria
- [ ] Component renders with icon and text
- [ ] Respects size prop
- [ ] Uses theme colors correctly
- [ ] Has proper testIDs

---

## SLICE 3: Add AdminBadge to SettingsDrawer Header
**Estimated Time**: 20 minutes

### Objective
Display admin badge in user info section for admin users

### Context
- File: `/apps/mobile-app/src/components/settings/SettingsDrawer.js`
- Location: User info section (lines 147-160)
- Pattern: Conditional rendering based on `user?.isAdmin`

### Test First
```javascript
// __tests__/components/settings/SettingsDrawer.test.js
it('should show admin badge for admin users', () => {
  const adminUser = { 
    username: 'admin', 
    email: 'admin@test.com', 
    isAdmin: true 
  };
  const authValue = { ...mockAuthContextValue, user: adminUser };
  
  render(
    <AuthContext.Provider value={authValue}>
      <SettingsDrawer navigation={mockNavigation} />
    </AuthContext.Provider>
  );
  
  expect(screen.getByTestId('admin-badge')).toBeTruthy();
});

it('should not show admin badge for regular users', () => {
  render(
    <TestWrapper>
      <SettingsDrawer navigation={mockNavigation} />
    </TestWrapper>
  );
  
  expect(screen.queryByTestId('admin-badge')).toBeNull();
});
```

### Implementation
- Import AdminBadge component
- Add after email display in user info section
- Conditionally render: `{user?.isAdmin && <AdminBadge size="small" />}`

### Acceptance Criteria
- [ ] Badge appears for admin users
- [ ] Badge hidden for regular users
- [ ] Proper spacing/alignment

---

## SLICE 4: Add Section Header Styling
**Estimated Time**: 25 minutes

### Objective
Create consistent section headers for drawer navigation

### Context
- No existing section headers in SettingsDrawer
- Need visual grouping for navigation items
- Pattern: Similar to sections in SettingsScreen.js

### Test First
```javascript
// __tests__/components/settings/SettingsDrawer.test.js
describe('Section headers', () => {
  it('should render Disc Database section header', () => {
    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>
    );
    
    expect(screen.getByText('Disc Database')).toBeTruthy();
  });
  
  it('should render section with appropriate styling', () => {
    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>
    );
    
    const section = screen.getByTestId('disc-database-section');
    expect(section).toBeTruthy();
  });
});
```

### Implementation
Add to styles:
```javascript
sectionHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.md,
  paddingBottom: spacing.sm,
},
sectionTitle: {
  ...typography.caption,
  color: colors.textLight,
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginLeft: spacing.sm,
}
```

### Acceptance Criteria
- [ ] Section headers display correctly
- [ ] Proper typography and spacing
- [ ] Consistent with app design language

---

## SLICE 5: Add Search Discs Navigation
**Estimated Time**: 20 minutes

### Objective
Add navigation to DiscSearchScreen from drawer

### Context
- Target: Navigate to 'App' stack, screen 'DiscSearchScreen'
- Pattern: Same as existing Settings/About navigation
- Icon: 'search-outline'

### Test First
```javascript
// __tests__/components/settings/SettingsDrawer.test.js
it('should navigate to DiscSearchScreen when Search Discs pressed', () => {
  render(
    <TestWrapper>
      <SettingsDrawer navigation={mockNavigation} />
    </TestWrapper>
  );
  
  const searchButton = screen.getByText('Search Discs');
  fireEvent.press(searchButton);
  
  expect(mockNavigation.navigate).toHaveBeenCalledWith(
    'App', 
    { screen: 'DiscSearchScreen' }
  );
  expect(mockNavigation.closeDrawer).toHaveBeenCalled();
});
```

### Implementation
```javascript
const handleSearchDiscsPress = () => {
  navigation.navigate('App', { screen: 'DiscSearchScreen' });
  navigation.closeDrawer();
};

// In render, under Disc Database section:
<TouchableOpacity
  testID="search-discs-nav-item"
  style={styles.navItem}
  onPress={handleSearchDiscsPress}
>
  <Icon name="search-outline" size={20} color={colors.primary} />
  <Text style={styles.navText}>Search Discs</Text>
</TouchableOpacity>
```

### Acceptance Criteria
- [ ] Navigation item visible to all users
- [ ] Navigates to DiscSearchScreen
- [ ] Closes drawer after navigation

---

## SLICE 6: Add Submit New Disc Navigation
**Estimated Time**: 15 minutes

### Objective
Add navigation to SubmitDiscScreen from drawer

### Context
- Target: Navigate to 'App' stack, screen 'SubmitDiscScreen'
- Pattern: Modal presentation (same as CreateBag)
- Icon: 'add-circle-outline'

### Test First
```javascript
// __tests__/components/settings/SettingsDrawer.test.js
it('should navigate to SubmitDiscScreen when Submit New Disc pressed', () => {
  render(
    <TestWrapper>
      <SettingsDrawer navigation={mockNavigation} />
    </TestWrapper>
  );
  
  const submitButton = screen.getByText('Submit New Disc');
  fireEvent.press(submitButton);
  
  expect(mockNavigation.navigate).toHaveBeenCalledWith(
    'App', 
    { screen: 'SubmitDiscScreen' }
  );
  expect(mockNavigation.closeDrawer).toHaveBeenCalled();
});
```

### Implementation
```javascript
const handleSubmitDiscPress = () => {
  navigation.navigate('App', { screen: 'SubmitDiscScreen' });
  navigation.closeDrawer();
};

// Add after Search Discs item
<TouchableOpacity
  testID="submit-disc-nav-item"
  style={styles.navItem}
  onPress={handleSubmitDiscPress}
>
  <Icon name="add-circle-outline" size={20} color={colors.primary} />
  <Text style={styles.navText}>Submit New Disc</Text>
</TouchableOpacity>
```

### Acceptance Criteria
- [ ] Navigation item visible to all users
- [ ] Navigates to SubmitDiscScreen
- [ ] Proper icon and styling

---

## SLICE 7: Add Admin Section (Conditional)
**Estimated Time**: 30 minutes

### Objective
Add administration section visible only to admin users

### Context
- Conditional rendering based on `user?.isAdmin`
- New section between Disc Database and Settings
- Different styling to indicate admin features

### Test First
```javascript
// __tests__/components/settings/SettingsDrawer.test.js
describe('Admin section', () => {
  it('should show admin section for admin users', () => {
    const adminUser = { 
      username: 'admin', 
      email: 'admin@test.com', 
      isAdmin: true 
    };
    const authValue = { ...mockAuthContextValue, user: adminUser };
    
    render(
      <AuthContext.Provider value={authValue}>
        <SettingsDrawer navigation={mockNavigation} />
      </AuthContext.Provider>
    );
    
    expect(screen.getByText('Administration')).toBeTruthy();
    expect(screen.getByTestId('admin-section')).toBeTruthy();
  });
  
  it('should not show admin section for regular users', () => {
    render(
      <TestWrapper>
        <SettingsDrawer navigation={mockNavigation} />
      </TestWrapper>
    );
    
    expect(screen.queryByText('Administration')).toBeNull();
    expect(screen.queryByTestId('admin-section')).toBeNull();
  });
});
```

### Implementation
```javascript
// After Disc Database section, before Settings:
{user?.isAdmin && (
  <View testID="admin-section">
    <View style={styles.sectionHeader}>
      <Icon name="shield-checkmark" size={16} color={colors.adminAccent} />
      <Text style={[styles.sectionTitle, { color: colors.adminAccent }]}>
        Administration
      </Text>
    </View>
    {/* Admin items will go here */}
  </View>
)}
```

### Acceptance Criteria
- [ ] Section only visible to admin users
- [ ] Uses admin accent color
- [ ] Proper section structure

---

## SLICE 8: Add Pending Discs Navigation (Admin)
**Estimated Time**: 20 minutes

### Objective
Add navigation to AdminDiscScreen for pending disc approvals

### Context
- Only visible within admin section
- Target: Navigate to 'App' stack, screen 'AdminDiscScreen'
- Icon: 'time-outline' (indicating pending)

### Test First
```javascript
// __tests__/components/settings/SettingsDrawer.test.js
it('should navigate to AdminDiscScreen when Pending Discs pressed', () => {
  const adminUser = { 
    username: 'admin', 
    email: 'admin@test.com', 
    isAdmin: true 
  };
  const authValue = { ...mockAuthContextValue, user: adminUser };
  
  render(
    <AuthContext.Provider value={authValue}>
      <SettingsDrawer navigation={mockNavigation} />
    </AuthContext.Provider>
  );
  
  const pendingButton = screen.getByText('Pending Discs');
  fireEvent.press(pendingButton);
  
  expect(mockNavigation.navigate).toHaveBeenCalledWith(
    'App', 
    { screen: 'AdminDiscScreen' }
  );
});
```

### Implementation
```javascript
const handlePendingDiscsPress = () => {
  navigation.navigate('App', { screen: 'AdminDiscScreen' });
  navigation.closeDrawer();
};

// Inside admin section:
<TouchableOpacity
  testID="pending-discs-nav-item"
  style={[styles.navItem, styles.adminNavItem]}
  onPress={handlePendingDiscsPress}
>
  <Icon name="time-outline" size={20} color={colors.adminAccent} />
  <Text style={[styles.navText, { color: colors.text }]}>
    Pending Discs
  </Text>
</TouchableOpacity>
```

### Acceptance Criteria
- [ ] Only visible to admin users
- [ ] Navigates to AdminDiscScreen
- [ ] Uses admin styling

---

## SLICE 9: Remove Submit Disc from EmptyBagsScreen
**Estimated Time**: 15 minutes

### Objective
Remove "Submit New Disc" button from EmptyBagsScreen

### Context
- File: `/apps/mobile-app/src/screens/bags/EmptyBagsScreen.js`
- Lines to remove: 92-97 (Submit New Disc button)
- Keep: Search Discs button

### Test First
```javascript
// __tests__/screens/bags/EmptyBagsScreen.test.js
it('should not render Submit New Disc button', () => {
  render(<EmptyBagsScreen navigation={mockNavigation} />);
  expect(screen.queryByText('Submit New Disc')).toBeNull();
});

it('should still render Search Discs button', () => {
  render(<EmptyBagsScreen navigation={mockNavigation} />);
  expect(screen.getByText('Search Discs')).toBeTruthy();
});
```

### Implementation
- Remove Submit New Disc Button component
- Adjust buttonRow styling if needed
- Update button style to center single button

### Acceptance Criteria
- [ ] Submit New Disc button removed
- [ ] Search Discs button remains
- [ ] Layout still looks good

---

## SLICE 10: Remove Admin Section from EmptyBagsScreen
**Estimated Time**: 15 minutes

### Objective
Remove admin features from EmptyBagsScreen

### Context
- File: `/apps/mobile-app/src/screens/bags/EmptyBagsScreen.js`
- Lines to remove: 100-108 (Admin conditional section)

### Test First
```javascript
// __tests__/screens/bags/EmptyBagsScreen.test.js
it('should not render admin section for admin users', () => {
  const adminUser = { isAdmin: true };
  const authValue = { user: adminUser };
  
  render(
    <AuthContext.Provider value={authValue}>
      <EmptyBagsScreen navigation={mockNavigation} />
    </AuthContext.Provider>
  );
  
  expect(screen.queryByText('Admin: Approve Discs')).toBeNull();
});
```

### Implementation
- Remove entire conditional admin section
- Clean up unused imports if any

### Acceptance Criteria
- [ ] No admin features on EmptyBagsScreen
- [ ] Tests pass
- [ ] No broken functionality

---

## SLICE 11: Add Accessibility Labels
**Estimated Time**: 20 minutes

### Objective
Ensure all new navigation items have proper accessibility

### Context
- All TouchableOpacity components need accessibilityLabel
- All sections need accessibilityRole

### Test First
```javascript
// __tests__/components/settings/SettingsDrawer.test.js
it('should have accessibility labels for navigation items', () => {
  render(
    <TestWrapper>
      <SettingsDrawer navigation={mockNavigation} />
    </TestWrapper>
  );
  
  const searchDiscs = screen.getByText('Search Discs');
  expect(searchDiscs.parent.props.accessibilityLabel).toBe(
    'Navigate to disc search'
  );
  
  const submitDisc = screen.getByText('Submit New Disc');
  expect(submitDisc.parent.props.accessibilityLabel).toBe(
    'Navigate to submit new disc'
  );
});
```

### Implementation
Add to each TouchableOpacity:
```javascript
accessibilityLabel="Navigate to [destination]"
accessibilityRole="button"
accessibilityHint="Double tap to navigate"
```

### Acceptance Criteria
- [ ] All nav items have labels
- [ ] Screen readers work correctly
- [ ] Meaningful descriptions

---

## SLICE 12: Performance Optimization
**Estimated Time**: 25 minutes

### Objective
Optimize SettingsDrawer for performance

### Context
- Drawer should open quickly
- Minimize re-renders
- Use React.memo appropriately

### Test First
```javascript
// __tests__/components/settings/SettingsDrawer.performance.test.js
it('should not re-render when props do not change', () => {
  const renderSpy = jest.fn();
  const TestComponent = () => {
    renderSpy();
    return <SettingsDrawer navigation={mockNavigation} />;
  };
  
  const { rerender } = render(<TestWrapper><TestComponent /></TestWrapper>);
  expect(renderSpy).toHaveBeenCalledTimes(1);
  
  rerender(<TestWrapper><TestComponent /></TestWrapper>);
  expect(renderSpy).toHaveBeenCalledTimes(1); // Should not re-render
});
```

### Implementation
- Wrap navigation handlers in useCallback
- Ensure component is wrapped in memo
- Move styles outside component or use useMemo

### Acceptance Criteria
- [ ] Drawer opens in < 100ms
- [ ] No unnecessary re-renders
- [ ] Smooth scrolling

---

## Testing Checklist

### After Each Slice
- [ ] Run tests: `npm test [test-file]`
- [ ] Check linting: `npm run lint`
- [ ] Manual testing on iOS simulator
- [ ] Manual testing on Android emulator
- [ ] Verify no regression in existing features

### Integration Testing (After All Slices)
- [ ] Admin can access all admin features
- [ ] Regular users cannot see admin features
- [ ] All navigation paths work
- [ ] Drawer performance acceptable
- [ ] Theme compatibility (light/dark/blackout)

## Common Issues & Solutions

### Issue: Navigation.navigate is undefined
**Solution**: Ensure navigation prop is passed correctly from DrawerNavigator

### Issue: Theme colors not updating
**Solution**: Check ThemeContext provider wrapping, use useThemeColors hook

### Issue: Admin badge not showing
**Solution**: Verify user.isAdmin is boolean, not string

### Issue: Test failing with "cannot find element"
**Solution**: Check testID matches, ensure proper test wrapper with providers

## Definition of Done for Each Slice

- [ ] Test written and failing (Red)
- [ ] Implementation complete (Green)
- [ ] Tests passing
- [ ] No linting errors
- [ ] Code reviewed
- [ ] Works on iOS
- [ ] Works on Android
- [ ] No performance regression
- [ ] Accessibility verified