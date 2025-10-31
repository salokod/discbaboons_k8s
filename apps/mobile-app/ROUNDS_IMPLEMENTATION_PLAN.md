# Comprehensive Rounds Feature Implementation Plan

## ✅ Phase 1.3 Complete: One-Page Round Experience

**Status**: COMPLETED (2025-10-25)
**Priority**: HIGH - All user-requested features delivered

### What Was Delivered
Users requested immediate access to scorecard without intermediate navigation - **DELIVERED**:
- ✅ Click on in-progress round → immediately see scorecard
- ✅ Secondary content (leaderboard, side bets, round info) accessible via collapsible sections
- ✅ No "Open Scorecard" button needed - direct to action
- ✅ All content on one page with natural scroll behavior

### Technical Implementation - Collapsible Sections Approach
- **Navigation**: All rounds route directly to ScorecardRedesignScreen
- **Primary View**: Score entry as hero content with HoleHeroCard
- **Secondary Access**: Three collapsible accordion sections (Round Info, Leaderboard, Side Bets)
- **Layout**: ScrollView parent with natural content flow, sections push content down
- **Component Reuse**: All Slice 14 work preserved, existing components integrated
- **Performance**: Lazy loading for section data (only loads when expanded)

### Key Achievements
- ✅ RoundDetailScreen completely removed - unified one-page experience
- ✅ Collapsible sections replace bottom sheets (simpler, more functional)
- ✅ All Slice 14 accessibility and scoring features preserved
- ✅ Enhanced progressive disclosure via accordion sections
- ✅ Fixed layout issues (alignment, truncation, overlay behavior)
- ✅ Backend course data structure resolved
- ✅ 100% test pass rate maintained

---

## 🚀 WHAT'S NEXT? (Recommendations)

**Current State**: Phase 1.3 is 100% complete. All core scorecard functionality is working perfectly.

### Option 1: Polish & Refinement (RECOMMENDED - 1-2 days)
**Why**: Make the existing one-page design feel premium before adding complexity
- Add loading skeletons for collapsible sections
- Implement success/error toast notifications for score saves
- Add haptic feedback for score entry buttons
- Smooth animations for section expand/collapse
- Error state improvements (offline mode, API failures)
- **Benefit**: Professional UX that users will love

### Option 2: Offline Queue Integration (HIGH VALUE - 2-3 hours)
**Why**: Allow users to score rounds without internet connection
- Install `@react-native-community/netinfo` package
- Integrate existing offlineQueue.js service (already built, just not wired)
- Add offline indicator badge in UI
- Test offline scoring flow
- **Benefit**: Critical feature for disc golf courses with poor cell coverage
- **Note**: Requires package installation approval from user

### Option 3: Bottom Sheet Migration (OPTIONAL - 2-3 days)
**Why**: Upgrade collapsible sections to gesture-based bottom sheets
- More modern, iOS/Android native feel
- Better for mobile UX (pull-up gestures)
- Requires @gorhom/bottom-sheet package installation
- **Trade-off**: Current implementation works well, this is polish
- **Recommendation**: Only if user wants more "app-like" feel

### Option 4: Move to Phase 2 - Participant Management (NEW FEATURE - 1-2 weeks)
**Why**: Add friend search, roles, invitation status to round creation
- Enhanced ParticipantSelector with search functionality
- Participant role assignment (player vs observer)
- Invitation status tracking
- **Benefit**: Improves round creation flow for large friend lists

### My Recommendation
**Start with Option 1 (Polish & Refinement)**, then do **Option 2 (Offline Queue)**. This gives users:
1. A polished, professional experience with what we've built
2. Critical offline functionality for real-world disc golf scenarios

After that, ask the user if they want Option 3 (bottom sheets) or Option 4 (new features).

---

## Executive Summary

This document outlines the complete implementation plan for the DiscBaboons rounds management system, including core round functionality, skins games, side betting, and advanced features. The plan leverages existing backend APIs and follows a phased approach using TDD methodology.

## Backend API Inventory

### Core Round Management
- **POST /api/rounds** - Create new round
- **GET /api/rounds** - List user's rounds (with pagination)
- **GET /api/rounds/:id** - Get round details with players and scores
- **POST /api/rounds/:id/players** - Add players to round
- **PUT /api/rounds/:id** - Update round settings
- **DELETE /api/rounds/:id** - Delete round

### Score Management
- **POST /api/rounds/:id/scores** - Submit hole scores
- **PUT /api/rounds/:id/scores/:scoreId** - Update specific score
- **GET /api/rounds/:id/scores** - Get all scores for round

### Skins Games
- **POST /api/rounds/:id/skins** - Enable skins for round
- **PUT /api/rounds/:id/skins** - Update skins settings
- **GET /api/rounds/:id/skins** - Get skins results

### Side Betting
- **POST /api/rounds/:id/bets** - Create side bet
- **PUT /api/rounds/:id/bets/:betId** - Update bet status
- **GET /api/rounds/:id/bets** - List all bets for round

### Course Integration
- **GET /api/courses** - List available courses
- **GET /api/courses/:id** - Get course details with hole info

## User Experience Design

### Navigation Architecture
```
Main App
├── Rounds Tab (Bottom Navigation)
│   ├── Rounds List Screen
│   │   ├── Active Rounds Section
│   │   ├── Recent Rounds Section
│   │   └── + Create Round FAB
│   ├── Create Round Screen
│   │   ├── Course Selection
│   │   ├── Participant Selection
│   │   ├── Game Settings
│   │   └── Betting Options
│   └── Round Detail Screen
│       ├── Round Overview
│       ├── Live Scorecard
│       ├── Skins Tracker
│       ├── Side Bets
│       └── Round Actions
```

### Progressive Disclosure Strategy
1. **Basic Round Creation** - Simple course + name selection
2. **Participant Addition** - Expandable friend/guest selector
3. **Game Enhancements** - Optional skins and betting features
4. **Advanced Settings** - Power user configurations

## Implementation Phases

### Phase 1: Core Round Management (2-3 weeks)

#### 1.1 Enhanced Rounds List Screen
**File**: `src/screens/rounds/RoundsListScreen.js` *(corrected - using actual navigation file)*

Replace placeholder with functional rounds list:
- Pull-to-refresh functionality
- Infinite scroll pagination
- Active vs completed round sections
- Quick action buttons (resume, view details)

**TDD Slices**:
1. ✅ **COMPLETED** - Component exports and renders basic structure
2. **IN PROGRESS** - Fetches rounds from API on mount
3. Displays rounds in categorized sections
4. Implements pull-to-refresh
5. Adds infinite scroll pagination
6. Integrates navigation to round details

**Progress Notes**:
- **Slice 1 (✅ COMPLETED)**: Added component export verification test, fixed displayName preservation in memo wrapper. All tests passing at 100%.
- **Slice 2 (✅ COMPLETED)**: API fetching already implemented and working perfectly.
- **Slice 3 - CATEGORIZED SECTIONS (✅ COMPLETED)**:
  - **Phase 2.1**: Added categorizeRounds helper function
  - **Phase 2.2**: Added createSections helper function for SectionList structure
  - **Phase 2.3**: Migrated from FlatList to SectionList with conditional rendering
  - **Phase 2.4**: Implemented section headers with count badges and professional styling
  - **Phase 2.5**: Added proper empty state handling for both global and section levels
  - **Test Coverage**: 139/139 tests passing (100% success rate)
  - **User-Visible**: Active and Completed rounds now display in separate sections with headers
- **Slice 4 (✅ COMPLETED)**: Pull-to-refresh was already implemented and working perfectly.
- **Slice 5 - ARROW-BASED PAGINATION (✅ COMPLETED)**:
  - **Implementation**: Complete TDD approach with 12 thin slices
  - **New Component**: PaginationControls with 23 comprehensive unit tests
  - **RoundsListScreen Integration**: Full pagination state management and API integration
  - **Features**: Left/right arrow navigation, "Page X of Y" indicator, loading states, boundary handling
  - **User Experience**: Smart visibility (only shows when >20 rounds), pull-to-refresh resets to page 1
  - **Accessibility**: Full screen reader support with proper touch targets
  - **Quality**: 100% test pass rate, production-ready code approved by reviewer
- **Slice 6 (✅ COMPLETED)**: Complete navigation testing - Added comprehensive test coverage for round card navigation to RoundDetail screen. All navigation gaps identified by principal engineer are now covered with 3 additional test cases. Quality: 100% test pass rate (39/39 tests passing).
- **Current Status**: Phase 1.1 Enhanced Rounds List Screen COMPLETE. Ready for next major feature (Round Detail Screen) or other implementation priorities.

#### 1.2 Round Detail Screen ✅ COMPLETED (PENDING UX REDESIGN)
**File**: `src/screens/rounds/RoundDetailScreen.js`

Complete round management interface with full functionality.

**⚠️ UX REDESIGN IN PROGRESS**: Based on user feedback, we're implementing a one-page round experience
where in-progress rounds navigate directly to the scorecard. See `ONE_PAGE_ROUND_IMPLEMENTATION.md`
for the detailed technical approach and implementation plan.

**TDD Slices** (12 slices - ALL COMPLETED):
1. ✅ RankIndicator consolidation (design-system as source of truth)
2. ✅ Leaderboard data fetching service (getRoundLeaderboard)
3. ✅ Leaderboard API integration with error handling
4. ✅ PlayerStandingsCard integration into screen
5. ✅ Wire leaderboard data to PlayerStandingsCard
6. ✅ RoundActionsMenu component (Pause/Complete/Delete buttons)
7. ✅ Pause round functionality with optimistic updates
8. ✅ Complete round functionality with confirmation dialog
9. ✅ Pull-to-refresh for round and leaderboard data
10. ✅ ScoreSummaryCard component (best/worst hole, average)
11. ✅ Loading shimmer skeleton UI
12. ✅ Navigation to ScorecardScreen

**Components Created:**
- `RoundActionsMenu.js` - Action buttons with accessibility
- `ScoreSummaryCard.js` - Round statistics display
- `ScorecardScreen.js` - Placeholder for Phase 1.3

**Services Updated:**
- `roundService.js` - Added pauseRound, completeRound, getRoundLeaderboard

**Test Coverage**: 28 RoundDetailScreen tests, all passing (100%)

**Progress Notes**:
- **Implementation Date**: 2025-09-29
- **Total Tests**: 2,284 passing
- **Code Review**: Completed with all critical issues fixed
- **Accessibility**: Full VoiceOver/TalkBack support
- **Performance**: Optimized with useMemo for StyleSheets
- **Theme**: All colors use theme system (no hardcoded values)
- **Current Status**: Phase 1.2 COMPLETE and production-ready

#### 1.3 Scorecard Component ✅ COMPLETED → 🚀 ONE-PAGE REDESIGN IN PROGRESS
**File**: `src/screens/rounds/ScorecardScreen.js` → `ScorecardRedesignScreen.js`

Interactive hole-by-hole scoring interface with integrated round information.

**🚀 ONE-PAGE REDESIGN STATUS**: Following user feedback, the scorecard has been transformed into
a unified one-page experience. This section tracks the evolution from the original implementation.

**Original TDD Slices** (15 slices - 14 COMPLETED, 1 SKIPPED):
1. ✅ Basic ScorecardScreen structure with loading states
2. ✅ Fetch round details and course par data
3. ✅ Core scorecard UI (hole display, player info, quick score buttons)
4. ✅ Score state management and player iteration
5. ✅ Quick score buttons (-2, -1, Par, +1, +2, +3)
6. ✅ Score entry with auto-advance to next player/hole
7. ✅ Display current hole, par, and player name
8. ✅ AsyncStorage score persistence (immediate save)
9. ✅ Manual hole navigation (Previous/Next buttons)
10. ✅ Swipe gesture navigation (left/right between holes)
11. ✅ Smart confirmation for outlier scores (>10 or >par+5)
12. ✅ Score submission service (submitScores to backend)
13. ✅ Offline queue service (AsyncStorage-based with retry)
14. ⏭️ Offline queue integration (SKIPPED - requires NetInfo package)
15. ✅ Visual score feedback (color-coded with accessibility icons)

**One-Page Redesign Additions** (Post-Original Implementation):
16. ✅ **RoundDetailScreen Deleted** - Consolidated into scorecard-first approach
17. ✅ **Collapsible Round Info Section** - Course, location, holes, status, date
18. ✅ **Collapsible Leaderboard Section** - Live standings with lazy loading
19. ✅ **Collapsible Side Bets Section** - Active bets display with lazy loading
20. ✅ **PlayerScoreRow Alignment Fix** - Running total positioning corrected
21. ✅ **Course Data Backend Fix** - Resolved holes array structure issue
22. ✅ **Drawer Layout Fix (COMPLETED)** - Sections now expand downward naturally using ScrollView

**Features Delivered (Core Scorecard):**
- **Quick Score Entry**: Six buttons for common scores relative to par
- **Gesture Navigation**: Swipe left/right between holes
- **Auto-Save**: Immediate AsyncStorage persistence with debounce (600ms)
- **Smart Validation**: Alert confirmation for unusual scores
- **Visual Feedback**: Color-coded scores (eagle/birdie/par/bogey/double+)
- **Accessibility**: Full screen reader support with proper labels
- **Offline Support**: Queue service ready (integration pending NetInfo)

**Features Delivered (One-Page Redesign):**
- **Integrated Round Info**: Collapsible section showing course and round details
- **Live Leaderboard**: Real-time standings with lazy data loading
- **Side Bets Tracking**: Quick access to active bets without leaving scorecard
- **Unified Navigation**: Single screen for all in-progress round information
- **Progressive Disclosure**: Sections load data only when expanded (performance optimization)

**Current Implementation (ScorecardRedesignScreen.js):**
- **Hero Content**: HoleHeroCard with hole number, par, save status
- **Score Entry**: PlayerScoreRow components with running totals
- **Collapsible Sections**: Round Info, Leaderboard, Side Bets (3 sections)
- **Navigation**: Previous/Next buttons with swipe gesture support
- **Services**: getRoundDetails, getRoundLeaderboard, getRoundSideBets

**Services Created:**
- `offlineQueue.js` - Queue management with retry logic (19 tests)

**Services Updated:**
- `roundService.js` - Added submitScores, getRoundPars, getRoundLeaderboard, getRoundSideBets

**Components Created:**
- `HoleHeroCard.js` - Prominent hole display with context
- `PlayerScoreRow.js` - Individual player score entry row

**Test Coverage**: 20+ ScorecardScreen tests, all passing (100%)

**Known Issues:**
- None - All identified issues have been resolved ✅

**Progress Notes**:
- **Original Implementation**: 2025-09-29 (Slices 1-15)
- **One-Page Redesign**: 2025-10-25 (Slices 16-22)
- **Layout Fix Completed**: 2025-10-25 (Slice 22 - ScrollView restructure)
- **Total Tests**: All passing (100%)
- **Code Review**: Core scorecard completed, one-page redesign fully functional
- **Accessibility**: WCAG AA compliant with full VoiceOver/TalkBack support
- **Performance**: Optimized with useMemo, useCallback, lazy loading for sections
- **Theme**: All colors use theme system (no hardcoded values)
- **Current Status**: Phase 1.3 ONE-PAGE REDESIGN 100% COMPLETE ✅

**Completed Implementation Details (Slice 22):**
- Wrapped entire screen content in ScrollView for natural scroll behavior
- Removed `flex: 1` from playersSection to allow proper content flow
- Set FlatList `scrollEnabled={false}` to delegate scrolling to parent ScrollView
- Collapsible sections now expand downward and push content below them
- Navigation buttons remain fixed at bottom using absolute positioning
- Verification: npm run verify passed 100% with all tests green

### Phase 2: Participant Management (1-2 weeks)

#### 2.1 Enhanced ParticipantSelector
**File**: `src/components/ParticipantSelector.js` (existing)

Current implementation covers most needs, enhancements:
- Search functionality for large friend lists
- Participant role assignment (player vs observer)
- Invitation status tracking

**TDD Slices**:
1. Add search/filter for friends list
2. Implement participant roles
3. Add invitation status indicators
4. Handle invitation acceptance/decline

#### 2.2 Friend Integration
**File**: `src/services/friendService.js` (existing)

Leverage existing friend system for seamless participant selection.

### Phase 3: Skins Games (2 weeks)

#### 3.1 Skins Configuration
**File**: `src/components/SkinsSettings.js` (new)

Skins game setup and configuration:
- Skins value per hole
- Carryover rules
- Validation rules (minimum players, etc.)

**TDD Slices**:
1. Basic skins configuration form
2. Value validation and rules
3. Carryover logic implementation
4. Integration with round creation

#### 3.2 Skins Tracker
**File**: `src/components/SkinsTracker.js` (new)

Live skins game tracking:
- Hole-by-hole skins winners
- Carryover accumulation
- Real-time payouts calculation
- Visual indicators for skins holes

**TDD Slices**:
1. Skins calculation logic
2. Visual tracking display
3. Carryover accumulation
4. Payout calculations
5. Winner highlighting

### Phase 4: Side Betting (2-3 weeks)

#### 4.1 Bet Creation Interface
**File**: `src/components/BetCreator.js` (new)

Flexible side betting creation:
- Predefined bet types (longest drive, closest to pin, etc.)
- Custom bet creation
- Participant selection for bets
- Stake amount setting

**TDD Slices**:
1. Bet type selection interface
2. Custom bet creation form
3. Participant selection for bets
4. Stake validation and confirmation
5. Bet submission and tracking

#### 4.2 Bet Management
**File**: `src/components/BetManager.js` (new)

Active bet tracking and resolution:
- Live bet status updates
- Winner selection interface
- Payout calculations
- Dispute resolution flow

**TDD Slices**:
1. Active bets display
2. Winner selection interface
3. Payout calculation logic
4. Bet resolution workflow
5. Dispute handling

### Phase 5: Advanced Features (2-3 weeks)

#### 5.1 Tournament Mode
Multi-round tournament support:
- Tournament bracket creation
- Cross-round statistics
- Tournament leaderboards
- Playoff handling

#### 5.2 Statistics and Analytics
Comprehensive player statistics:
- Round history analysis
- Performance trends
- Course-specific statistics
- Comparative analytics

#### 5.3 Social Features
Enhanced social integration:
- Round sharing and highlights
- Achievement system
- Leaderboard competitions
- Social betting pools

## Technical Architecture

### State Management
```javascript
// Round Context for global round state
const RoundContext = createContext({
  currentRound: null,
  rounds: [],
  loading: false,
  error: null,
  createRound: () => {},
  updateRound: () => {},
  deleteRound: () => {},
});

// Betting Context for side bets and skins
const BettingContext = createContext({
  activeBets: [],
  skinsGame: null,
  payouts: {},
  createBet: () => {},
  resolveBet: () => {},
});
```

### Component Hierarchy
```
RoundsProvider
├── RoundsScreen
│   ├── RoundsList
│   ├── CreateRoundFAB
│   └── RoundsFilter
├── CreateRoundScreen
│   ├── CourseSelector
│   ├── ParticipantSelector
│   ├── SkinsSettings
│   └── BetCreator
└── RoundDetailScreen
    ├── RoundOverview
    ├── Scorecard
    ├── SkinsTracker
    ├── BetManager
    └── PlayerStats
```

### Data Flow
1. **Round Creation**: Course → Participants → Game Settings → Betting → Submit
2. **Live Scoring**: Score Entry → Validation → API Update → State Sync → UI Refresh
3. **Skins Tracking**: Score Change → Skins Calculation → Carryover Logic → Display Update
4. **Bet Resolution**: Winner Selection → Payout Calculation → State Update → Notification

## Implementation Guidelines

### TDD Methodology
- Write failing tests first for each component
- Implement minimal code to pass tests
- Refactor for performance and maintainability
- Maintain 100% test coverage throughout

### Performance Considerations
- Lazy load round details to minimize initial load time
- Cache frequently accessed data (courses, friends)
- Optimize re-renders with React.memo and useMemo
- Implement efficient pagination for large datasets

### Accessibility Standards
- Full VoiceOver/TalkBack support
- High contrast mode compatibility
- Touch target size compliance (minimum 44pt)
- Screen reader optimized navigation flow

### Security Implementation
- Input validation on all user data
- Secure bet transaction handling
- Privacy controls for round visibility
- Audit trails for betting activities

## Testing Strategy

### Unit Tests
- Component rendering and props handling
- Business logic functions (scoring, skins, betting)
- API service layer functionality
- Utility functions and calculations

### Integration Tests
- Complete user workflows (create round → add scores → resolve bets)
- API integration with error handling
- Cross-component data flow
- Navigation patterns

### E2E Tests
- Critical user journeys
- Payment flow validation
- Multi-user round scenarios
- Performance benchmarking

## Deployment Strategy

### Feature Flags
Implement feature flags for gradual rollout:
- `ENABLE_SKINS_GAMES`
- `ENABLE_SIDE_BETTING`
- `ENABLE_TOURNAMENT_MODE`

### Progressive Rollout
1. **Alpha**: Core team testing (Phase 1)
2. **Beta**: Limited user group (Phases 1-2)
3. **Soft Launch**: 25% of users (Phases 1-3)
4. **Full Release**: All users (Complete feature set)

## Success Metrics

### User Engagement
- Round creation rate increase
- Average session duration improvement
- Feature adoption rates (skins, betting)
- User retention in rounds feature

### Technical Performance
- App performance metrics (load times, crash rates)
- API response times and error rates
- Battery usage optimization
- Memory consumption efficiency

### Business Impact
- User acquisition through rounds feature
- In-app engagement increases
- Community growth and interaction
- Revenue potential from betting features

## Risk Mitigation

### Technical Risks
- **API Performance**: Implement caching and optimistic updates
- **Data Consistency**: Use transactions and conflict resolution
- **Battery Usage**: Optimize background updates and polling

### Business Risks
- **Gambling Concerns**: Implement responsible gaming features
- **User Privacy**: Strong privacy controls and data protection
- **Feature Complexity**: Progressive disclosure and onboarding

### Legal Considerations
- **Betting Regulations**: Comply with local gambling laws
- **Data Protection**: GDPR/CCPA compliance for user data
- **Terms of Service**: Update for betting and competition features

## Conclusion

This comprehensive implementation plan provides a roadmap for building a world-class rounds management system that leverages existing backend infrastructure while delivering exceptional user experience. The phased approach ensures manageable development cycles while maintaining high quality through TDD methodology.

The plan balances feature richness with usability, ensuring both casual players and serious competitors find value in the system. Progressive disclosure keeps the interface approachable while powerful features remain accessible to advanced users.

By following this plan, the DiscBaboons app will establish itself as the premier platform for disc golf round management, social play, and competitive gaming.