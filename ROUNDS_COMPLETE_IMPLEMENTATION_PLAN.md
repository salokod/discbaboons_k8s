# Rounds Feature - Complete Implementation Plan

## Overview
This document provides the complete implementation plan for the Rounds feature, combining technical API specifications with UX design requirements. Each slice is designed to be implemented using TDD methodology with 100% npm run verify success.

---

## Pre-Slice 0: Fix Invited Players Bug (CRITICAL) ✅ COMPLETED

### Problem Statement
Currently, when user 'salokod' creates a round and adds 'salokod3' as a player, salokod sees the round but salokod3 does NOT. This is a critical bug preventing invited players from accessing rounds.

### Root Cause
The `GET /api/rounds` endpoint (specifically `rounds.list.service.js`) only returns rounds where the user is the creator (`created_by_id = userId`). It does NOT check if the user is a participant in the round via the `round_players` table.

### Current Implementation (Broken)
```javascript
// apps/express-server/services/rounds.list.service.js - Line 47
const whereConditions = ['created_by_id = $1'];
```

This query only returns rounds created by the user, ignoring rounds where they are participants.

### Fixed Implementation
```sql
-- Should query both creator and participant
SELECT DISTINCT r.*,
  COUNT(rp.id) AS player_count
FROM rounds r
LEFT JOIN round_players rp ON r.id = rp.round_id
WHERE r.created_by_id = $1 OR rp.user_id = $1
GROUP BY r.id
ORDER BY r.created_at DESC
```

### User Flow

**Before Fix:**
1. User 'salokod' creates round
2. User 'salokod' adds 'salokod3' to round
3. User 'salokod3' opens app → Sees empty rounds list ❌

**After Fix:**
1. User 'salokod' creates round
2. User 'salokod' adds 'salokod3' to round
3. User 'salokod3' opens app → Sees the round ✅
4. Round shows 'salokod' as creator
5. 'salokod3' can view details, enter scores

### UI Design

No UI changes needed. The existing RoundsListScreen will automatically show the newly-returned rounds.

### Notes for Implementer

**Tests to Write (TDD):**

1. **Backend Test: User sees rounds they created**
```javascript
// File: apps/express-server/tests/integration/api/rounds.list.integration.test.js

test('should return rounds where user is creator', async () => {
  const creator = await createTestUser('creator');
  const round = await createTestRound(creator.user.id, course.id, { prefix: 'mycreated' });

  const response = await request(app)
    .get('/api/rounds')
    .set('Authorization', `Bearer ${creator.token}`);

  expect(response.status).toBe(200);
  expect(response.body.rounds).toHaveLength(1);
  expect(response.body.rounds[0].id).toBe(round.round.id);
});
```

2. **Backend Test: User sees rounds they're participating in (THE CRITICAL TEST)**
```javascript
test('should return rounds where user is participant', async () => {
  // Create user1 (salokod) and user2 (salokod3)
  const salokod = await createTestUser({ prefix: 'salokod' });
  const salokod3 = await createTestUser({ prefix: 'salokod3' });

  // salokod creates round
  const round = await createTestRound(salokod.user.id, course.id, { prefix: 'shared' });

  // salokod adds salokod3 to round
  await query(
    'INSERT INTO round_players (id, round_id, user_id) VALUES ($1, $2, $3)',
    [`rp-${Date.now()}`, round.round.id, salokod3.user.id]
  );

  // salokod3 fetches their rounds
  const response = await request(app)
    .get('/api/rounds')
    .set('Authorization', `Bearer ${salokod3.token}`);

  // CRITICAL: salokod3 should see the round
  expect(response.status).toBe(200);
  expect(response.body.rounds.length).toBeGreaterThanOrEqual(1);
  expect(response.body.rounds.find(r => r.id === round.round.id)).toBeDefined();
});
```

3. **Backend Test: User doesn't see unrelated rounds**
```javascript
test('should NOT return rounds user is not associated with', async () => {
  const user1 = await createTestUser({ prefix: 'user1' });
  const user2 = await createTestUser({ prefix: 'user2' });

  // user1 creates round, doesn't add user2
  const round = await createTestRound(user1.user.id, course.id, { prefix: 'private' });

  // user2 fetches their rounds
  const response = await request(app)
    .get('/api/rounds')
    .set('Authorization', `Bearer ${user2.token}`);

  expect(response.status).toBe(200);
  // user2 should NOT see user1's private round
  expect(response.body.rounds.find(r => r.id === round.round.id)).toBeUndefined();
});
```

**Implementation Steps (TDD):**

1. Add Test 1 (creator) to `rounds.list.integration.test.js` → Should PASS (already works)
2. Add Test 2 (participant) to `rounds.list.integration.test.js` → Should FAIL (this is the bug)
3. Fix `rounds.list.service.js` line 47:
   - Change: `const whereConditions = ['created_by_id = $1'];`
   - To: `const whereConditions = ['(r.created_by_id = $1 OR rp.user_id = $1)'];`
4. Update the main query (around line 86) to use table aliases:
   - Change FROM: `FROM rounds r`
   - Ensure WHERE uses: `WHERE ${whereConditions.join(' AND ')}`
5. Run Test 2 → Should PASS
6. Add Test 3 (unrelated) → Should PASS
7. Run `npm run verify` → All tests pass

**Files to Modify:**
- `/Users/dokolas/Desktop/Projects/discbaboons_k8s/apps/express-server/services/rounds.list.service.js` - Fix the query
- `/Users/dokolas/Desktop/Projects/discbaboons_k8s/apps/express-server/tests/integration/api/rounds.list.integration.test.js` - Add tests

**Technical Notes:**
- Use LEFT JOIN to handle rounds with no additional participants yet (creator-only rounds)
- Use DISTINCT to avoid duplicate rows if user is both creator and has a round_players entry
- Maintain pagination metadata calculations (COUNT query needs same WHERE fix)
- Keep ordering by created_at DESC
- Ensure GROUP BY still works with the modified WHERE clause
- The existing player_count calculation should remain accurate

### Notes for Human to Review

**When implementer returns this fix, YOU should check:**

✅ **Test Validation:**
1. Run: `cd apps/express-server && npm test -- rounds.list.integration.test.js`
2. **Verify**: Test "should return rounds where user is participant" PASSES
3. **Verify**: All other tests still pass (no regressions)

✅ **Manual Backend Validation:**
1. Use Postman/Thunder Client
2. Create round as 'salokod', get round ID
3. POST to `/api/rounds/{roundId}/players` with body: `{ "userId": "salokod3-id" }`
4. GET `/api/rounds` with salokod3's auth token
5. **Verify**: Response includes the round created by salokod
6. **Verify**: Round data includes player_count and correct status

✅ **Manual Frontend Validation:**
1. Open mobile app as 'salokod'
2. Create new round
3. Add 'salokod3' as player
4. Log out, log in as 'salokod3'
5. Navigate to Rounds screen
6. **Verify**: Round appears in salokod3's list
7. **Verify**: Round shows correct course name
8. Tap round to open details
9. **Verify**: salokod3 can view scores, add scores, see leaderboard

✅ **Verification Commands:**
```bash
# Backend tests
cd apps/express-server
npm run verify

# Mobile tests
cd apps/mobile-app
npm run verify
```

**If ANY of these fail, send back to implementer.**

### Success Criteria

- ✅ Test "should return rounds where user is participant" PASSES
- ✅ Test "should return rounds where user is creator" PASSES
- ✅ Test "should NOT return rounds user is not associated with" PASSES
- ✅ All existing tests still pass (no regressions)
- ✅ `npm run verify` shows 100% pass rate in express-server
- ✅ Manual test: invited player sees round in app
- ✅ Manual test: creator still sees their rounds
- ✅ Manual test: users don't see unrelated rounds
- ✅ Pagination metadata (total, hasMore) still accurate
- ✅ player_count field still correct

### Estimated Time
1-2 hours

### Why This is Pre-Slice 0
This bug blocks the entire Rounds feature from working properly. Without this fix:
- Users cannot collaborate on rounds
- The "add players" feature appears broken
- User experience is completely broken for invited players

This MUST be fixed before implementing any additional slices, as it affects the core list functionality that all other slices depend on.

### Completion Summary (✅ DONE)

**Implementation Date**: 2025-01-12

**Files Modified**:
- ✅ `apps/express-server/services/rounds.list.service.js` - Fixed WHERE clause to include participants
- ✅ `apps/express-server/tests/integration/api/rounds.list.integration.test.js` - Added test for participant visibility
- ✅ `apps/express-server/tests/unit/services/rounds.list.service.test.js` - Updated assertions for new query
- ✅ `docs/express-server/api/rounds/GET_rounds.md` - Updated documentation

**Test Results**:
- ✅ Integration test "should return rounds where user is a participant" PASSES
- ✅ All existing tests still PASS (no regressions)
- ✅ npm run verify: 100% backend tests passing

**Code Changes**:
- Changed: `const whereConditions = ['created_by_id = $1'];`
- To: `const whereConditions = ['(r.created_by_id = $1 OR rp.user_id = $1)'];`
- Added LEFT JOIN with round_players table
- Updated all filter conditions to use table aliases

**Validation**:
- Principal engineer review: HIGH CONFIDENCE in implementation
- Test chain verified: Create round → Add player → List shows invited player
- Backend proven correct via comprehensive integration tests

**Next Step**: Ready to proceed to Slice 1 when approved by user.

---

## Slice 1: Display Rounds List - Basic Fetch

### Endpoints Used
**GET /api/rounds/my-rounds**
```json
// Request
GET /api/rounds/my-rounds
Headers: { Authorization: "Bearer {token}" }

// Response
{
  "success": true,
  "rounds": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "course_name": "Pier Park",
      "course_id": "course-uuid",
      "created_at": "2024-01-15T10:30:00Z",
      "status": "active",
      "role": "creator",
      "player_count": 4,
      "current_hole": 3
    }
  ]
}
```

### User Flow
1. User opens RoundsListScreen
2. Sees 3 skeleton loading cards animating
3. API call to /api/rounds/my-rounds executes
4. Cards fade in showing actual rounds
5. Each card shows course name, player count, current hole
6. Can tap card to navigate to details

### UI Design
**Components**: NavigationHeader, FlatList, RoundCard, SkeletonCard
**Layout**: Cards 120px height, 16px horizontal padding, 8px vertical spacing
**Colors**: Card background white, text primary #1a1a1a, subtext #666
**States**: Loading (3 skeletons), Empty (centered message), Error (retry banner), Success (round cards)

### Notes for Implementer
**Tests to Write**:
1. Backend integration test: GET /api/rounds/my-rounds returns rounds where user is creator
2. Backend integration test: Returns rounds where user is participant with correct role
3. Frontend test: RoundsListScreen calls API on mount
4. Frontend test: Shows SkeletonCard components while loading
5. Frontend test: Renders RoundCard for each round in response

Use TDD. Write "should export getRounds function" test first, see it fail, implement, verify.

### Notes for Human to Review
1. Open app as salokod user
2. Verify skeleton cards appear immediately
3. Verify rounds load within 2 seconds
4. Check card layout matches design specs
5. Verify: npm run verify passes 100%

---

## Slice 2: Pull to Refresh Rounds List

### Endpoints Used
**GET /api/rounds/my-rounds** (same as Slice 1)

### User Flow
1. User is on RoundsListScreen with rounds displayed
2. User pulls down on the list
3. Refresh indicator appears at top
4. API call executes
5. List updates with any new rounds
6. Refresh indicator disappears

### UI Design
**Components**: RefreshControl (React Native built-in)
**Animation**: Standard iOS/Android pull-to-refresh behavior
**Colors**: Activity indicator uses theme primary color #007AFF
**Feedback**: Haptic feedback on pull threshold

### Notes for Implementer
**Tests to Write**:
1. Frontend test: onRefresh prop triggers API call
2. Frontend test: refreshing state shows RefreshControl
3. Frontend test: List updates after successful refresh
4. Frontend test: Error during refresh shows toast, not error screen

Keep existing rounds visible during refresh. Only replace on success.

### Notes for Human to Review
1. Pull down on rounds list
2. Verify refresh indicator appears
3. Add a round in different device
4. Pull to refresh
5. Verify new round appears

---

## Slice 3: Empty State for No Rounds

### Endpoints Used
**GET /api/rounds/my-rounds** (returns empty array)

### User Flow
1. User opens RoundsListScreen
2. API returns empty rounds array
3. Empty state illustration appears
4. "No rounds yet" message displays
5. "Create Your First Round" button shown
6. Tapping button navigates to create flow

### UI Design
**Components**: EmptyStateView, IllustrationSVG, Button
**Layout**: Centered vertically, 24px padding
**Copy**: "No Active Rounds" (title), "Start a new round to track your game" (subtitle)
**CTA**: Primary button "Create New Round" with plus icon

### Notes for Implementer
**Tests to Write**:
1. Backend test: Returns empty array when user has no rounds
2. Frontend test: Shows EmptyStateView when rounds array is empty
3. Frontend test: Create button navigates to CreateRoundScreen
4. Frontend test: Empty state not shown when rounds exist

### Notes for Human to Review
1. Use fresh test account with no rounds
2. Verify empty state displays correctly
3. Tap create button
4. Verify navigation works

---

## Slice 4: Error Handling for Rounds List

### Endpoints Used
**GET /api/rounds/my-rounds** (network/server errors)

### User Flow
1. User opens RoundsListScreen
2. API call fails (network/500 error)
3. Error banner appears at top
4. "Retry" button available
5. Tapping retry re-attempts API call
6. Success dismisses error banner

### UI Design
**Components**: ErrorBanner, RetryButton
**Layout**: Banner slides down from top, 48px height
**Colors**: Red background #FF3B30, white text
**Copy**: "Couldn't load rounds. Check your connection."

### Notes for Implementer
**Tests to Write**:
1. Frontend test: Network error shows ErrorBanner
2. Frontend test: 500 error shows ErrorBanner
3. Frontend test: Retry button triggers new API call
4. Frontend test: Successful retry hides banner

Don't replace entire screen with error. Show banner above list.

### Notes for Human to Review
1. Turn on airplane mode
2. Open rounds list
3. Verify error banner appears
4. Turn off airplane mode
5. Tap retry, verify rounds load

---

## Slice 5: Auto-Polling for Round Updates

### Endpoints Used
**GET /api/rounds/my-rounds** (polling every 30 seconds)

### User Flow
1. User is on RoundsListScreen
2. Initial rounds display
3. Every 30 seconds, silent API call
4. If data changes, list updates
5. No loading indicator during polls
6. Polling stops when screen unfocused

### UI Design
**Components**: usePolling custom hook
**Behavior**: Silent updates, no loading states
**Animation**: Fade transition for new/updated items
**Performance**: Cancel polling on blur, resume on focus

### Notes for Implementer
**Tests to Write**:
1. Frontend test: usePolling hook calls API every 30 seconds
2. Frontend test: Polling stops when screen loses focus
3. Frontend test: Polling resumes when screen gains focus
4. Frontend test: List updates without showing loading state
5. Frontend test: Memory cleanup on unmount

Use React Query or custom hook with cleanup.

### Notes for Human to Review
1. Open rounds list
2. Have another user add you to a round
3. Wait 30 seconds (don't refresh)
4. Verify new round appears automatically
5. Check no memory leaks in profiler

---

## Slice 6: Course Selection - Search and Display

### Endpoints Used
**GET /api/courses/search**
```json
// Request
GET /api/courses/search?query=pier&limit=10
Headers: { Authorization: "Bearer {token}" }

// Response
{
  "success": true,
  "courses": [
    {
      "id": "course-uuid",
      "name": "Pier Park",
      "city": "Portland",
      "state": "OR",
      "holes": 18,
      "par": 54,
      "distance_miles": 2.3
    }
  ]
}
```

### User Flow
1. User taps "Select Course" on create screen
2. Course search modal opens
3. User types "Pier" in search box
4. Results update as they type (debounced)
5. Course cards show name, location, distance
6. User taps course to select

### UI Design
**Components**: SearchModal, SearchInput, CourseCard
**Layout**: Full screen modal, search bar sticky top
**Search**: 300ms debounce, minimum 2 characters
**Cards**: 80px height, course name prominent, gray subtext for location

### Notes for Implementer
**Tests to Write**:
1. Backend test: Search returns courses matching query
2. Backend test: Returns courses near user location when no query
3. Frontend test: Search input debounces API calls
4. Frontend test: Shows loading state during search
5. Frontend test: Selecting course updates parent state

### Notes for Human to Review
1. Tap "Select Course"
2. Search for "pier"
3. Verify results appear
4. Select a course
5. Verify selection reflected on create screen

---

## Slice 7: Player Selection - Search and Add

### Endpoints Used
**GET /api/users/search**
```json
// Request
GET /api/users/search?query=john&limit=20
Headers: { Authorization: "Bearer {token}" }

// Response
{
  "success": true,
  "users": [
    {
      "id": "user-uuid",
      "username": "johndoe",
      "display_name": "John Doe",
      "avatar_url": "https://...",
      "is_friend": true
    }
  ]
}
```

### User Flow
1. User taps "Add Players" on create screen
2. Player search modal opens
3. Shows friends first, then search
4. User searches or selects from friends
5. Selected players show checkmarks
6. "Done" button confirms selection

### UI Design
**Components**: PlayerSearchModal, UserRow, CheckBox
**Sections**: "Friends" section, "Search Results" section
**Layout**: 60px row height, avatar left, name center, checkbox right
**Limits**: Max 8 players total including creator

### Notes for Implementer
**Tests to Write**:
1. Backend test: Returns friends first in search results
2. Backend test: Search filters by username and display name
3. Frontend test: Shows friends section when no search query
4. Frontend test: Limits selection to 8 players
5. Frontend test: Selected players persist when modal reopens

### Notes for Human to Review
1. Add 3 players from friends
2. Search and add 1 more
3. Try to add 9th player
4. Verify limit message appears
5. Verify selections persist

---

## Slice 8: Side Bets Configuration

### Endpoints Used
None (local state until round creation)

### User Flow
1. User toggles "Enable Side Bets" switch
2. Side bet options appear
3. User sets bet amounts ($1, $2, $5 custom)
4. Selects bet types (closest to pin, long drive)
5. Configures per-hole or per-round
6. Settings saved in local state

### UI Design
**Components**: SwitchRow, AmountSelector, BetTypeCards
**Layout**: Collapsible section, indented when expanded
**Presets**: Quick select $1, $2, $5 buttons
**Types**: Card grid, 2 columns, icon + label

### Notes for Implementer
**Tests to Write**:
1. Frontend test: Toggle switch shows/hides options
2. Frontend test: Amount selector updates state
3. Frontend test: Bet type selection toggles
4. Frontend test: Custom amount validates numeric input
5. Frontend test: Settings included in round creation payload

### Notes for Human to Review
1. Enable side bets
2. Set $2 closest to pin
3. Set $5 long drive
4. Verify UI updates correctly
5. Continue to round creation

---

## Slice 9: Skins Game Configuration

### Endpoints Used
None (local state until round creation)

### User Flow
1. User toggles "Play Skins" switch
2. Skins options appear
3. Sets dollar amount per skin
4. Chooses carry-over rules
5. Optional: Set max skin value
6. Configuration saved locally

### UI Design
**Components**: SwitchRow, AmountInput, RulesSelector
**Layout**: Below side bets section, same indentation pattern
**Input**: Numeric keyboard for amount entry
**Rules**: Radio buttons for carry-over options

### Notes for Implementer
**Tests to Write**:
1. Frontend test: Toggle shows/hides skins options
2. Frontend test: Amount input validates positive numbers
3. Frontend test: Carry-over rule selection updates state
4. Frontend test: Max value validation (must be > per-skin amount)
5. Frontend test: Settings included in round payload

### Notes for Human to Review
1. Enable skins
2. Set $1 per skin
3. Enable carry-overs
4. Set $10 max
5. Verify validation works

---

## Slice 10: Round Creation - Form Validation

### Endpoints Used
None (local validation)

### User Flow
1. User fills in round details
2. Taps "Create Round"
3. Validation runs
4. Missing fields highlighted red
5. Error messages appear below fields
6. Cannot submit until valid

### UI Design
**Components**: FormValidator, ErrorText
**Colors**: Error red #FF3B30, error background #FFF0F0
**Messages**: Below each field, 12px font
**Required**: Course and at least 1 player

### Notes for Implementer
**Tests to Write**:
1. Frontend test: Create button disabled without course
2. Frontend test: Error shows when no players selected
3. Frontend test: Valid form enables create button
4. Frontend test: Error messages clear when fixed
5. Frontend test: Side bet validation when enabled

### Notes for Human to Review
1. Try to create without course
2. Verify error appears
3. Add course, try without players
4. Verify error appears
5. Complete form, verify can submit

---

## Slice 11: Round Creation - API Submission

### Endpoints Used
**POST /api/rounds**
```json
// Request
POST /api/rounds
Headers: { Authorization: "Bearer {token}" }
Body: {
  "course_id": "course-uuid",
  "player_ids": ["player1-uuid", "player2-uuid"],
  "side_bets": {
    "enabled": true,
    "closest_to_pin": 2,
    "long_drive": 5
  },
  "skins": {
    "enabled": true,
    "amount_per_skin": 1,
    "carry_over": true,
    "max_value": 10
  }
}

// Response
{
  "success": true,
  "round": {
    "id": "round-uuid",
    "created_at": "2024-01-15T10:30:00Z",
    "status": "active"
  }
}
```

### User Flow
1. User taps "Create Round"
2. Loading overlay appears
3. API call executes
4. Success navigates to scorecard
5. Error shows message with retry

### UI Design
**Components**: LoadingOverlay, SuccessTransition
**Loading**: Full screen overlay, semi-transparent
**Success**: Brief checkmark animation before navigation
**Error**: Modal with message and retry button

### Notes for Implementer
**Tests to Write**:
1. Backend test: Creates round with all fields
2. Backend test: Creates round_players entries
3. Backend test: Validates required fields
4. Frontend test: Shows loading during submission
5. Frontend test: Navigates to scorecard on success
6. Frontend test: Shows error modal on failure

### Notes for Human to Review
1. Fill complete form
2. Create round
3. Verify loading state
4. Verify navigation to scorecard
5. Check database has correct data

---

## Slice 12: Round Creation - Success Navigation

### Endpoints Used
None (navigation only)

### User Flow
1. Round creation succeeds
2. Success animation plays (0.5s)
3. Navigate to ScorecardScreen
4. Pass round_id as param
5. Scorecard loads round data
6. Back button returns to rounds list

### UI Design
**Components**: SuccessAnimation (Lottie), Navigation
**Animation**: Green checkmark, 0.5s duration
**Navigation**: Replace stack, not push
**Back**: Goes to rounds list, not create screen

### Notes for Implementer
**Tests to Write**:
1. Frontend test: Success triggers navigation
2. Frontend test: Round ID passed as route param
3. Frontend test: Navigation replaces stack
4. Frontend test: Back button goes to list
5. Frontend test: Animation completes before nav

### Notes for Human to Review
1. Create a round
2. See success animation
3. Land on scorecard
4. Press back
5. Verify on rounds list, not create

---

## Slice 13: Round Creation - Error Recovery

### Endpoints Used
**POST /api/rounds** (retry after error)

### User Flow
1. Round creation fails
2. Error modal appears
3. Shows specific error message
4. "Retry" and "Cancel" buttons
5. Retry re-submits same data
6. Cancel returns to form

### UI Design
**Components**: ErrorModal, RetryButton, CancelButton
**Layout**: Centered modal, 80% width
**Copy**: Dynamic based on error type
**Actions**: Two buttons, equal width

### Notes for Implementer
**Tests to Write**:
1. Frontend test: Network error shows retry modal
2. Frontend test: Validation error shows message
3. Frontend test: Retry button re-submits
4. Frontend test: Cancel returns to form with data intact
5. Frontend test: Multiple retries allowed

### Notes for Human to Review
1. Create round with airplane mode on
2. Verify error modal
3. Turn off airplane mode
4. Tap retry
5. Verify successful creation

---

## Slice 14: View Active Side Bets

### Endpoints Used
**GET /api/rounds/:id/side-bets**
```json
// Request
GET /api/rounds/round-uuid/side-bets
Headers: { Authorization: "Bearer {token}" }

// Response
{
  "success": true,
  "side_bets": [
    {
      "id": "bet-uuid",
      "type": "closest_to_pin",
      "hole_number": 3,
      "amount": 2,
      "participants": ["user1", "user2"],
      "winner_id": null,
      "status": "active"
    }
  ]
}
```

### User Flow
1. User opens round details
2. Taps "Side Bets" tab
3. Sees list of active bets
4. Each shows type, hole, amount
5. Can tap to view details
6. Shows participants and status

### UI Design
**Components**: TabView, BetCard, StatusBadge
**Layout**: Cards with 12px spacing
**States**: Active (green), Pending (yellow), Settled (gray)
**Icons**: Trophy for won, clock for pending

### Notes for Implementer
**Tests to Write**:
1. Backend test: Returns bets for round
2. Backend test: Only shows bets user participates in
3. Frontend test: Fetches bets on tab focus
4. Frontend test: Shows correct status badges
5. Frontend test: Tap navigates to bet details

### Notes for Human to Review
1. Open round with side bets
2. Go to side bets tab
3. Verify bets display
4. Check status indicators
5. Tap bet for details

---

## Slice 15: Create New Side Bet

### Endpoints Used
**POST /api/rounds/:id/side-bets**
```json
// Request
POST /api/rounds/round-uuid/side-bets
Headers: { Authorization: "Bearer {token}" }
Body: {
  "type": "closest_to_pin",
  "hole_number": 3,
  "amount": 5,
  "participant_ids": ["user1", "user2"]
}

// Response
{
  "success": true,
  "side_bet": {
    "id": "new-bet-uuid",
    "created_at": "2024-01-15T10:35:00Z"
  }
}
```

### User Flow
1. User taps "Add Bet" button
2. Modal opens with bet form
3. Selects type, hole, amount
4. Chooses participants
5. Taps "Create"
6. Bet appears in list

### UI Design
**Components**: BetCreationModal, TypeSelector, ParticipantPicker
**Layout**: Full screen modal
**Validation**: Require all fields
**Feedback**: Success toast after creation

### Notes for Implementer
**Tests to Write**:
1. Backend test: Creates bet with valid data
2. Backend test: Validates hole number in range
3. Frontend test: Modal opens on button tap
4. Frontend test: Form validation works
5. Frontend test: Success updates bet list

### Notes for Human to Review
1. Add new side bet
2. Pick closest to pin, hole 3
3. Add 2 participants
4. Create bet
5. Verify appears in list

---

## Slice 16: Join Existing Side Bet

### Endpoints Used
**POST /api/rounds/:id/side-bets/:betId/join**
```json
// Request
POST /api/rounds/round-uuid/side-bets/bet-uuid/join
Headers: { Authorization: "Bearer {token}" }

// Response
{
  "success": true,
  "message": "Joined bet successfully"
}
```

### User Flow
1. User sees open bet
2. "Join" button visible
3. Taps to join
4. Confirmation modal
5. Confirms join
6. Updates to show as participant

### UI Design
**Components**: JoinButton, ConfirmModal
**States**: Can join (blue button), Already joined (gray)
**Modal**: Shows bet details and amount
**Feedback**: Success animation on join

### Notes for Implementer
**Tests to Write**:
1. Backend test: Adds user to participants
2. Backend test: Prevents duplicate joins
3. Frontend test: Shows join button when not participant
4. Frontend test: Confirmation modal appears
5. Frontend test: Updates UI after joining

### Notes for Human to Review
1. Find bet you haven't joined
2. Tap join button
3. Confirm in modal
4. Verify now shows as participant
5. Verify can't join again

---

## Slice 17: Settle Side Bet

### Endpoints Used
**POST /api/rounds/:id/side-bets/:betId/settle**
```json
// Request
POST /api/rounds/round-uuid/side-bets/bet-uuid/settle
Headers: { Authorization: "Bearer {token}" }
Body: {
  "winner_id": "user-uuid"
}

// Response
{
  "success": true,
  "side_bet": {
    "winner_id": "user-uuid",
    "status": "settled",
    "settled_at": "2024-01-15T11:00:00Z"
  }
}
```

### User Flow
1. User opens active bet
2. Taps "Settle Bet"
3. Selects winner from participants
4. Confirms selection
5. Bet marked as settled
6. Shows winner with trophy icon

### UI Design
**Components**: SettleModal, WinnerSelector, TrophyIcon
**Layout**: Radio list of participants
**Confirmation**: "Are you sure?" step
**Success**: Trophy animation, then close

### Notes for Implementer
**Tests to Write**:
1. Backend test: Updates bet with winner
2. Backend test: Only bet creator can settle
3. Frontend test: Settle button only for creator
4. Frontend test: Winner selection required
5. Frontend test: Updates to settled state

### Notes for Human to Review
1. Open bet you created
2. Tap settle
3. Pick winner
4. Confirm
5. Verify shows as settled

---

## Slice 18: Track Side Bet Status

### Endpoints Used
**GET /api/rounds/:id/side-bets** (polling)

### User Flow
1. Bets show real-time status
2. Active -> shows participants
3. Settled -> shows winner
4. Pending -> shows waiting
5. Auto-updates via polling

### UI Design
**Components**: StatusIndicator, WinnerBadge
**Colors**: Green (active), Gold (won), Gray (lost)
**Updates**: Fade transition on status change
**Polling**: Every 30 seconds when screen focused

### Notes for Implementer
**Tests to Write**:
1. Frontend test: Shows correct status color
2. Frontend test: Winner badge appears when settled
3. Frontend test: Polling updates status
4. Frontend test: Calculates winnings correctly
5. Frontend test: Shows total won/lost

### Notes for Human to Review
1. Have active and settled bets
2. Check status indicators
3. Have someone settle a bet
4. Wait for poll update
5. Verify status changes

---

## Slice 19: Enable Skins Game

### Endpoints Used
**POST /api/rounds/:id/skins**
```json
// Request
POST /api/rounds/round-uuid/skins
Headers: { Authorization: "Bearer {token}" }
Body: {
  "enabled": true,
  "amount_per_skin": 2,
  "carry_over": true
}

// Response
{
  "success": true,
  "skins": {
    "id": "skins-uuid",
    "round_id": "round-uuid",
    "enabled": true
  }
}
```

### User Flow
1. Round creator opens settings
2. Toggles "Enable Skins"
3. Sets amount per skin
4. Configures carry-over
5. Saves settings
6. Other players notified

### UI Design
**Components**: SkinsToggle, AmountInput, SettingsForm
**Layout**: In round settings modal
**Validation**: Positive amounts only
**Notification**: Toast to all players

### Notes for Implementer
**Tests to Write**:
1. Backend test: Creates skins configuration
2. Backend test: Only creator can enable
3. Frontend test: Toggle enables form fields
4. Frontend test: Saves configuration
5. Frontend test: Notifies other players

### Notes for Human to Review
1. Create round as owner
2. Enable skins
3. Set $2 per skin
4. Save settings
5. Verify others see notification

---

## Slice 20: Track Skins During Round

### Endpoints Used
**GET /api/rounds/:id/skins/status**
```json
// Request
GET /api/rounds/round-uuid/skins/status
Headers: { Authorization: "Bearer {token}" }

// Response
{
  "success": true,
  "skins": {
    "current_value": 6,
    "carry_over_from": [3, 4],
    "hole_winners": {
      "1": "user1-uuid",
      "2": "user2-uuid",
      "3": null
    }
  }
}
```

### User Flow
1. Skins indicator on scorecard
2. Shows current skin value
3. Updates after each hole
4. Highlights when carrying over
5. Shows who won each skin

### UI Design
**Components**: SkinsIndicator, ValueBadge, CarryOverAlert
**Position**: Below hole number on scorecard
**Animation**: Pulse when value increases
**Colors**: Gold for value, red for carry-over

### Notes for Implementer
**Tests to Write**:
1. Backend test: Calculates skin values
2. Backend test: Tracks carry-overs
3. Frontend test: Shows current value
4. Frontend test: Updates on score entry
5. Frontend test: Shows carry-over alert

### Notes for Human to Review
1. Play round with skins
2. Tie a hole
3. Verify carry-over shown
4. Win next hole
5. Verify gets combined value

---

## Slice 21: Calculate Skins Payouts

### Endpoints Used
**GET /api/rounds/:id/skins/payouts**
```json
// Request
GET /api/rounds/round-uuid/skins/payouts
Headers: { Authorization: "Bearer {token}" }

// Response
{
  "success": true,
  "payouts": [
    {
      "player_id": "user1-uuid",
      "username": "johndoe",
      "holes_won": [1, 5, 9],
      "total_skins": 3,
      "payout_amount": 6
    }
  ]
}
```

### User Flow
1. Round completes
2. "View Payouts" button appears
3. Opens payout summary
4. Shows each player's winnings
5. Details which holes won

### UI Design
**Components**: PayoutModal, PlayerPayoutCard
**Layout**: Modal with player list
**Info**: Avatar, name, holes, amount
**Actions**: Share or close

### Notes for Implementer
**Tests to Write**:
1. Backend test: Calculates correct payouts
2. Backend test: Handles carry-overs in calculation
3. Frontend test: Shows payout modal
4. Frontend test: Displays all winners
5. Frontend test: Share generates text summary

### Notes for Human to Review
1. Complete round with skins
2. Tap view payouts
3. Verify amounts correct
4. Check hole numbers
5. Try sharing summary

---

## Slice 22: View Round Details

### Endpoints Used
**GET /api/rounds/:id**
```json
// Request
GET /api/rounds/round-uuid
Headers: { Authorization: "Bearer {token}" }

// Response
{
  "success": true,
  "round": {
    "id": "round-uuid",
    "course_name": "Pier Park",
    "created_at": "2024-01-15T10:30:00Z",
    "status": "active",
    "players": [
      {
        "id": "user1-uuid",
        "username": "johndoe",
        "current_score": -2
      }
    ],
    "current_hole": 7,
    "side_bets_enabled": true,
    "skins_enabled": true
  }
}
```

### User Flow
1. User taps round from list
2. Details screen opens
3. Shows course, players, status
4. Displays current standings
5. Links to scorecard
6. Shows settings if owner

### UI Design
**Components**: RoundDetailHeader, PlayerStandings, ActionButtons
**Layout**: Header with course info, player list below
**Actions**: "Open Scorecard", "Settings" (owner only)
**Status**: Badge showing active/completed

### Notes for Implementer
**Tests to Write**:
1. Backend test: Returns full round details
2. Backend test: Includes player scores
3. Frontend test: Fetches details on mount
4. Frontend test: Shows all player info
5. Frontend test: Owner sees settings button

### Notes for Human to Review
1. Open round details
2. Verify all info displayed
3. Check player standings
4. If owner, see settings
5. Navigate to scorecard

---

## Slice 23: Edit Round Settings

### Endpoints Used
**PATCH /api/rounds/:id**
```json
// Request
PATCH /api/rounds/round-uuid
Headers: { Authorization: "Bearer {token}" }
Body: {
  "side_bets": {
    "enabled": false
  }
}

// Response
{
  "success": true,
  "round": {
    "id": "round-uuid",
    "side_bets_enabled": false
  }
}
```

### User Flow
1. Owner opens round settings
2. Modal with editable options
3. Can toggle side bets/skins
4. Can add/remove players
5. Save updates round
6. Changes notify all players

### UI Design
**Components**: SettingsModal, ToggleRows, SaveButton
**Layout**: Full screen modal
**Sections**: Players, Side Bets, Skins
**Validation**: Can't remove mid-game players

### Notes for Implementer
**Tests to Write**:
1. Backend test: Only owner can edit
2. Backend test: Validates changes
3. Frontend test: Settings modal opens
4. Frontend test: Changes update state
5. Frontend test: Save shows loading

### Notes for Human to Review
1. Open settings as owner
2. Toggle side bets off
3. Save changes
4. Verify round updated
5. Check others notified

---

## Slice 24: Delete Round

### Endpoints Used
**DELETE /api/rounds/:id**
```json
// Request
DELETE /api/rounds/round-uuid
Headers: { Authorization: "Bearer {token}" }

// Response
{
  "success": true,
  "message": "Round deleted successfully"
}
```

### User Flow
1. Owner opens round settings
2. Scrolls to bottom
3. Taps "Delete Round"
4. Confirmation modal appears
5. Types "DELETE" to confirm
6. Round removed, returns to list

### UI Design
**Components**: DeleteButton, ConfirmationModal
**Color**: Red delete button
**Modal**: Requires typing "DELETE"
**Warning**: "This cannot be undone"
**Navigation**: Returns to rounds list

### Notes for Implementer
**Tests to Write**:
1. Backend test: Only owner can delete
2. Backend test: Soft deletes round
3. Frontend test: Delete button only for owner
4. Frontend test: Confirmation required
5. Frontend test: Navigates to list after delete

### Notes for Human to Review
1. Open round as owner
2. Go to settings
3. Tap delete
4. Type DELETE
5. Verify round removed from list

---

## Slice 25: Share Round

### Endpoints Used
**POST /api/rounds/:id/share**
```json
// Request
POST /api/rounds/round-uuid/share
Headers: { Authorization: "Bearer {token}" }

// Response
{
  "success": true,
  "share_link": "https://app.discbaboons.com/rounds/round-uuid",
  "share_code": "ABC123"
}
```

### User Flow
1. User taps share button
2. Share sheet opens
3. Options: Link, Code, or Text
4. Can share via any app
5. Recipients can join via link

### UI Design
**Components**: ShareSheet (native), ShareOptions
**Format**: Text includes course and players
**Code**: 6-character alphanumeric
**Link**: Deep link to round

### Notes for Implementer
**Tests to Write**:
1. Backend test: Generates share link
2. Backend test: Creates unique code
3. Frontend test: Share button opens sheet
4. Frontend test: Formats share text
5. Frontend test: Copies link to clipboard option

### Notes for Human to Review
1. Open round details
2. Tap share
3. Try each share option
4. Send to another device
5. Verify link opens round

---

## Slice 26: Score Entry - Basic Input

### Endpoints Used
**POST /api/rounds/:id/scores**
```json
// Request
POST /api/rounds/round-uuid/scores
Headers: { Authorization: "Bearer {token}" }
Body: {
  "hole_number": 3,
  "strokes": 4
}

// Response
{
  "success": true,
  "score": {
    "id": "score-uuid",
    "hole_number": 3,
    "strokes": 4,
    "created_at": "2024-01-15T10:45:00Z"
  }
}
```

### User Flow
1. User on scorecard screen
2. Taps hole 3 input
3. Number pad appears
4. Enters score (4)
5. Score saves automatically
6. Input highlights briefly

### UI Design
**Components**: ScoreInput, NumberPad, SaveIndicator
**Layout**: Grid of holes, 3 columns
**Input**: Large touch targets, 44px minimum
**Feedback**: Green flash on save

### Notes for Implementer
**Tests to Write**:
1. Backend test: Saves score for hole
2. Backend test: Updates existing score
3. Frontend test: Number pad opens on tap
4. Frontend test: Score saves on entry
5. Frontend test: Shows save indicator

### Notes for Human to Review
1. Open scorecard
2. Enter score for hole 3
3. See save indicator
4. Change score
5. Verify updates

---

## Slice 27: Score Entry - Auto-Save

### Endpoints Used
**POST /api/rounds/:id/scores** (debounced)

### User Flow
1. User enters score
2. 1 second delay
3. Auto-saves to server
4. Small checkmark appears
5. If offline, queues for later
6. Syncs when online

### UI Design
**Components**: AutoSave, SyncIndicator, OfflineQueue
**Timing**: 1 second debounce
**Indicator**: Small checkmark fade-in
**Offline**: Orange indicator, "Saved locally"

### Notes for Implementer
**Tests to Write**:
1. Frontend test: Debounces save calls
2. Frontend test: Shows checkmark on success
3. Frontend test: Queues when offline
4. Frontend test: Syncs queue when online
5. Frontend test: Handles save failures

### Notes for Human to Review
1. Enter score rapidly
2. Verify saves after pause
3. Turn on airplane mode
4. Enter score
5. Turn off airplane mode
6. Verify syncs

---

## Slice 28: Score Entry - Validation

### Endpoints Used
None (client-side validation)

### User Flow
1. User enters score
2. Validation checks range (1-10)
3. Invalid shows red border
4. Warning for unusual scores
5. Can override warning
6. Cannot save invalid

### UI Design
**Components**: ValidationBorder, WarningToast
**Colors**: Red border for invalid
**Warning**: "That's a high score. Sure?"
**Range**: 1-10 normal, warning above

### Notes for Implementer
**Tests to Write**:
1. Frontend test: Rejects scores < 1
2. Frontend test: Shows red border for invalid
3. Frontend test: Warning for scores > 10
4. Frontend test: Can confirm high score
5. Frontend test: Clears validation on fix

### Notes for Human to Review
1. Try entering 0
2. Verify shows error
3. Enter 15
4. See warning
5. Confirm to save

---

## Slice 29: Real-Time Score Sync

### Endpoints Used
**WebSocket: /api/rounds/:id/subscribe**
```json
// Incoming message
{
  "type": "score_update",
  "player_id": "user2-uuid",
  "hole_number": 5,
  "strokes": 3
}
```

### User Flow
1. Multiple players in round
2. Player A enters score
3. Player B sees update immediately
4. Score appears with animation
5. Leaderboard updates
6. No page refresh needed

### UI Design
**Components**: WebSocketProvider, ScoreUpdate
**Animation**: Fade in for others' scores
**Color**: Light blue flash for updates
**Leaderboard**: Instant reorder with animation

### Notes for Implementer
**Tests to Write**:
1. Backend test: Broadcasts score updates
2. Frontend test: Connects to WebSocket
3. Frontend test: Receives score updates
4. Frontend test: Updates UI on message
5. Frontend test: Reconnects on disconnect

### Notes for Human to Review
1. Open round on 2 devices
2. Enter score on device 1
3. See update on device 2
4. Check no delay
5. Verify leaderboard updates

---

## Slice 30: Round Completion

### Endpoints Used
**POST /api/rounds/:id/complete**
```json
// Request
POST /api/rounds/round-uuid/complete
Headers: { Authorization: "Bearer {token}" }

// Response
{
  "success": true,
  "round": {
    "status": "completed",
    "completed_at": "2024-01-15T12:00:00Z",
    "final_scores": [
      {
        "player_id": "user1-uuid",
        "total_strokes": 56,
        "score": "+2"
      }
    ]
  }
}
```

### User Flow
1. All holes have scores
2. "Complete Round" button appears
3. User taps button
4. Confirmation modal
5. Round marked complete
6. Shows final standings

### UI Design
**Components**: CompleteButton, StandingsModal
**Button**: Green, bottom of scorecard
**Modal**: Final scores, podium view
**Trophy**: Winner gets gold trophy icon

### Notes for Implementer
**Tests to Write**:
1. Backend test: Validates all holes scored
2. Backend test: Calculates final scores
3. Frontend test: Button appears when complete
4. Frontend test: Shows confirmation
5. Frontend test: Displays final standings

### Notes for Human to Review
1. Complete all holes
2. See complete button
3. Tap to complete
4. Confirm in modal
5. View final standings

---

## Slice 31: Offline Support - Queue Management

### Endpoints Used
None (local storage)

### User Flow
1. User loses connection
2. Continues using app
3. Actions queued locally
4. "Offline" banner shows
5. Reconnects automatically
6. Queue syncs in order

### UI Design
**Components**: OfflineBanner, SyncQueue, RetryManager
**Banner**: Orange, top of screen
**Text**: "Offline - will sync when connected"
**Queue**: Shows pending action count

### Notes for Implementer
**Tests to Write**:
1. Frontend test: Detects offline state
2. Frontend test: Queues API calls
3. Frontend test: Shows offline banner
4. Frontend test: Syncs queue on reconnect
5. Frontend test: Handles sync failures

### Notes for Human to Review
1. Use app normally
2. Turn on airplane mode
3. Make several changes
4. See offline banner
5. Turn off airplane mode
6. Verify all syncs

---

## Slice 32: Performance Optimization - List Virtualization

### Endpoints Used
GET /api/rounds/my-rounds (with pagination)

### User Flow
1. User has 50+ rounds
2. List renders smoothly
3. Scrolls without lag
4. Images load on demand
5. Memory usage stays low

### UI Design
**Components**: VirtualizedList, LazyImage
**Rendering**: Only visible + buffer
**Images**: Placeholder while loading
**Scroll**: 60fps target

### Notes for Implementer
**Tests to Write**:
1. Frontend test: Renders only visible items
2. Frontend test: Loads more on scroll
3. Frontend test: Recycles row components
4. Frontend test: Images load lazily
5. Performance test: Maintains 60fps

### Notes for Human to Review
1. Create 50+ rounds (test data)
2. Open rounds list
3. Scroll quickly
4. Check no jank
5. Monitor memory usage

---

## Summary

This implementation plan provides 32 thin slices covering:
- **Rounds List**: Display, refresh, empty states, errors, polling (Slices 1-5)
- **Round Creation**: Course selection, players, bets, validation, submission (Slices 6-13)
- **Side Bets**: View, create, join, settle, track (Slices 14-18)
- **Skins**: Enable, track, calculate payouts (Slices 19-21)
- **Round Management**: View, edit, delete, share (Slices 22-25)
- **Scorecard**: Entry, auto-save, validation, sync, completion (Slices 26-30)
- **Infrastructure**: Offline support, performance (Slices 31-32)

Each slice is designed to be:
- Independently testable
- Completable in 1-2 hours
- Verifiable with `npm run verify` at 100%
- Deliverable to production

The human should review each slice by:
1. Running the test suite
2. Testing the user flow manually
3. Verifying the UI matches design
4. Checking database state
5. Confirming npm run verify passes 100%