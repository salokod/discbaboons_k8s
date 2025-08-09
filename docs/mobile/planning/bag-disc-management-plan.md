# Bag and Disc Management Implementation Plan

## Overview
Complete bag and disc management system for the DiscBaboons mobile app, emphasizing intuitive UX patterns and efficient disc organization workflows.

## User Experience Design

### UX Decisions Based on Best Practices

#### **Sorting & Filtering**
- **Primary Sort**: Speed (ascending 1-15) - logical disc golf organization
- **Filter UI**: Collapsible filter bar with chips for active filters  
- **Available Filters**: Speed, Glide, Turn, Fade, Brand, Model, Condition, Plastic Type
- **Pattern**: Similar to Apple Music/Spotify filtering - clean, discoverable

#### **Multi-Select UI** 
- **Hidden by Default**: Clean interface showing disc info
- **Activation**: "Select" button in top-right → slides in checkboxes + bottom action bar
- **Pattern**: iOS Photos app style - maintains clean view until needed

#### **Move Discs UX**
- **Bottom Sheet Modal**: Slides up from bottom, shows all bags with disc counts
- **Quick Actions**: "Create New Bag" option directly in modal
- **Pattern**: Apple Notes "Move to Folder" - familiar, efficient

#### **Color Indication**
- **Simple Circle**: 16px colored circle, right-aligned in disc row  
- **Tooltip**: Long-press for plastic type details
- **Pattern**: Calendar app color coding - clean, informative

## User Flow Design

### **1. Landing Experience (Empty State)**
```
EmptyBagsScreen
├── Hero Illustration (disc bag graphic)
├── "Start Your Collection"
├── "Create your first bag to organize your discs"
├── Primary CTA: "Create First Bag"
├── Secondary: "Browse Discs First"
└── Dismissible tips carousel
```

### **2. Bags List Screen**
```
BagsListScreen
├── SearchBar (filter bags by name)
├── Create Bag FAB (+ icon)
├── Bag Cards:
│   ├── Name + Description preview
│   ├── "X discs" count
│   ├── Privacy icons (🔒 private, 👥 friends, 🌍 public)
│   └── Swipe actions: Edit | Duplicate | Delete
└── Pull-to-refresh support
```

### **3. Bag Detail Screen (The Main Experience)**
```
BagDetailScreen
├── Header:
│   ├── Bag name + edit button
│   ├── Description + disc count
│   └── Actions: Select | Sort | Filter
├── Filter Bar (collapsible):
│   ├── Speed: [1-15] | Glide: [1-7] | Turn: [-5-2] | Fade: [0-5]
│   ├── Brand dropdown | Condition chips
│   └── Clear filters
├── Sort Options:
│   ├── Speed (default) | Brand | Model | Recently Added
│   └── Ascending/Descending toggle
├── Disc Rows (full width):
│   ├── [Checkbox] DiscName (Brand)
│   ├── Speed | Glide | Turn | Fade
│   ├── Color● (16px circle)
│   └── Swipe: Edit | Move | Lost
├── Multi-Select Mode:
│   ├── Bottom Action Bar slides up
│   ├── "Move X discs" | "Mark X lost" | "Remove X"
│   └── "Cancel" button
└── FAB: "Add Disc" (+ icon)
```

### **4. Add Disc Flow**
```
DiscSearchScreen
├── Search bar (model/brand search)
├── Quick Filters (Speed ranges):
│   ├── Putters (1-4) | Mids (4-6) | Fairways (6-9) | Drivers (9+)
├── Advanced Filters (expandable):
│   ├── Speed, Glide, Turn, Fade sliders
│   └── Brand multi-select
├── Disc Results:
│   ├── Brand Model | Speed Glide Turn Fade
│   ├── Tap → DiscCustomizationScreen
└── "Can't find your disc?" → Add Custom Disc
```

### **5. Move Discs Modal**
```
MoveBagsBottomSheet
├── "Move X discs to..."
├── Bag List:
│   ├── BagName (X discs)
│   ├── Create New Bag button
├── Confirmation: "Moved X discs to BagName"
└── Slide down to dismiss
```

## Technical Architecture

### **Screen Components**
```
src/screens/bags/
├── EmptyBagsScreen.js          # First-time user experience
├── BagsListScreen.js           # All user bags with search
├── BagDetailScreen.js          # Individual bag with disc list  
├── CreateBagScreen.js          # Create new bag form
├── EditBagScreen.js            # Edit existing bag
└── DiscSearchScreen.js         # Search master disc database
```

### **Design System Components** (extends existing `src/design-system/`)
```
src/design-system/components/
├── Card.js                     # Base card component (for BagCard, DiscCard)
├── FilterChip.js               # Filter selection chips
├── SearchBar.js                # Reusable search input
├── BottomSheet.js              # Modal bottom sheet container
├── EmptyState.js               # Empty state with illustration
├── LoadingSpinner.js           # Consistent loading indicator
└── ActionBar.js                # Bottom action bar for multi-select
```

### **Bag-Specific Components** (uses design system components)
```
src/components/bags/
├── BagCard.js                  # Uses Card + theme colors
├── DiscRow.js                  # Uses typography + spacing constants  
├── DiscFilters.js              # Uses FilterChip + BottomSheet
├── DiscSorter.js               # Uses FilterChip + typography
├── MoveBagsModal.js            # Uses BottomSheet + Card
├── DiscColorIndicator.js       # Simple themed circle component
└── MultiSelectBar.js           # Uses ActionBar + Button components
```

### **Service Layer**
```
src/services/
├── bagService.js               # GET/POST/PUT/DELETE bags
├── discService.js              # GET master discs with filtering
├── bagContentsService.js       # Add/edit/remove discs from bags
└── discSearchService.js        # Advanced disc search with caching
```

## API Service Layer Design

### **bagService.js**
```javascript
// Handles all bag CRUD operations
const bagService = {
  getBags: (params = {}) => GET /api/bags with pagination,
  createBag: (bagData) => POST /api/bags,  
  updateBag: (bagId, updates) => PUT /api/bags/:id,
  deleteBag: (bagId) => DELETE /api/bags/:id,
  
  // Helper methods
  validateBagName: (name) => client-side validation,
  checkNameUniqueness: (name) => real-time availability check
};
```

### **discService.js**  
```javascript
// Master disc database operations
const discService = {
  searchDiscs: (filters) => GET /api/discs/master with complex filtering,
  getDiscById: (discId) => GET /api/discs/master/:id,
  
  // Search optimization
  buildSearchQuery: (filters) => construct API query params,
  cacheSearchResults: (query, results) => performance optimization
};
```

### **bagContentsService.js**
```javascript
// Disc-in-bag operations
const bagContentsService = {
  getBagContents: (bagId) => GET /api/bags/:id (includes disc details),
  addDiscToBag: (bagId, discData) => POST /api/bags/:id/discs,
  updateDiscInBag: (contentId, updates) => PUT /api/bags/:id/discs/:contentId,  
  removeDiscFromBag: (contentId) => DELETE /api/bags/discs/:contentId,
  markDiscLost: (contentId) => PATCH /api/bags/discs/:contentId/lost,
  
  // Bulk operations
  moveDiscs: (contentIds, targetBagId) => bulk move operation,
  markMultipleDiscsLost: (contentIds) => bulk lost marking
};
```

## TDD Implementation Phases

### **Phase 1: Foundation & Design System Extension** ✅ COMPLETE
**TDD Focus**: Component exports, navigation, theme integration, reusable components
- [x] **Design System Extension**: Created 4 foundational components (Card, FilterChip, SearchBar, EmptyState)
- [x] Update App.js navigation to include BagsNavigator with proper ErrorBoundary wrapping
- [x] Create EmptyBagsScreen using EmptyState component with professional hero experience
- [x] Implement BagsListScreen with empty state detection and proper theme integration
- [x] Full theme integration using existing useThemeColors() hook across all components
- [x] Cross-platform styling with Platform.select() for iOS/Android consistency

**Phase 1 Achievements:**
✅ **353 total tests passing** (321 unit + 32 integration) - Zero test failures
✅ **Zero linting errors** - All code follows established patterns and quality standards
✅ **4 reusable design system components** - Card, FilterChip, SearchBar, EmptyState
✅ **Professional empty state UX** - Hero experience with clear CTAs for new users
✅ **Complete navigation integration** - AuthNavigator ↔ AppNavigator flow working
✅ **Full theme support** - All components adapt to light, dark, and blackout themes
✅ **TDD methodology maintained** - Every component tested before implementation

**Files Created/Enhanced:**
- `src/design-system/components/Card.js` + tests - Base card with shadows and theme integration
- `src/design-system/components/FilterChip.js` + tests - Selection chips extending Button patterns
- `src/design-system/components/SearchBar.js` + tests - Search input with clear functionality
- `src/design-system/components/EmptyState.js` + tests - Hero experiences with actions
- `src/screens/bags/EmptyBagsScreen.js` + tests - Professional onboarding experience
- `src/screens/bags/BagsListScreen.js` + tests - Main bags list with empty state handling
- `App.js` - Updated with BagsNavigator integration and proper ErrorBoundary wrapping

**Learning Focus Completed**: Design system extension, component composition, theme consistency, navigation patterns

### **Phase 2: Bag Creation & Management** ✅ COMPLETE
**TDD Focus**: Form validation, API integration, success flows
- [x] **CreateBagScreen**: Professional modal screen with clean layout and improved spacing
- [x] **Privacy settings**: Rich privacy options with icons and descriptions (🔒 private, 👥 friends, 🌍 public)
- [x] **BagCard component**: Extend base Card with bag info, disc count, privacy icons
- [x] **Edit/Delete flows**: EditBagScreen with theme consistency and navigation patterns
- [x] **API Service Foundation**: bagService.js with function stubs following authService patterns
- [x] **Success flows**: Create → Navigate back to bags list, Edit → Update and navigate back
- [x] **Modal navigation**: CreateBagScreen presented as modal with proper navigation integration
- [x] **Professional UI Polish**: Removed suggestions, fixed horizontal spacing, improved visual hierarchy

**Phase 2 Achievements:**
✅ **Complete bag management UI flow** - Professional create/edit forms with proper navigation
✅ **Clean, spacious layout** - Fixed cramped horizontal spacing, added proper breathing room
✅ **Rich privacy system** - Private, Friends, Public options with clear descriptions and icons
✅ **Seamless navigation flow** - EmptyBagsScreen → CreateBagScreen → BagsListScreen integration
✅ **Design system consistency** - All components use existing Card, Input, Button patterns
✅ **Theme integration maintained** - All new components adapt to light, dark, and blackout themes
✅ **Professional form UX** - Auto-focus, keyboard handling, validation, clean visual hierarchy
✅ **TDD methodology maintained** - 375 total tests passing with comprehensive coverage

**Files Created/Enhanced:**
- `src/services/bagService.js` + tests - API service foundation with function stubs
- `src/screens/bags/CreateBagScreen.js` + tests - Professional modal form with improved spacing
- `src/screens/bags/EditBagScreen.js` + tests - Edit existing bag with pre-filled form data
- `src/components/bags/BagCard.js` + tests - Extends Card with bag info, disc count, privacy icons
- `App.js` - Updated navigation to include CreateBagScreen as modal with proper ErrorBoundary wrapping
- `src/screens/bags/EmptyBagsScreen.js` - Updated with better copy and navigation integration
- `src/screens/bags/BagsListScreen.js` - Updated with navigation prop passing and proper PropTypes

**Learning Focus Completed**: Professional form design, spacing and layout, modal presentations, navigation integration

**Current State**: Complete bag management system with working API integration. Create Bag functionality is fully operational.

### **Phase 2.5: API Service Integration** ✅ COMPLETE
**TDD Focus**: API integration, error handling, validation, comprehensive testing
- [x] **bagService.createBag()**: Full API integration with validation, error handling, 30s timeout, conflict detection
- [x] **bagService.getBags()**: Pagination support, query parameters (limit, offset, search), proper response validation
- [x] **bagService.updateBag()**: Partial updates, field validation, conflict handling, not found detection  
- [x] **bagService.deleteBag()**: Dependency checking, proper error handling for bags containing discs
- [x] **CreateBagScreen Integration**: Async/await, loading states, user-friendly error messages with Alert dialogs
- [x] **Comprehensive Testing**: 18 new test cases covering success flows, validation errors, API errors, edge cases
- [x] **Input Validation**: Client-side validation matching authService patterns (bag name length, privacy options)
- [x] **Error Handling**: Network timeouts, server errors, conflict detection, user-friendly messaging

**Phase 2.5 Achievements:**
✅ **Full API functionality** - All CRUD operations working with proper error handling and validation  
✅ **Production-ready error handling** - Network timeouts, server errors, user-friendly Alert messages
✅ **CreateBagScreen fully functional** - Loading states, async processing, prevents double submissions
✅ **Comprehensive test coverage** - 18 new tests covering all success/failure scenarios  
✅ **AuthService consistency** - Same patterns for validation, timeouts, error responses
✅ **Client-side validation** - Prevents unnecessary API calls with proper input validation
✅ **Professional UX** - Loading indicators, disabled states during processing, clear error messaging

**Files Enhanced:**
- `src/services/bagService.js` - Complete API implementation with 4 functions + validation helpers
- `__tests__/services/bagService.test.js` - 18 comprehensive test cases covering all scenarios  
- `src/screens/bags/CreateBagScreen.js` - Full API integration with loading/error states

**API Integration Complete**: The "Create Bag" button now creates actual bags via API with full error handling.

### **Phase 3: Disc Search & Master Database + Admin Features** ✅ COMPLETE
**TDD Focus**: Complex filtering, search performance, pagination, admin workflows
- [x] **DiscSearchScreen**: Master disc database search with advanced filtering using SearchBar + FilterChip
- [x] **Advanced filtering**: Speed, glide, turn, fade ranges with FilterChip arrays (supports "8-10", "-3--1" ranges)
- [x] **Brand/model search**: Real-time search with debounced input using SearchBar component (300ms debounce)
- [x] **Quick filters**: Putters (1-4), Mids (4-6), Fairways (6-9), Drivers (9+) using FilterChips with toggle functionality
- [x] **discService.searchDiscs()**: GET /api/discs/master integration with complex query building and pagination
- [x] **Pagination & performance**: FlatList optimization with infinite scroll and pull-to-refresh
- [x] **Professional empty states**: Search guidance and "Submit New Disc" CTA for missing discs
- [x] **SubmitDiscScreen**: Community contribution form with comprehensive validation (POST /api/discs/master)
- [x] **AdminDiscScreen**: Admin-only pending disc review with filtering and search (GET /api/discs/pending)
- [x] **Disc approval flow**: Admin approve/reject workflow with confirmation dialogs (PATCH /api/discs/:id/approve)
- [x] **Navigation Integration**: All disc screens added to App.js navigation with proper ErrorBoundary wrapping
- [x] **Authentication Error Handling**: Added token validation before navigation with helpful error messages

**Phase 3 Achievements:**
✅ **Complete disc search functionality** - Search, filter, and discover discs with real-time results
✅ **Advanced filtering system** - Range support ("8-10", "-3--1"), quick filters, brand/model search
✅ **Community contribution system** - Users can submit new discs for admin approval
✅ **Admin moderation tools** - Comprehensive pending disc review with approval workflow
✅ **Professional UX patterns** - Empty states, loading states, error handling, debounced search
✅ **TDD methodology maintained** - 460 total tests passing (428 unit + 32 integration) with zero failures
✅ **API integration complete** - All four discService functions working with proper error handling
✅ **Navigation accessibility** - Users can access disc screens from main app with authentication validation
✅ **Admin UI considerations** - Admin button temporarily hidden until backend returns is_admin flag

**Files Created/Enhanced:**
- `src/services/discService.js` + tests - Complete API integration with 4 functions (search, submit, pending, approve)
- `src/screens/discs/DiscSearchScreen.js` + tests - Master disc search with advanced filtering and pagination
- `src/screens/discs/SubmitDiscScreen.js` + tests - Community disc submission with comprehensive validation
- `src/screens/discs/AdminDiscScreen.js` + tests - Admin-only pending disc review with approval workflow
- `__tests__/services/discService.test.js` - 28 test cases covering all API scenarios and edge cases

**API Integration Complete:**
✅ `GET /api/discs/master` - Search approved discs with complex filtering, pagination, and range support
✅ `POST /api/discs/master` - Submit new disc (creates pending entry) with client-side validation
✅ `GET /api/discs/pending` - Admin-only pending disc list with same filtering capabilities
✅ `PATCH /api/discs/:id/approve` - Admin approval workflow with confirmation dialogs

**Design System Components Used:** ✅ SearchBar, ✅ FilterChip, ✅ EmptyState, ✅ Button, ✅ Input

**Learning Focus Completed**: Complex API filtering, range parsing, admin UX patterns, community contribution workflows, debounced search, real-time filtering, navigation integration, authentication error handling

**Phase 3 Summary**: Complete master disc database functionality with search, community contributions, and admin moderation. All screens are accessible from the main app and follow established patterns with comprehensive testing and proper error handling. Admin UI temporarily hidden until backend supports is_admin flag in auth flow.

### **Phase 3.6: Enhanced Filter & Sort UX** ✅ COMPLETE
**TDD Focus**: Visual design improvements, CreateBagScreen design consistency, spacing optimization, brand mapping
- [x] **FilterPanel Design Enhancement**: Redesigned to match CreateBagScreen's professional look and feel
- [x] **Section Headers with Icons**: Added meaningful icons for visual hierarchy (business-outline, speedometer-outline, airplane-outline, etc.)
- [x] **Two-Column Brand Layout**: Converted vertical brand list to space-efficient two-column layout (48% width each)
- [x] **CreateBagScreen Design Consistency**: Applied privacy option styling patterns to filter/sort panels
- [x] **SortPanel UX Improvement**: Moved sort direction selection to top of panel for better user flow
- [x] **Proper Vertical Spacing**: Fixed section headers being cut off by scrollable content with proper padding
- [x] **Compact Option Styling**: Reduced padding and margins throughout for better modal space usage
- [x] **Backend Brand Mapping**: Added 'Axiom' → 'Axiom Discs' mapping in backend service for accurate database queries
- [x] **Visual Polish**: Consistent spacing, proper touch targets (44px min height), professional visual hierarchy

**Phase 3.6 Achievements:**
✅ **Professional filter/sort experience** - Matches CreateBagScreen's polished design system patterns
✅ **Efficient space usage** - Two-column brand layout reduces scrolling by ~50% in modal
✅ **Improved user flow** - Sort direction selection at top provides clearer workflow
✅ **Visual consistency** - All panels now follow established design patterns from CreateBagScreen
✅ **Proper vertical spacing** - Fixed section headers visibility and content overflow issues
✅ **Brand mapping functionality** - Users can search 'Axiom' and find 'Axiom Discs' in database
✅ **Maintained accessibility** - All touch targets meet 44px minimum with proper labeling
✅ **TDD methodology maintained** - All tests updated to work with new UI structure

**Files Enhanced:**
- `apps/mobile-app/src/design-system/components/FilterPanel.js` - Complete visual redesign with section headers, icons, two-column layout
- `apps/mobile-app/src/design-system/components/SortPanel.js` - Reorganized with sort direction at top, consistent styling
- `apps/express-server/services/discs.list.service.js` - Added brand mapping system for common name variations
- `__tests__/screens/discs/DiscSearchScreen.filterSort.test.js` - Updated test to work with new sort panel flow

**Design Pattern Consistency:**
- ✅ Section headers with icons (matching CreateBagScreen pattern)
- ✅ Card-style options with selected states (matching privacy options)
- ✅ Proper spacing hierarchy (matching CreateBagScreen sections)
- ✅ Professional visual polish (consistent with established design system)

**Learning Focus Completed**: Design system consistency, modal space optimization, user flow improvements, visual hierarchy, backend data mapping

**Phase 3.6 Summary**: Enhanced filter and sort UX to provide a professional, space-efficient experience that matches the established CreateBagScreen design patterns. Users now have a more intuitive sorting workflow with proper visual hierarchy and efficient space usage in the modal interface.

### **Phase 3.5: Backend Admin Flag Integration** 🚀 **IMMEDIATE NEXT PRIORITY**
**TDD Focus**: Backend authentication enhancement, JWT token updates, admin UI visibility
- [ ] **Update auth.login.service.js**: Include `is_admin` in database query (`SELECT id, username, email, password_hash, created_at, is_admin FROM users WHERE username = $1`)
- [ ] **Enhance JWT token payload**: Add `is_admin` to JWT access token alongside `userId` and `username`
- [ ] **Update login API response**: Include `is_admin` in user object returned by login endpoint
- [ ] **Update auth.middleware.js**: Extract `is_admin` from JWT and add to `req.user` object
- [ ] **Mobile AuthContext integration**: Update mobile app to store and use `is_admin` from login response
- [ ] **Admin button visibility**: Update EmptyBagsScreen to show admin button only when `user.isAdmin === true`
- [ ] **Testing updates**: Update backend auth tests to verify `is_admin` in tokens and responses
- [ ] **Mobile auth tests**: Update mobile AuthContext tests to handle `is_admin` field

**Backend Files to Update:**
- `apps/express-server/services/auth.login.service.js` - Add `is_admin` to database query and JWT payload
- `apps/express-server/middleware/auth.middleware.js` - Extract `is_admin` from JWT to `req.user`
- `docs/express-server/api/auth/POST_login.md` - Update documentation to include `is_admin` in response

**Mobile Files to Update:**
- `apps/mobile-app/src/context/AuthContext.js` - Store `is_admin` from login response
- `apps/mobile-app/src/screens/bags/EmptyBagsScreen.js` - Show admin button conditionally
- `apps/mobile-app/src/services/authService.js` - Handle `is_admin` in login response (if needed)

**Why This is Critical:**
- Fixes the "admin button should only show if user is admin" issue identified in Phase 3
- Provides proper role-based access control for admin features
- Completes the authentication flow to support admin-only screens
- Required before users can access AdminDiscScreen functionality

### **Phase 4: Bag Detail & Disc Display** 
**TDD Focus**: List rendering, sorting, filtering performance
- [ ] **BagDetailScreen**: Individual bag view with disc list using established screen patterns
- [ ] **DiscRow component**: Full-width disc info using typography + spacing from design system
- [ ] **Disc display format**: `DiscName (Brand) | Speed Glide Turn Fade | Color●`
- [ ] **Sort/Filter UI**: Collapsible filter bar using existing FilterChip + SearchBar components
- [ ] **Sort options**: Speed (default), Brand, Model, Recently Added with FilterChip arrays
- [ ] **DiscColorIndicator**: 16px colored circle with long-press tooltip for plastic type

**Components Already Built**: ✅ Card, ✅ FilterChip, ✅ SearchBar (ready for composition)

**Learning Focus**: FlatList optimization, sort/filter state management, component composition patterns

### **Phase 5: Multi-Select & Bulk Operations (Day 5)**
**TDD Focus**: Complex state management, bulk API calls
- [ ] **Design System**: Create BottomSheet + ActionBar components
- [ ] Multi-select mode activation following iOS Photos app patterns
- [ ] Checkbox state management using established state patterns
- [ ] MoveBagsModal using new BottomSheet + existing Card components
- [ ] Bulk operations using existing Button components in ActionBar
- [ ] MultiSelectBar extending ActionBar with theme-aware styling

**Learning Focus**: Complex state patterns, modal presentations, design system composition

### **Phase 6: Add Discs to Bags (Day 6)**
**TDD Focus**: Disc customization, API integration
- [ ] Add disc from search results using existing Button + navigation patterns
- [ ] Custom properties form using existing Input + FilterChip components
- [ ] Flight number overrides following established Input validation patterns
- [ ] Color picker using FilterChip grid (reusable for other features)
- [ ] BagContentsService.addDisc() following AuthService API patterns

**Learning Focus**: Form customization, API data transformation, design system scalability

## Testing Strategy (Martin Fowler's Pyramid)

### **Unit Tests (Base of Pyramid)**
```javascript
// Design System Components (follows existing Button/Input test patterns)
__tests__/design-system/components/
├── Card.test.js               # Base card behavior, theme integration
├── FilterChip.test.js         # Selection state, theme colors
├── SearchBar.test.js          # Input handling, search events
├── BottomSheet.test.js        # Modal behavior, gesture handling
├── EmptyState.test.js         # Illustration, CTA interactions
├── LoadingSpinner.test.js     # Theme-aware styling
└── ActionBar.test.js          # Button composition, theme integration

// Bag-Specific Components (uses ThemeProvider wrapper pattern)
__tests__/components/bags/
├── BagCard.test.js            # Swipe actions, privacy icons, extends Card
├── DiscRow.test.js            # Flight number display, uses typography constants
├── DiscFilters.test.js        # FilterChip composition, state management
└── MoveBagsModal.test.js      # BottomSheet usage, Card selection

// Service Layer (follows AuthService test patterns)
__tests__/services/
├── bagService.test.js         # API calls, error handling, caching
├── discService.test.js        # Search query building, pagination
└── bagContentsService.test.js # CRUD operations, bulk actions
```

### **Integration Tests (Middle of Pyramid)**
```javascript
// Screen workflows and API contracts
__tests__/integration/
├── bagManagement.integration.test.js     # Create → Edit → Delete bags
├── discSearch.integration.test.js        # Search → Filter → Add to bag
├── bulkOperations.integration.test.js    # Multi-select → Move/Remove discs
└── bagContents.integration.test.js       # View bag → Sort → Filter discs
```

### **E2E Tests (Top of Pyramid - Manual)**
```javascript
// Complete user journeys
- New user: Empty state → Create bag → Add discs → Organize
- Power user: Multiple bags → Bulk operations → Advanced filtering
- Edge cases: Network failures, large datasets, slow responses
```

## API Endpoint Integration

### **Required Endpoints**
1. **GET /api/bags** - List user's bags with disc counts
2. **POST /api/bags** - Create new bag
3. **PUT /api/bags/:id** - Update bag details
4. **DELETE /api/bags/:id** - Delete bag
5. **GET /api/bags/:id** - Get bag with disc contents
6. **GET /api/discs/master** - Search master disc database
7. **POST /api/bags/:id/discs** - Add disc to bag
8. **PUT /api/bags/:id/discs/:contentId** - Update disc in bag
9. **DELETE /api/bags/discs/:contentId** - Remove disc from bag

### **API Response Patterns**
- **Success**: `{ success: true, data: {...}, pagination: {...} }`
- **Error**: `{ success: false, message: "...", field: "..." }`
- **Pagination**: `{ total, limit, offset, hasMore }`

## Performance Considerations

### **List Rendering**
- Use FlatList with keyExtractor for disc lists
- Implement getItemLayout for known heights
- Add initialNumToRender for faster load times

### **Search Optimization**
- Debounce search input (300ms)
- Cache search results in memory
- Implement infinite scroll for large result sets

### **State Management**
- Use React.memo for expensive components
- Implement useMemo for computed values (filtered/sorted lists)
- Use useCallback for event handlers in lists

## Success Criteria

### **User Experience**
- [ ] New user can create their first bag in under 30 seconds
- [ ] Power user can move multiple discs between bags efficiently
- [ ] Search results appear in under 2 seconds for any filter combination
- [ ] All animations and transitions feel smooth (60fps)

### **Technical Quality**
- [ ] 90%+ test coverage for business logic
- [ ] All API calls handle network errors gracefully
- [ ] App remains responsive during large list operations
- [ ] Cross-platform consistency maintained

### **Accessibility**
- [ ] All interactive elements have accessibility labels
- [ ] Screen reader can navigate through disc lists effectively
- [ ] Color indicators have text alternatives
- [ ] Touch targets meet minimum size requirements (44px)

## Future Enhancements

### **Phase 7: Advanced Features**
- [ ] Bag sharing with friends
- [ ] Disc recommendations based on course/conditions
- [ ] Statistics and analytics (most-used discs, etc.)
- [ ] Export bag contents to various formats
- [ ] Photo integration for disc condition documentation

### **Phase 8: Social Features**
- [ ] Public bag browsing and cloning
- [ ] Friend activity feeds
- [ ] Disc trading marketplace integration
- [ ] Community-driven disc reviews and ratings

## Learning Opportunities

### **React Native Concepts**
1. **Advanced Navigation**: Stack + Modal navigation patterns
2. **List Performance**: FlatList optimization techniques
3. **Gesture Handling**: Swipe actions and multi-touch
4. **State Management**: Complex state with useReducer
5. **Caching Strategies**: Memory and async storage patterns

### **UX/UI Patterns**
1. **Progressive Disclosure**: Showing complexity when needed
2. **Bulk Operations**: Multi-select interaction patterns
3. **Search Interfaces**: Filter, sort, and search UX
4. **Modal Presentations**: Bottom sheets and overlays
5. **Empty States**: Onboarding and guidance patterns

### **Design System Evolution**
1. **Component Composition**: Building complex components from simple base components
2. **Theme Consistency**: Ensuring all new components integrate with existing theme system
3. **Reusability Patterns**: Creating components that work across different contexts
4. **API Integration**: Maintaining consistency with established AuthService patterns
5. **Testing Patterns**: Extending existing test patterns to new component categories

## Design System Integration Strategy

### **Leveraging Existing Foundation**
This implementation will build upon your established design system:
- **Theme System**: All components will use `useThemeColors()` hook and existing theme constants
- **Base Components**: New components will compose existing Button, Input, and AppContainer components
- **Testing Patterns**: Following the established ThemeProvider wrapper pattern and TDD methodology
- **Typography & Spacing**: Using existing constants from `typography.js` and `spacing.js`

### **Extension Philosophy**
- **Compose, Don't Recreate**: Build complex components by combining existing simple components
- **Theme-First**: Every new component starts with theme integration
- **Consistency Over Innovation**: Follow established patterns rather than creating new ones
- **Incremental Enhancement**: Extend the design system gradually, one component at a time

This plan emphasizes learning through practical implementation while building a production-quality disc management system that disc golfers will love to use, all while maintaining consistency with your existing design system architecture.