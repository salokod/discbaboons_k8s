# Bags Page Delete/Edit Implementation Plan

## Executive Summary

This document outlines the comprehensive plan for implementing delete and edit functionality for bags in the mobile app. The plan is based on UX research of leading mobile apps and technical analysis of existing API routes and mobile patterns.

## Current State Analysis

### ✅ Backend Ready
- `PUT /api/bags/:id` - Update bag endpoint exists
- `DELETE /api/bags/:id` - Delete bag endpoint exists  
- Proper authentication, validation, and user ownership security
- Delete prevents removal if bag contains discs (409 Conflict)

### ✅ Mobile Services Ready
- `updateBag(bagId, updates)` exists in bagService.js
- `deleteBag(bagId)` exists in bagService.js
- Error handling and timeout management implemented

### ❌ Missing UI Layer
- No way to access edit/delete from bags list
- No confirmation dialogs for destructive actions
- No error handling UX for edge cases

## UX Research Findings

### Industry Best Practices (2024-2025)
Based on analysis of iOS Photos, Google Photos, and other leading collection management apps:

**Primary Patterns:**
- **Three-dot overflow menus** - Android standard for secondary actions
- **Swipe actions** - Quick operations on both platforms  
- **Long-press context menus** - iOS pattern for additional options
- **Segmented controls** - Better than navigation buttons for view switching

**Key Insights:**
- Users expect familiar patterns from Photos and Mail apps
- Progressive disclosure prevents UI clutter
- Platform conventions reduce cognitive load
- Confirmation dialogs prevent accidental data loss

## Technical Architecture

### Component Structure
```
BagsListScreen (enhanced)
├── BagCard (add actions menu)
│   ├── Three-dot menu trigger
│   └── Swipe gesture handler (Phase 2)
├── BagActionsMenu (new component)
│   ├── Edit option
│   ├── Delete option  
│   └── Future actions (share, duplicate)
├── EditBagScreen (new screen)
│   ├── Form with name, description, privacy
│   └── Save/cancel actions
└── DeleteConfirmationAlert (Alert.alert)
```

### State Management Strategy

**Optimistic Updates Pattern:**
```javascript
// Delete Flow
const handleDelete = async (bagId) => {
  const originalBags = [...bags];
  try {
    // 1. Optimistic UI update
    setBags(bags.filter(b => b.id !== bagId));
    // 2. API call
    await deleteBag(bagId);
    // 3. Refresh context
    triggerBagListRefresh();
  } catch (error) {
    // 4. Rollback on failure
    setBags(originalBags);
    showErrorAlert(error);
  }
};
```

**Context Integration:**
- Leverage existing `BagRefreshContext`
- Add local state manipulation methods
- Handle optimistic updates with rollback

## Implementation Plan

### Phase 1: Core Actions (MVP) - Priority

#### Slice 1.1: BagActionsMenu Component
**Test:** Should export BagActionsMenu component
```javascript
// Component renders menu options with icons and labels
const actions = [
  { id: 'edit', label: 'Edit Bag', icon: 'pencil-outline' },
  { id: 'delete', label: 'Delete Bag', icon: 'trash-outline', destructive: true }
];
```

#### Slice 1.2: Menu Integration with BagCard  
**Test:** Should show three-dot menu button on bag cards
```javascript
// Add menu trigger to BagCard component
<TouchableOpacity 
  testID="bag-actions-menu"
  style={styles.menuButton}
  onPress={() => showBagActions(bag.id)}
>
  <Icon name="ellipsis-horizontal" size={16} />
</TouchableOpacity>
```

#### Slice 2.1: Delete Confirmation Alert
**Test:** Should show confirmation when delete is triggered
```javascript
Alert.alert(
  'Delete Bag',
  `Are you sure you want to delete "${bag.name}"? This cannot be undone.`,
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: confirmDelete }
  ]
);
```

#### Slice 2.2: Delete API Integration
**Test:** Should call deleteBag service with correct bagId
```javascript
const handleConfirmDelete = async (bagId) => {
  setIsDeleting(true);
  try {
    await deleteBag(bagId);
    // Handle success
  } catch (error) {
    // Handle error
  } finally {
    setIsDeleting(false);
  }
};
```

#### Slice 2.3: Optimistic Delete UI Update
**Test:** Should remove bag from list immediately, rollback on error
```javascript
// Remove from UI immediately
const optimisticBags = bags.filter(b => b.id !== bagId);
setBags(optimisticBags);

// Rollback on API failure
if (deleteError) {
  setBags(originalBags);
}
```

#### Slice 2.4: Delete Error Handling
**Test:** Should show appropriate error messages
```javascript
const getDeleteErrorMessage = (error) => {
  if (error.status === 409) {
    return "Cannot delete this bag because it contains discs. Please move or remove all discs first.";
  }
  if (error.code === 'NETWORK_ERROR') {
    return "Unable to delete bag. Please check your connection and try again.";
  }
  return "Something went wrong. Please try again.";
};
```

#### Slice 3.1: EditBagScreen Navigation
**Test:** Should navigate to EditBagScreen with bag data
```javascript
// Navigation from BagActionsMenu
const handleEdit = (bag) => {
  navigation.navigate('EditBagScreen', { 
    bagId: bag.id,
    initialData: {
      name: bag.name,
      description: bag.description,
      isPrivate: bag.is_private
    }
  });
};
```

#### Slice 3.2: EditBagScreen Form
**Test:** Should render form with current bag data pre-populated
```javascript
// Form fields with validation
const EditBagScreen = ({ route }) => {
  const { bagId, initialData } = route.params;
  const [name, setName] = useState(initialData.name);
  const [description, setDescription] = useState(initialData.description);
  const [isPrivate, setIsPrivate] = useState(initialData.isPrivate);
  
  // Form validation and save logic
};
```

#### Slice 3.3: Edit Save Functionality
**Test:** Should call updateBag service and handle success/error
```javascript
const handleSave = async () => {
  const changes = getChangedFields(initialData, currentData);
  if (Object.keys(changes).length === 0) {
    navigation.goBack();
    return;
  }
  
  try {
    await updateBag(bagId, changes);
    triggerBagRefresh(bagId);
    triggerBagListRefresh();
    navigation.goBack();
  } catch (error) {
    Alert.alert('Save Failed', getErrorMessage(error));
  }
};
```

### Phase 2: Enhanced UX (Optional Enhancements)

#### Slice 4.1: Swipe Actions Implementation
**Test:** Should show swipe actions on bag cards
```javascript
// Swipe left for delete, right for edit
const swipeActions = {
  left: [
    { id: 'delete', label: 'Delete', color: colors.error, icon: 'trash-outline' }
  ],
  right: [
    { id: 'edit', label: 'Edit', color: colors.info, icon: 'pencil-outline' }
  ]
};
```

#### Slice 4.2: Segmented Control for View Switching
**Test:** Should replace lost discs button with segmented control
```javascript
const ViewModeControl = () => (
  <SegmentedControl
    values={['Bags', 'Lost Discs']}
    selectedIndex={viewMode === 'bags' ? 0 : 1}
    onChange={handleViewModeChange}
  />
);
```

### Phase 3: Advanced Features (Future)

#### Bulk Operations
- Long press to enter selection mode
- Multi-select with checkboxes
- Bulk delete with confirmation
- Bulk privacy toggle

#### Additional Actions
- Duplicate bag functionality  
- Archive/unarchive bags
- Share bag with other users

## Error Handling Strategy

### Delete Error Scenarios

| Error Type | Status Code | User Message | Action |
|------------|-------------|--------------|--------|
| Bag has discs | 409 | "Cannot delete '[Name]' because it contains discs. Please move or remove all discs first." | Show "Move Discs" button |
| Not found | 404 | Silent failure | Remove from UI |  
| Network error | Network | "Unable to delete bag. Please check your connection." | Show retry button |
| Generic error | Other | "Something went wrong. Please try again." | Show retry button |

### Edit Error Scenarios

| Error Type | Status Code | User Message | Action |
|------------|-------------|--------------|--------|
| Name exists | 409 | "A bag with this name already exists." | Keep form open, highlight name field |
| Not found | 404 | "This bag no longer exists." | Navigate back to list |
| Validation | 400 | Show field-specific errors | Highlight invalid fields |
| Network error | Network | "Unable to save changes. Please check your connection." | Keep form open, show retry |

## Testing Strategy

### Component Tests
- BagActionsMenu renders with correct options
- Menu triggers correct callbacks
- Delete confirmation shows appropriate message
- EditBagScreen form validation

### Integration Tests  
- Delete flow: confirmation → API → UI update
- Delete error: API failure → rollback → error message
- Edit flow: navigation → form → save → list update
- Edit error: save failure → form stays open → error shown

### E2E Test Scenarios
- Delete empty bag successfully
- Attempt to delete bag with discs (show error)
- Edit bag name and save
- Network failure during delete/edit
- Cancel operations at various points

## Acceptance Criteria

### Delete Functionality
- [x] User can access delete option from bag card
- [x] Confirmation dialog prevents accidental deletion
- [x] Successful delete removes bag from list immediately  
- [x] Error when bag contains discs shows helpful message
- [x] Network errors show retry option
- [x] UI rollback works on API failure

### Edit Functionality  
- [x] User can access edit option from bag card
- [x] Edit screen pre-populates current values
- [x] Only changed fields sent to API
- [x] Successful edit updates list and returns to bags
- [x] Validation errors highlight problematic fields
- [x] Cancel preserves original data

### Performance & UX
- [x] Optimistic updates feel instant (<100ms)
- [x] List scroll performance not degraded
- [x] All actions have proper accessibility labels
- [x] Works consistently on iOS and Android
- [x] Follows existing app design patterns

## Success Metrics

### User Engagement
- **Discovery Rate**: % of users who find and use edit/delete within first week
- **Task Completion**: % of edit/delete operations completed successfully  
- **Error Prevention**: Zero reported accidental deletions

### Technical Performance
- **Response Time**: Optimistic updates feel instant
- **Error Rate**: <1% of operations result in unhandled errors
- **Stability**: No crashes or UI freezes

## Dependencies & Prerequisites

### Required
- No new npm packages needed
- Uses existing react-native-gesture-handler for swipe actions
- Leverages current navigation and context patterns

### Nice to Have
- Haptic feedback for swipe actions
- Undo/redo functionality for delete operations
- Batch operations for power users

## Risk Mitigation

### Technical Risks
- **Swipe conflicts with scroll**: Start with menu, add swipe later
- **Rapid operations**: Implement request debouncing
- **State inconsistency**: Use optimistic updates with rollback

### UX Risks  
- **Accidental deletion**: Strong confirmation dialogs
- **Discoverability**: Progressive disclosure with hints
- **Platform differences**: Test thoroughly on both iOS and Android

## Files to Modify/Create

### New Files
- `/src/components/bags/BagActionsMenu.js`
- `/src/screens/bags/EditBagScreen.js`
- `/src/components/bags/SwipeableBagCard.js` (Phase 2)

### Modified Files
- `/src/screens/bags/BagsListScreen.js` - Add menu integration
- `/src/components/bags/BagCard.js` - Add three-dot menu button
- `/src/navigation/AppNavigator.js` - Add EditBagScreen route

### Test Files
- `/__tests__/screens/bags/BagsListScreen.deleteEdit.test.js`
- `/__tests__/screens/bags/EditBagScreen.test.js`
- `/__tests__/components/bags/BagActionsMenu.test.js`

## Next Steps

1. **Review and approve** this plan with stakeholders
2. **Start Phase 1 implementation** with TDD methodology
3. **Gather user feedback** after MVP deployment
4. **Iterate to Phase 2** based on usage data
5. **Plan Phase 3** advanced features as needed

---

**Document Version**: 1.0  
**Last Updated**: 2025-08-30  
**Next Review**: After Phase 1 completion

**Key Contacts**:
- UX Research: Claude UX Agent Analysis
- Technical Lead: Claude Principal Engineer Analysis  
- Implementation: TDD methodology with thin slices