# Minimum Viable Endpoints for v1 Frontend Launch

## 🎯 Priority Endpoints to Implement Before Frontend

Based on comprehensive analysis of existing endpoints and user experience requirements, these three endpoints should be implemented before starting frontend development:

### 1. ✅ Side Bet Cancellation Endpoint - COMPLETED
**Endpoint**: `DELETE /api/rounds/:id/side-bets/:betId`  
**Priority**: High  
**Status**: ✅ **IMPLEMENTED**  
**Completion Date**: January 2025

#### ✅ Completed Features:
- ✅ Any participant can cancel a bet (authorization implemented)
- ✅ Sets `cancelled_at` timestamp and `cancelled_by_id` in database
- ✅ Returns `{ success: true }` on successful cancellation
- ✅ Full validation (UUID format, user authorization, bet existence)
- ✅ Comprehensive test coverage (unit, controller, route, integration tests)
- ✅ Error handling with proper HTTP status codes
- ✅ Rate limiting implemented (`roundsSideBetsRateLimit` + `roundsRequestLimit`)

#### Implementation Details:
- Service: `sideBets.cancel.service.js` with full validation and authorization
- Controller: `sideBets.cancel.controller.js` following existing patterns
- Route: `DELETE /api/rounds/:id/side-bets/:betId` with authentication middleware
- Tests: 19 total tests across all layers (service, controller, route, integration)
- Database: Uses existing `cancelled_at` and `cancelled_by_id` fields from V24 migration

---

### 2. Round Completion Endpoint
**Endpoint**: `POST /api/rounds/:id/complete` or update existing `PUT /api/rounds/:id` to accept `status: "completed"`  
**Priority**: High  
**Estimated Time**: 1 hour  
**Rationale**: Rounds currently stay "in_progress" forever with no way to mark them complete

#### Requirements:
- Only allow completion if all players have scores for all holes
- Validate that round is currently "in_progress"
- Set `status` to "completed" and update `updated_at`
- Trigger final calculations for skins and side bets
- Return comprehensive round summary with final standings

#### Implementation Notes:
- Consider using existing `PUT /api/rounds/:id` endpoint with status validation
- Add business logic to check score completion
- Could auto-suggest bet winners based on bet categories

---

### 3. GPS Course Search Endpoint
**Endpoint**: `GET /api/courses?latitude=X&longitude=Y&radius=10`  
**Priority**: High  
**Estimated Time**: 2 hours  
**Rationale**: Essential for mobile "find nearby courses" functionality

#### Requirements:
- Add `latitude`, `longitude`, and `radius` query parameters
- Radius in miles (default: 10, max: 50)
- Use PostgreSQL geographic functions for distance calculation
- Return courses ordered by distance (closest first)
- Include distance in response for each course

#### Implementation Notes:
- Database already has indexes on latitude/longitude (idx_courses_location)
- Use Haversine formula or PostGIS for distance calculations
- Update `courses.search.service.js` to handle location-based queries
- Combine with existing filters (can search by location AND name/city)

---

## ✅ Already Complete Features

### Authentication & User Management
- Full auth flow (register, login, password reset, refresh tokens)
- Profile management and search
- Friend system with requests/acceptance

### Course Management (7000+ courses)
- Text and boolean search filters
- User course submissions with admin approval
- Friend visibility for unapproved courses
- Edit permissions (owner/friend/admin)

### Round Management
- Complete CRUD operations
- Player management (friends + guests)
- Starting hole selection
- Privacy controls

### Scoring System
- Batch score submission
- Dynamic par management
- Score matrix with calculations
- Real-time leaderboard

### Betting System
- Skins calculation with carry-over
- Side bet creation with categories
- Winner declaration and money tracking
- Bet suggestions endpoint
- Integrated financial tracking in leaderboard

---

## 🔮 Nice-to-Have Features (After v1 Launch)

### Medium Priority
1. **Skins History/Audit Trail**
   - `GET /api/rounds/:id/skins/history`
   - Track changes when scores are edited
   - Show who made changes and when

2. **Round Statistics**
   - `GET /api/rounds/:id/stats`
   - Birdies, pars, bogeys per player
   - Scoring trends throughout round

3. **Bulk Score Operations**
   - `DELETE /api/rounds/:id/scores` - Clear all scores
   - `POST /api/rounds/:id/clone` - Copy round setup for recurring games

4. **Auto-Recalculation System**
   - Automatic skins recalculation on score/par changes
   - WebSocket notifications when calculations change

### Low Priority (v2 Features)
1. **Real-time Updates**
   - WebSocket/SSE for live scoring
   - Push notifications for round events
   - Optimistic UI updates

2. **Analytics APIs**
   - `GET /api/analytics/betting/player/:userId`
   - Performance trends over time
   - Betting success rates by category

3. **Tournament Mode**
   - Multi-round competitions
   - Aggregate scoring across rounds
   - Tournament leaderboards

4. **Social Features**
   - Round photo/video attachments
   - Achievement system
   - Round result sharing

5. **Offline Support**
   - Score caching for offline play
   - Background sync when reconnected
   - Conflict resolution

6. **Advanced Course Features**
   - Course difficulty analysis
   - Hole-by-hole statistics
   - Weather integration

---

## 📋 Implementation Progress

### ✅ Completed (1/3)
1. **Side Bet Cancellation** - ✅ DONE (January 2025)
   - Full implementation with TDD approach
   - Comprehensive test coverage (19 tests)
   - API documentation created

### 🚧 Remaining (2/3)
2. **Round Completion Endpoint** - ⏳ PENDING
3. **GPS Course Search Endpoint** - ⏳ PENDING

### Next Steps
1. **Next**: Implement Round Completion endpoint (estimated 1 hour)
2. **Then**: Implement GPS Course Search (estimated 2 hours)
3. **After**: Ready for v1 frontend development

## 🚀 Ready for Frontend

Once the three priority endpoints are implemented, the backend will have:
- Complete user authentication and profiles
- Full course database with search
- Comprehensive round management
- Real-time scoring with leaderboard
- Dual betting systems (skins + side bets)
- All necessary CRUD operations

This provides a solid foundation for building an engaging v1 frontend experience.