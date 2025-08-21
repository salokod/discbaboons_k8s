# Delivery Implementer - Navigation Testing Requirements

## Critical Navigation Testing Rules

### **MANDATORY: Integration Tests for All Navigation Changes**

When implementing ANY navigation-related code, you MUST:

1. **Write Integration Tests FIRST** - Before implementing navigation logic
2. **Test Real Navigation** - Use actual NavigationContainer, not mocks
3. **Verify Cross-Tab Navigation** - Test navigation between different tabs
4. **Validate Route Resolution** - Ensure all routes actually exist

### **Navigation Testing Architecture**

#### **Integration Test Structure (REQUIRED)**
```javascript
// Example: __tests__/navigation/[FeatureName]Navigation.integration.test.js
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabNavigator from '../../src/navigation/BottomTabNavigator';

describe('[Feature] Navigation Integration', () => {
  const renderWithNavigation = (initialRouteName = 'Bags') => {
    return render(
      <NavigationContainer>
        <BottomTabNavigator initialRouteName={initialRouteName} />
      </NavigationContainer>
    );
  };

  it('should navigate from [Source] to [Destination]', async () => {
    const { getByTestId, getByText } = renderWithNavigation();
    
    // Navigate to source screen
    fireEvent.press(getByText('[Source Screen]'));
    
    // Trigger navigation action
    fireEvent.press(getByText('[Navigation Button]'));
    
    // Verify destination screen is reached
    await waitFor(() => {
      expect(getByTestId('[destination-screen]')).toBeVisible();
    });
  });
});
```

### **Forbidden Practices**

❌ **NEVER rely solely on mocked navigation for navigation testing**
```javascript
// BAD - This can pass while app is broken:
const mockNavigate = jest.fn();
expect(mockNavigate).toHaveBeenCalledWith('SomeScreen');
```

✅ **ALWAYS test actual navigation behavior**
```javascript
// GOOD - This tests real navigation:
fireEvent.press(getByText('Navigate'));
expect(getByTestId('destination-screen')).toBeVisible();
```

### **Cross-Tab Navigation Requirements**

For navigation between tabs, you MUST:

1. **Use Proper Nested Syntax**:
```javascript
// CORRECT for cross-tab navigation:
navigation.navigate('TabName', {
  screen: 'ScreenName',
  params: { ...parameters }
});

// WRONG - will fail:
navigation.navigate('ScreenName', { ...parameters });
```

2. **Test Cross-Tab Navigation**:
```javascript
it('should navigate from [Tab1] to [Tab2]', async () => {
  // Start on Tab1
  // Navigate to Tab2 screen
  // Verify tab switch occurred
  // Verify correct screen is shown
});
```

### **Route Validation Testing**

Every navigation implementation MUST include route validation:

```javascript
// Create: __tests__/navigation/RouteValidation.test.js
describe('Route Validation', () => {
  it('should have all navigation calls reference existing routes', () => {
    // Parse all navigate() calls in source files
    // Verify each route exists in navigator definitions
    // Fail test if any route is undefined
  });
});
```

### **Test Coverage Requirements**

Navigation changes require MINIMUM test coverage:

- **60% Unit Tests**: Component logic, parameter validation
- **30% Integration Tests**: Navigation flows, route resolution  
- **10% E2E Tests**: Critical user journeys

### **Pre-Implementation Checklist**

Before starting navigation implementation:

- [ ] Integration test file created
- [ ] Navigation structure understood (which navigator contains target route)
- [ ] Cross-tab navigation syntax verified
- [ ] Route existence confirmed
- [ ] Test scenarios documented

### **Post-Implementation Verification**

After navigation implementation:

- [ ] `npm run verify` passes
- [ ] Integration tests pass with real navigation
- [ ] Manual testing confirms navigation works
- [ ] No navigation warnings in console
- [ ] Route validation tests pass

### **Common Navigation Patterns**

#### **Same Navigator Navigation**:
```javascript
navigation.navigate('ScreenName', { params });
```

#### **Cross-Tab Navigation**:
```javascript
navigation.navigate('TabName', {
  screen: 'ScreenName', 
  params: { params }
});
```

#### **Modal Navigation**:
```javascript
navigation.navigate('ModalName', { params });
// OR if modal is nested:
navigation.navigate('TabName', {
  screen: 'ModalName',
  params: { params }
});
```

### **Navigation Bug Prevention**

To prevent navigation bugs:

1. **Always verify route exists** before implementing navigation
2. **Test with real NavigationContainer** not mocks
3. **Check console for navigation warnings** during development
4. **Follow React Navigation documentation** for nested navigation
5. **Use consistent patterns** throughout the codebase

### **Emergency Bug Protocol**

If navigation bug is discovered:

1. **Immediate Fix**: Use proper nested navigation syntax
2. **Add Integration Test**: Ensure bug can't happen again
3. **Audit Similar Code**: Find other instances of same pattern
4. **Update Documentation**: Add pattern to this guide

## Examples of Required Integration Tests

### **Cross-Tab Navigation Test**:
```javascript
describe('Bags to Discover Navigation', () => {
  it('should navigate from BagDetail to DiscSearch', async () => {
    const { getByText, getByTestId } = renderWithNavigation('Bags');
    
    // Navigate to BagDetail
    fireEvent.press(getByText('Test Bag'));
    await waitFor(() => expect(getByTestId('bag-detail-screen')).toBeVisible());
    
    // Press Add Disc button
    fireEvent.press(getByText('Add Disc'));
    
    // Verify we're on Discover tab showing DiscSearch
    await waitFor(() => {
      expect(getByTestId('disc-search-screen')).toBeVisible();
    });
  });
});
```

### **Modal Navigation Test**:
```javascript
describe('Modal Navigation', () => {
  it('should open AddDiscToBag modal from DiscSearch', async () => {
    const { getByText, getByTestId } = renderWithNavigation('Discover');
    
    // Navigate to DiscSearch
    await waitFor(() => expect(getByTestId('disc-search-screen')).toBeVisible());
    
    // Select a disc to add to bag
    fireEvent.press(getByTestId('disc-item-0'));
    
    // Verify modal opens
    await waitFor(() => {
      expect(getByTestId('add-disc-to-bag-modal')).toBeVisible();
    });
  });
});
```

## Remember: Navigation that works in tests with mocks but fails in the app indicates a testing gap, not a working feature.