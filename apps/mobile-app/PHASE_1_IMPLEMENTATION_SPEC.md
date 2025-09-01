# Phase 1 Implementation Specification: Bag Delete/Edit Functionality

## CRITICAL EXECUTION CONSTRAINTS

### ⚠️ ABSOLUTE REQUIREMENTS FOR THE IMPLEMENTER

1. **DO NOT run any bash commands except `npm run verify`**
   - You may ONLY run `npm run verify` to check if implementation passes
   - DO NOT run `npm run lint:fix` or any other commands
   - DO NOT attempt to fix lint issues manually

2. **QUALITY STANDARDS**
   - DO NOT return any work that doesn't pass `npm run verify` completely
   - DO NOT sacrifice test quality to make verification pass
   - DO NOT delete or skip tests to achieve passing status
   - If verification fails, fix the actual issues in the code

3. **TDD METHODOLOGY**
   - Write the test FIRST for each slice
   - Then write minimal implementation to pass
   - Run `npm run verify` after EVERY slice
   - DO NOT proceed if current slice has failing tests

## IMPLEMENTATION OVERVIEW

This specification defines the exact implementation requirements for Phase 1 of bag delete/edit functionality in the mobile app. The implementation must follow existing codebase patterns exactly as documented below.

## SLICE-BY-SLICE IMPLEMENTATION GUIDE

### Slice 1.1: BagActionsMenu Component Exists

**Test First** (`__tests__/components/bags/BagActionsMenu.test.js`):
```javascript
import { render } from '@testing-library/react-native';
import BagActionsMenu from '../../../src/components/bags/BagActionsMenu';

describe('BagActionsMenu', () => {
  it('should export a function', () => {
    expect(typeof BagActionsMenu).toBe('function');
  });

  it('should render without crashing', () => {
    const { getByTestId } = render(
      <BagActionsMenu 
        visible={true}
        onClose={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    );
    expect(getByTestId('bag-actions-menu')).toBeTruthy();
  });
});
```

**Implementation** (`src/components/bags/BagActionsMenu.js`):
- Create basic component structure
- Accept props: `visible`, `onClose`, `onEdit`, `onDelete`
- Use Modal component (following existing modal patterns)
- Add testID="bag-actions-menu"

### Slice 1.2: Menu Integration with BagCard

**Test First** (enhance `__tests__/components/bags/BagCard.test.js`):
```javascript
it('should render three-dot menu button when onMenuPress is provided', () => {
  const mockOnMenuPress = jest.fn();
  const { getByTestId } = render(
    <BagCard 
      bag={mockBag}
      onPress={() => {}}
      onMenuPress={mockOnMenuPress}
    />
  );
  
  const menuButton = getByTestId('bag-card-menu-button');
  expect(menuButton).toBeTruthy();
  fireEvent.press(menuButton);
  expect(mockOnMenuPress).toHaveBeenCalledWith(mockBag);
});

it('should not render menu button when onMenuPress is not provided', () => {
  const { queryByTestId } = render(
    <BagCard 
      bag={mockBag}
      onPress={() => {}}
    />
  );
  
  expect(queryByTestId('bag-card-menu-button')).toBeNull();
});
```

**Implementation** (modify `src/components/bags/BagCard.js`):
- Add optional `onMenuPress` prop
- Add three-dot menu button in header (use `ellipsis-vertical` icon)
- Position button in top-right corner
- Only show if `onMenuPress` is provided
- Stop propagation on menu button press (don't trigger card press)

### Slice 2.1: Delete Confirmation Alert

**Test First** (`__tests__/screens/bags/BagsListScreen.deleteEdit.test.js`):
```javascript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import BagsListScreen from '../../../src/screens/bags/BagsListScreen';

jest.spyOn(Alert, 'alert');

describe('BagsListScreen - Delete/Edit Actions', () => {
  it('should show delete confirmation when delete is pressed', async () => {
    const { getByTestId } = render(<BagsListScreen />);
    
    // Wait for bags to load
    await waitFor(() => {
      expect(getByTestId('bag-card')).toBeTruthy();
    });
    
    // Open menu
    fireEvent.press(getByTestId('bag-card-menu-button'));
    
    // Press delete
    fireEvent.press(getByTestId('menu-delete-button'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Bag',
      expect.stringContaining('Are you sure'),
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({ text: 'Delete', style: 'destructive' })
      ])
    );
  });
});
```

**Implementation** (modify `src/screens/bags/BagsListScreen.js`):
- Add state for selected bag and menu visibility
- Add `handleMenuPress` to store selected bag and show menu
- Add `handleDelete` that shows Alert.alert (follow LogoutButton pattern)
- Pass handlers to BagCard components

### Slice 2.2: Delete API Integration

**Test First** (enhance previous test):
```javascript
import * as bagService from '../../../src/services/bagService';

jest.mock('../../../src/services/bagService');

it('should call deleteBag API when delete is confirmed', async () => {
  bagService.deleteBag.mockResolvedValue({ success: true });
  
  const { getByTestId } = render(<BagsListScreen />);
  await waitFor(() => expect(getByTestId('bag-card')).toBeTruthy());
  
  fireEvent.press(getByTestId('bag-card-menu-button'));
  fireEvent.press(getByTestId('menu-delete-button'));
  
  // Simulate pressing "Delete" in the Alert
  const alertCall = Alert.alert.mock.calls[0];
  const deleteButton = alertCall[2].find(btn => btn.text === 'Delete');
  await deleteButton.onPress();
  
  expect(bagService.deleteBag).toHaveBeenCalledWith(expect.any(String));
});
```

**Implementation**:
- Import `deleteBag` from bagService
- Call API in delete confirmation handler
- Add loading state during deletion

### Slice 2.3: Optimistic Delete UI Update

**Test First**:
```javascript
it('should optimistically remove bag from list on delete', async () => {
  const mockBags = [
    { id: '1', name: 'Bag 1' },
    { id: '2', name: 'Bag 2' }
  ];
  bagService.getBags.mockResolvedValue({ bags: mockBags });
  bagService.deleteBag.mockResolvedValue({ success: true });
  
  const { queryByText, getByTestId } = render(<BagsListScreen />);
  await waitFor(() => expect(queryByText('Bag 1')).toBeTruthy());
  
  // Delete Bag 1
  fireEvent.press(getByTestId('bag-card-menu-button'));
  fireEvent.press(getByTestId('menu-delete-button'));
  const deleteButton = Alert.alert.mock.calls[0][2].find(btn => btn.text === 'Delete');
  await deleteButton.onPress();
  
  // Bag should be removed immediately
  expect(queryByText('Bag 1')).toBeNull();
  expect(queryByText('Bag 2')).toBeTruthy();
});
```

**Implementation**:
- Store original bags list before delete
- Remove bag from state immediately (optimistic update)
- Use BagRefreshContext to trigger list refresh after successful delete

### Slice 2.4: Delete Error Handling

**Test First**:
```javascript
it('should show error and restore bag if delete fails with 409', async () => {
  bagService.deleteBag.mockRejectedValue({ 
    status: 409, 
    message: 'Cannot delete bag with discs' 
  });
  
  const { queryByText } = render(<BagsListScreen />);
  await waitFor(() => expect(queryByText('Bag 1')).toBeTruthy());
  
  // Attempt delete
  fireEvent.press(getByTestId('bag-card-menu-button'));
  fireEvent.press(getByTestId('menu-delete-button'));
  const deleteButton = Alert.alert.mock.calls[0][2].find(btn => btn.text === 'Delete');
  await deleteButton.onPress();
  
  // Should show error alert
  await waitFor(() => {
    const lastAlert = Alert.alert.mock.calls[Alert.alert.mock.calls.length - 1];
    expect(lastAlert[0]).toBe('Cannot Delete Bag');
    expect(lastAlert[1]).toContain('contains discs');
  });
  
  // Bag should still be in list
  expect(queryByText('Bag 1')).toBeTruthy();
});

it('should silently remove bag on 404 error', async () => {
  bagService.deleteBag.mockRejectedValue({ status: 404 });
  
  const { queryByText } = render(<BagsListScreen />);
  await waitFor(() => expect(queryByText('Bag 1')).toBeTruthy());
  
  // Attempt delete
  fireEvent.press(getByTestId('bag-card-menu-button'));
  fireEvent.press(getByTestId('menu-delete-button'));
  const deleteButton = Alert.alert.mock.calls[0][2].find(btn => btn.text === 'Delete');
  await deleteButton.onPress();
  
  // Bag should be removed (already deleted by someone else)
  expect(queryByText('Bag 1')).toBeNull();
});
```

**Implementation**:
- Catch errors in delete handler
- Check error status:
  - 409: Show "Cannot delete '[Name]' because it contains discs" alert, restore bag
  - 404: Silent success (bag already deleted)
  - Network: Show "Unable to delete bag. Please check your connection."
  - Default: Show "Something went wrong. Please try again."
- Restore original bags list on error (except 404)

### Slice 3.1: EditBagScreen Navigation

**Test First**:
```javascript
it('should navigate to EditBagScreen when edit is pressed', async () => {
  const mockNavigate = jest.fn();
  const navigation = { navigate: mockNavigate };
  
  const { getByTestId } = render(<BagsListScreen navigation={navigation} />);
  await waitFor(() => expect(getByTestId('bag-card')).toBeTruthy());
  
  fireEvent.press(getByTestId('bag-card-menu-button'));
  fireEvent.press(getByTestId('menu-edit-button'));
  
  expect(mockNavigate).toHaveBeenCalledWith('EditBag', {
    bagId: expect.any(String),
    bagName: expect.any(String),
    bagDescription: expect.any(String),
    bagPrivacy: expect.any(String)
  });
});
```

**Implementation**:
- Add `handleEdit` function in BagsListScreen
- Navigate to EditBag with bag data as params
- Close menu after navigation

### Slice 3.2: EditBagScreen Form

**Test First** (`__tests__/screens/bags/EditBagScreen.test.js`):
```javascript
import { render, fireEvent } from '@testing-library/react-native';
import EditBagScreen from '../../../src/screens/bags/EditBagScreen';

describe('EditBagScreen', () => {
  const mockRoute = {
    params: {
      bagId: '123',
      bagName: 'My Bag',
      bagDescription: 'Test description',
      bagPrivacy: 'private'
    }
  };

  it('should display current bag values in form', () => {
    const { getByDisplayValue, getByTestId } = render(
      <EditBagScreen route={mockRoute} />
    );
    
    expect(getByDisplayValue('My Bag')).toBeTruthy();
    expect(getByDisplayValue('Test description')).toBeTruthy();
    expect(getByTestId('privacy-chip-private')).toHaveProp('selected', true);
  });

  it('should enable save button when name is valid', () => {
    const { getByTestId, getByDisplayValue } = render(
      <EditBagScreen route={mockRoute} />
    );
    
    const nameInput = getByDisplayValue('My Bag');
    fireEvent.changeText(nameInput, 'Updated Bag Name');
    
    const saveButton = getByTestId('save-button');
    expect(saveButton).not.toBeDisabled();
  });

  it('should disable save button when name is empty', () => {
    const { getByTestId, getByDisplayValue } = render(
      <EditBagScreen route={mockRoute} />
    );
    
    const nameInput = getByDisplayValue('My Bag');
    fireEvent.changeText(nameInput, '');
    
    const saveButton = getByTestId('save-button');
    expect(saveButton).toBeDisabled();
  });
});
```

**Implementation** (rewrite `src/screens/bags/EditBagScreen.js`):
- Follow EditDiscScreen pattern exactly
- Initialize form with route params
- Add proper header with back button
- Use Input components for name and description
- Use FilterChip for privacy selection
- Add Cancel and Save buttons at bottom
- Validate name is not empty

### Slice 3.3: Edit Save Functionality

**Test First**:
```javascript
import * as bagService from '../../../src/services/bagService';

jest.mock('../../../src/services/bagService');

it('should call updateBag API when save is pressed', async () => {
  bagService.updateBag.mockResolvedValue({ success: true });
  const mockGoBack = jest.fn();
  
  const { getByTestId, getByDisplayValue } = render(
    <EditBagScreen 
      route={mockRoute} 
      navigation={{ goBack: mockGoBack }}
    />
  );
  
  // Change values
  const nameInput = getByDisplayValue('My Bag');
  fireEvent.changeText(nameInput, 'Updated Name');
  
  // Save
  const saveButton = getByTestId('save-button');
  fireEvent.press(saveButton);
  
  await waitFor(() => {
    expect(bagService.updateBag).toHaveBeenCalledWith('123', {
      name: 'Updated Name',
      description: 'Test description',
      privacy: 'private'
    });
    expect(mockGoBack).toHaveBeenCalled();
  });
});

it('should show error alert if update fails', async () => {
  bagService.updateBag.mockRejectedValue(new Error('Update failed'));
  jest.spyOn(Alert, 'alert');
  
  const { getByTestId } = render(<EditBagScreen route={mockRoute} />);
  
  const saveButton = getByTestId('save-button');
  fireEvent.press(saveButton);
  
  await waitFor(() => {
    expect(Alert.alert).toHaveBeenCalledWith(
      'Save Failed',
      expect.stringContaining('Failed to save'),
      [{ text: 'OK' }]
    );
  });
});
```

**Implementation**:
- Import `updateBag` from bagService
- Call API with only changed fields
- Show loading state during save
- Navigate back on success
- Show error alert on failure (follow EditDiscScreen pattern)
- Use BagRefreshContext to trigger refresh after save

## COMPONENT SPECIFICATIONS

### BagActionsMenu Component

**File**: `src/components/bags/BagActionsMenu.js`

**Structure**:
```javascript
import { memo } from 'react';
import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';

function BagActionsMenu({ visible, onClose, onEdit, onDelete }) {
  // Follow existing modal patterns from MarkAsLostModal, RecoverDiscModal
  // Use Modal with transparent background
  // Position menu as bottom sheet or dropdown
  // Include Edit and Delete options with icons
  // Add proper accessibility labels
}

BagActionsMenu.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default memo(BagActionsMenu);
```

### EditBagScreen Component (Rewrite)

**File**: `src/screens/bags/EditBagScreen.js`

**Key Requirements**:
- Follow EditDiscScreen pattern exactly
- Use route params for initial values
- Include form validation
- Handle save with loading state
- Show error alerts on failure
- Use BagRefreshContext for updates

## API INTEGRATION REQUIREMENTS

### Delete Bag
- Use existing `deleteBag` from bagService
- Handle status codes:
  - 200/204: Success
  - 404: Silent success (already deleted)
  - 409: Show conflict error (has discs)
  - Others: Generic error

### Update Bag
- Use existing `updateBag` from bagService
- Only send changed fields
- Convert privacy to API flags (is_public, is_friends_visible)
- Handle validation errors

## STATE MANAGEMENT

### Optimistic Updates
1. Store original state before operation
2. Update UI immediately
3. Rollback on error (except 404)
4. Use BagRefreshContext for cross-screen updates

### BagRefreshContext Integration
- Call `triggerBagListRefresh()` after successful delete
- Call `triggerBagRefresh(bagId)` after successful edit
- Components should already be listening via context

## ERROR MESSAGES

### Delete Errors
- 409: "Cannot delete '[BagName]' because it contains discs. Please move or remove all discs first."
- 404: (Silent - no message)
- Network: "Unable to delete bag. Please check your connection."
- Default: "Something went wrong. Please try again."

### Edit Errors
- Validation: "Bag name is required" / "Bag name must be no more than 50 characters"
- Network: "Unable to save changes. Please check your connection."
- Default: "Failed to save bag changes. Please try again."

## STYLING REQUIREMENTS

### Follow Design System
- Use existing typography definitions
- Use spacing constants
- Use useThemeColors for all colors
- Follow Platform.select patterns for iOS/Android differences

### Component Positioning
- Menu button: Top-right of BagCard
- Action menu: Modal overlay with bottom sheet or dropdown
- Forms: Follow EditDiscScreen layout

## ACCESSIBILITY

### Required Labels
- Menu button: `accessibilityLabel="Bag options menu"`
- Edit option: `accessibilityLabel="Edit bag"`
- Delete option: `accessibilityLabel="Delete bag"`
- Form inputs: Proper labels and hints
- Buttons: Clear action descriptions

### TestIDs
- `bag-card-menu-button`
- `bag-actions-menu`
- `menu-edit-button`
- `menu-delete-button`
- `edit-bag-screen`
- `save-button`
- `cancel-button`

## TESTING REQUIREMENTS

### Unit Tests
- Each component must have basic render tests
- Test prop validation
- Test event handlers
- Test conditional rendering

### Integration Tests
- Full user flows (open menu → delete → confirm)
- API error scenarios
- Optimistic update rollback
- Navigation flows

### Test Data
- Use Chance.js for unique IDs
- Use hardcoded values for business logic
- Follow Martin Fowler's Testing Pyramid

## EXECUTION ORDER

1. **Slice 1.1-1.2**: Create BagActionsMenu and integrate with BagCard
2. **Verify**: Run `npm run verify` - must pass
3. **Slice 2.1-2.4**: Implement delete flow with all error cases
4. **Verify**: Run `npm run verify` - must pass
5. **Slice 3.1-3.3**: Implement edit navigation and screen
6. **Final Verify**: Run `npm run verify` - ALL tests must pass

## SUCCESS CRITERIA

✅ All tests pass with `npm run verify`
✅ No lint errors or warnings
✅ Full test coverage for new code
✅ Follows existing patterns exactly
✅ All error cases handled gracefully
✅ Optimistic updates work correctly
✅ Cross-screen refresh via context works
✅ Accessibility labels present
✅ Cross-platform compatibility

## REMEMBER

- **DO NOT** run any commands except `npm run verify`
- **DO NOT** compromise test quality
- **DO NOT** proceed if tests are failing
- **ALWAYS** write test first, then implementation
- **ALWAYS** verify after each slice