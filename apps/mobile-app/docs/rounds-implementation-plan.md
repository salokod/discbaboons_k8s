# Add New Round Feature - Implementation Plan

## Overview
Implementation of "add new round" functionality in the React Native disc golf mobile app, including initial round card display. This follows the TDD methodology with 20 thin slices across 4 phases.

## API Analysis Summary
- **Available Endpoints**: `POST /rounds/create`, `GET /rounds`, `GET /rounds/:id`, `GET /courses/search`
- **Authentication**: Bearer token required (existing pattern)
- **Data Models**: Full round lifecycle with course integration, player management, scoring

## Implementation Phases

### Phase 1: Service Layer Foundation (Slices 1-5)

**Slice 1: Create roundService.js file**
- Test: File exists and exports createRound function
- Implementation: Create file with empty function export
- Acceptance: `import { createRound } from './roundService'` works

**Slice 2: Implement createRound validation**
- Test: Validates required courseId and name
- Implementation: Add validation logic similar to bagService
- Acceptance: Throws appropriate errors for invalid input

**Slice 3: Add getRounds function**
- Test: Function exists and handles pagination params
- Implementation: Follow getBags pattern with proper query building
- Acceptance: Returns paginated rounds list

**Slice 4: Add getRoundDetails function**
- Test: Function exists and validates roundId
- Implementation: Fetch round with players and pars
- Acceptance: Returns complete round object

**Slice 5: Create courseService.js**
- Test: File exists with searchCourses function
- Implementation: Support search with filters
- Acceptance: Returns filtered course list

### Phase 2: UI Components Foundation (Slices 6-11)

**Slice 6: Replace placeholder RoundsScreen**
- Test: RoundsListScreen renders without rounds
- Implementation: Create list screen with empty state
- Acceptance: Shows "No rounds yet" message

**Slice 7: Add FAB button**
- Test: FAB button renders and is tappable
- Implementation: Add floating action button
- Acceptance: Button visible and responds to press

**Slice 8: Create CreateRoundScreen structure**
- Test: Screen renders with basic layout
- Implementation: Header, form container, button
- Acceptance: All UI elements visible

**Slice 9: Add navigation**
- Test: Navigation from list to create works
- Implementation: Update RoundsStackNavigator
- Acceptance: Screen transition works

**Slice 10: CourseSelectionModal component**
- Test: Modal renders with search input
- Implementation: Search UI and list display
- Acceptance: Modal opens and displays courses

**Slice 11: Integrate course selection**
- Test: Course selection updates state
- Implementation: Connect modal to CreateRoundScreen
- Acceptance: Selected course displays in form

### Phase 3: Core Functionality (Slices 12-17)

**Slice 12: Round name input**
- Test: Input accepts and validates text
- Implementation: Controlled input with validation
- Acceptance: Name updates and shows errors

**Slice 13: API integration**
- Test: Create button calls API
- Implementation: Connect to roundService
- Acceptance: Round created successfully

**Slice 14: RoundDetailScreen component**
- Test: Screen renders with round data
- Implementation: Display round information
- Acceptance: Shows course, name, status

**Slice 15: Navigation after creation**
- Test: Navigates to detail after create
- Implementation: Navigation with params
- Acceptance: Shows new round details

**Slice 16: Round header card**
- Test: Card displays all round info
- Implementation: Styled card component
- Acceptance: Professional looking card

**Slice 17: Players section**
- Test: Shows creator as initial player
- Implementation: Players list component
- Acceptance: Displays player information

### Phase 4: Polish & Integration (Slices 18-20)

**Slice 18: Round refresh context**
- Test: Context provides refresh functions
- Implementation: Similar to BagRefreshContext
- Acceptance: Screens can trigger refreshes

**Slice 19: Pull-to-refresh**
- Test: Pull gesture triggers reload
- Implementation: RefreshControl integration
- Acceptance: List updates on pull

**Slice 20: Error handling**
- Test: Errors display appropriately
- Implementation: Try-catch blocks and alerts
- Acceptance: User-friendly error messages

## Data Models

### Round Creation Payload
```javascript
{
  courseId: string (required),
  name: string (required),
  startingHole: number (optional, default: 1),
  isPrivate: boolean (optional, default: false),
  skinsEnabled: boolean (optional, default: false),
  skinsValue: number (optional)
}
```

### Round Response Object
```javascript
{
  id: string,
  created_by_id: number,
  course_id: string,
  name: string,
  start_time: string,
  starting_hole: number,
  is_private: boolean,
  skins_enabled: boolean,
  skins_value: string | null,
  status: string,
  players: Array,
  pars: Object
}
```

## Key Implementation Details

### State Management
- Use React Context for round refresh events (similar to BagRefreshContext)
- Local state for form inputs and loading states
- Navigation params for passing round data between screens

### Error Handling
- Validate inputs before API calls
- Show user-friendly error messages
- Handle network timeouts gracefully
- Provide retry mechanisms

### UI/UX Considerations
- Follow existing app design patterns
- Use consistent spacing and typography
- Implement proper loading states
- Support both iOS and Android platforms
- Accessibility labels for all interactive elements

## Testing Strategy

Each slice includes:
- Unit tests for service functions
- Component rendering tests
- Navigation flow tests
- API integration tests
- Error scenario tests

## Delivery Milestones

1. **Milestone 1** (Slices 1-5): Service layer complete
2. **Milestone 2** (Slices 6-11): Basic UI navigation working
3. **Milestone 3** (Slices 12-17): Core functionality operational
4. **Milestone 4** (Slices 18-20): Polish and production ready

## Risk Mitigation

- **Course data availability**: Implement offline course cache
- **Network reliability**: Add retry logic and offline detection
- **Performance**: Paginate rounds list, lazy load details
- **User errors**: Clear validation messages, confirm destructive actions

This comprehensive plan provides a clear roadmap for implementing the "add new round" feature with proper TDD methodology, following existing app patterns, and ensuring a quality user experience. Each slice is independently testable and deliverable, allowing for incremental progress validation.