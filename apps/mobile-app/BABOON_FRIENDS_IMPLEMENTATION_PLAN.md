# Baboon Friend Request Implementation Plan

## Executive Summary

This plan outlines the implementation of complete baboon friend request functionality, filling the gap between the existing friend management system and user discovery/request initiation. The current system has request approval components and service functions but lacks the ability for users to find and request friendships with other baboons.

## Current State Analysis

### ✅ What We Have
1. **Express Server APIs**:
   - `/api/friends/request` (POST) - Send friend request (requires recipientId)
   - `/api/friends/respond` (POST) - Accept/deny requests
   - `/api/friends/requests` (GET) - Get friend requests
   - `/api/friends` (GET) - Get friends list
   - `/api/profile/search` (GET) - Search public profiles by username/city

2. **Mobile App Components**:
   - `BaboonsTabView` - Tab navigation for Friends/Requests
   - `IncomingRequestCard` - Display incoming requests with accept/deny
   - `OutgoingRequestCard` - Display outgoing requests
   - `FriendsContext` - State management for friends/requests
   - `friendService` - API integration with full CRUD operations

### ❌ What's Missing
1. **User Discovery UI**: No way to search and browse users
2. **Request Initiation UI**: No interface to send friend requests
3. **Search Service Integration**: Mobile app doesn't use profile search API
4. **Complete Request Management**: Requests tab shows placeholder
5. **Navigation Flow**: No flow from search → profile → request

## Implementation Plan

Following TDD methodology with thin slices, we'll implement features incrementally with thorough testing at each step.

---

## Phase 1: User Search Foundation

### Slice 1.1: Add Profile Search Service to Mobile App
**Acceptance Criteria**: Mobile app can search for users by username and city

**Test-First Approach**:
1. `src/services/__tests__/profileService.test.js`
   - Test: should export searchProfiles function
   - Test: should search by username with proper API call
   - Test: should search by city with proper API call
   - Test: should handle pagination correctly
   - Test: should handle authentication errors
   - Test: should handle network errors

**Implementation**:
2. `src/services/profileService.js`
   - Create searchProfiles function
   - Integrate with `/api/profile/search` endpoint
   - Handle pagination (limit, offset)
   - Support username and city filters
   - Include proper error handling and timeouts

**Verification**: Run `npm run verify` after each test passes

---

### Slice 1.2: User Search Screen UI
**Acceptance Criteria**: Basic search screen with input field and search capability

**Test-First Approach**:
1. `src/screens/friends/__tests__/UserSearchScreen.test.js`
   - Test: should render search input field
   - Test: should render search button
   - Test: should show loading state during search
   - Test: should display search results
   - Test: should show empty state for no results
   - Test: should handle search errors gracefully

**Implementation**:
2. `src/screens/friends/UserSearchScreen.js`
   - Create new screen component
   - Add search TextInput with proper accessibility
   - Implement search functionality with loading states
   - Show results in FlatList
   - Handle empty states and errors
   - Use existing design system components

**Verification**: Run `npm run verify` after each test passes

---

### Slice 1.3: User Search Result Card
**Acceptance Criteria**: Display search results with user info and request button

**Test-First Approach**:
1. `src/components/__tests__/UserSearchCard.test.js`
   - Test: should render user information correctly
   - Test: should show "Send Request" button for new users
   - Test: should show "Request Sent" for pending requests
   - Test: should show "Friends" for existing friends
   - Test: should handle missing profile data gracefully
   - Test: should call onSendRequest when button pressed

**Implementation**:
2. `src/components/UserSearchCard.js`
   - Create card component for search results
   - Display username, name, location (if public)
   - Show appropriate button state based on relationship
   - Use existing Card and design system components
   - Proper prop validation and accessibility

**Verification**: Run `npm run verify` after each test passes

---

## Phase 2: Request Management Enhancement

### Slice 2.1: Complete Requests Tab Implementation
**Acceptance Criteria**: Requests tab shows incoming and outgoing requests

**Test-First Approach**:
1. `src/components/__tests__/RequestsTabView.test.js`
   - Test: should render incoming requests section
   - Test: should render outgoing requests section
   - Test: should show loading states
   - Test: should handle empty states
   - Test: should handle accept/deny actions
   - Test: should update badge count correctly

**Implementation**:
2. `src/components/RequestsTabView.js`
   - Create dedicated component for requests tab
   - Separate sections for incoming/outgoing
   - Integrate with existing request cards
   - Load requests data on mount
   - Handle request actions and state updates

3. Update `src/components/BaboonsTabView.js`
   - Replace placeholder with RequestsTabView
   - Ensure proper navigation and state management

**Verification**: Run `npm run verify` after each test passes

---

### Slice 2.2: Enhanced Friend Service Integration
**Acceptance Criteria**: Friend service handles all request states and updates context

**Test-First Approach**:
1. Update `src/services/__tests__/friendService.test.js`
   - Test: sendRequest should accept recipientId parameter
   - Test: should handle recipientId vs userId parameter naming
   - Test: should update after request actions

**Implementation**:
2. Update `src/services/friendService.js`
   - Fix parameter naming (recipientId vs userId) in sendRequest
   - Ensure consistency with server expectations

3. Update `src/context/__tests__/FriendsContext.test.js`
   - Test: should handle SEND_REQUEST actions
   - Test: should update request states properly

4. Update `src/context/FriendsContext.js`
   - Add actions for sending requests
   - Add actions for updating request status
   - Ensure badge counts update correctly

**Verification**: Run `npm run verify` after each test passes

---

## Phase 3: Navigation and Integration

### Slice 3.1: Add Search Navigation
**Acceptance Criteria**: Users can navigate to search from friends screen

**Test-First Approach**:
1. Update `src/screens/friends/__tests__/FriendsScreen.test.js`
   - Test: should render search button/icon
   - Test: should navigate to search screen when pressed

**Implementation**:
2. Update `src/screens/friends/FriendsScreen.js`
   - Add search icon/button to header or friends tab
   - Implement navigation to UserSearchScreen

3. Add route configuration for UserSearchScreen
   - Register new screen in navigation stack
   - Ensure proper back navigation

**Verification**: Run `npm run verify` after each test passes

---

### Slice 3.2: End-to-End Request Flow
**Acceptance Criteria**: Complete flow from search → send request → manage requests

**Test-First Approach**:
1. `src/screens/friends/__tests__/UserSearchScreen.test.js`
   - Test: should send request and navigate back
   - Test: should update search results after sending request
   - Test: should show success feedback

**Implementation**:
2. Update `src/screens/friends/UserSearchScreen.js`
   - Integrate with friendService.sendRequest
   - Update UI state after request sent
   - Show success feedback (toast/alert)
   - Update search results to reflect new request status

3. Integration testing across components
   - Ensure state updates propagate correctly
   - Verify badge counts update in real-time
   - Test navigation flows work properly

**Verification**: Run `npm run verify` after each test passes

---

## Phase 4: Enhanced User Experience

### Slice 4.1: Search Filters and Pagination
**Acceptance Criteria**: Advanced search with filters and infinite scroll

**Test-First Approach**:
1. Update `src/screens/friends/__tests__/UserSearchScreen.test.js`
   - Test: should filter by city
   - Test: should handle pagination/load more
   - Test: should show loading states for pagination

**Implementation**:
2. Update `src/screens/friends/UserSearchScreen.js`
   - Add city filter input
   - Implement infinite scroll with FlatList
   - Add pull-to-refresh functionality
   - Optimize search with debouncing

**Verification**: Run `npm run verify` after each test passes

---

### Slice 4.2: Enhanced Error Handling and UX
**Acceptance Criteria**: Comprehensive error handling with user-friendly messages

**Test-First Approach**:
1. Error handling tests across all components
   - Test: should handle network errors gracefully
   - Test: should show appropriate error messages
   - Test: should allow retry functionality

**Implementation**:
2. Enhance error handling across all components
   - Network error recovery
   - User-friendly error messages
   - Retry mechanisms where appropriate
   - Loading skeletons for better UX

**Verification**: Run `npm run verify` after each test passes

---

## Technical Implementation Details

### Component Architecture
```
FriendsScreen
├── BaboonsTabView
│   ├── FriendsTab (existing)
│   └── RequestsTabView (new)
│       ├── IncomingRequestCard (existing)
│       └── OutgoingRequestCard (existing)
└── Search Navigation → UserSearchScreen (new)
    └── UserSearchCard (new)
```

### State Management Flow
```
FriendsContext
├── friends: { list, pagination, loading, error }
├── requests: { incoming, outgoing, badge, loading }
└── search: { results, loading, filters, pagination }
```

### Service Integration
```
profileService (new)
├── searchProfiles(query, pagination)

friendService (enhanced)
├── sendRequest(recipientId) // Fixed parameter naming
├── respondToRequest(requestId, action)
├── getRequests(type)
└── getFriends(options)
```

## Testing Strategy

### Unit Tests
- All service functions with proper mocking
- All components with comprehensive prop testing
- Context state management and reducer logic
- Error handling scenarios

### Integration Tests
- API integration with mock servers
- Component interaction testing
- Navigation flow testing
- State updates across components

### Key Test Scenarios
1. **Happy Path**: Search → Find User → Send Request → Accept/Deny
2. **Error Scenarios**: Network failures, API errors, authentication issues
3. **Edge Cases**: Duplicate requests, self-requests, permission errors
4. **Performance**: Large search results, rapid interactions

## Acceptance Criteria Summary

### User Journey Success Criteria
1. ✅ User can search for other baboons by username or city
2. ✅ User can see search results with public profile information
3. ✅ User can send friend requests from search results
4. ✅ User can see sent requests in outgoing requests tab
5. ✅ User can manage incoming requests (accept/deny)
6. ✅ Badge counts update in real-time
7. ✅ All interactions follow existing UI patterns
8. ✅ Error handling provides clear user feedback
9. ✅ Navigation flows are intuitive and consistent
10. ✅ All functionality works offline-first where possible

### Quality Standards
- ✅ 100% test coverage for new components
- ✅ All tests pass `npm run verify`
- ✅ No linting errors or warnings
- ✅ Follows existing code patterns and design system
- ✅ Proper accessibility implementation
- ✅ Performance optimized (debouncing, pagination)
- ✅ Cross-platform compatibility (iOS/Android)

## Risk Mitigation

### Technical Risks
1. **API Parameter Mismatch**: Server expects `recipientId`, service uses `userId`
   - **Mitigation**: Fix in Slice 2.2 with proper testing

2. **State Management Complexity**: Multiple components need to stay synchronized
   - **Mitigation**: Centralized state in FriendsContext with clear action types

3. **Search Performance**: Large result sets could impact performance
   - **Mitigation**: Implement pagination and debouncing in Phase 4

### UX Risks
1. **Confusing Navigation**: Users might not find search functionality
   - **Mitigation**: Add prominent search button/icon in friends screen

2. **Request Status Confusion**: Users unsure if request was sent
   - **Mitigation**: Immediate visual feedback and state updates

## Dependencies and Prerequisites

### Existing Dependencies
- Express server APIs are functional and tested
- Authentication middleware working
- FriendsContext and existing components stable
- Design system components available

### New Dependencies
- No additional package dependencies required
- Will use existing React Native, design system, and testing libraries

## Timeline and Effort Estimation

### Phase 1: 3-4 thin slices (User Search Foundation)
- Estimated: 2-3 development sessions
- Critical path: Profile service integration

### Phase 2: 2 thin slices (Request Management)
- Estimated: 1-2 development sessions
- Builds on existing request components

### Phase 3: 2 thin slices (Navigation Integration)
- Estimated: 1 development session
- Mostly configuration and navigation setup

### Phase 4: 2 thin slices (Enhanced UX)
- Estimated: 1-2 development sessions
- Polish and optimization

**Total Estimated Effort**: 5-8 development sessions with TDD approach

## Success Metrics

### Functional Metrics
- All acceptance criteria met
- Complete user journey from search to friendship
- Zero critical bugs in core flows

### Quality Metrics
- 100% test coverage for new code
- All verification checks pass
- Performance meets existing app standards
- Accessibility compliance maintained

This implementation plan provides a comprehensive roadmap for implementing the complete baboon friend request functionality using TDD methodology with thin, testable slices. Each phase builds incrementally on the previous work while maintaining high quality standards throughout the development process.