# Planning Documentation

Active planning documents and archived development work.

## Active Planning

### 🎯 Current Priorities
- **[Minimum Viable Endpoints](./minimumViableEndpoints.md)** - Backend endpoints needed before v1 frontend launch
- **[React Native Flow Ideas](./reactnativeflowideas.md)** - Frontend planning and user flow concepts

## Completed Work (Archive)

### Route Reviews & Code Quality
- **[route-reviews/](./archive/route-reviews/)** - Comprehensive API endpoint reviews (completed)
  - `ROUTE_REVIEW_PLAN.md` - Review methodology and progress tracking
  - `ROUTE_REVIEW_*.md` - Individual route file reviews
  - `AUTH_ROUTES_REVIEW_PR_DESCRIPTION.md` - Authentication routes PR review

### Feature Development Plans
- **[bagdevplan.md](./archive/bagdevplan.md)** - Bag management system development plan (completed)
- **[rounddevplan.md](./archive/rounddevplan.md)** - Round management system development plan (completed)
- **[discmasteridea.md](./archive/discmasteridea.md)** - Disc master database concepts (completed)

## Current Status

### ✅ Completed Backend Features
- Full authentication and user management system
- Course database with 7000+ courses and search functionality
- Bag management with disc tracking and friend visibility
- Round management with player invitation and scoring
- Skins calculation with carry-over logic
- Side bet system with categorization and suggestions
- Comprehensive friend system
- Profile management with privacy controls

### 🚧 In Progress
- **Side Bet Cancellation Endpoint** - ✅ COMPLETED
- **Round Completion Endpoint** - ✅ COMPLETED  
- **GPS Course Search Endpoint** - ⏳ PENDING (last priority endpoint)

### 📱 Next Phase: React Native Frontend
Once the final GPS endpoint is implemented, the backend will be complete for v1 frontend development.

## Backend Architecture Summary

The backend provides a complete foundation with:
- **7 main feature areas**: Authentication, Profiles, Friends, Courses, Bags, Discs, Rounds
- **50+ API endpoints** with comprehensive CRUD operations
- **Dual betting systems**: Traditional skins + side bets with money tracking
- **Real-time scoring** with leaderboard calculations
- **Security-first design** with proper authorization and validation
- **Production-ready infrastructure** on Kubernetes

## Frontend Planning Considerations

Key considerations for React Native development:
1. **Navigation**: Tab-based with round management as primary flow
2. **Offline Support**: Score caching for poor connectivity scenarios
3. **Real-time Updates**: Consider WebSocket for live scoring (v2 feature)
4. **User Experience**: Focus on quick score entry and leaderboard viewing
5. **GPS Integration**: Course discovery and location-based features

## Documentation Standards

All planning documents follow these principles:
- **Clear status indicators**: ✅ Completed, 🚧 In Progress, ⏳ Pending
- **Priority levels**: High, Medium, Low with time estimates
- **Implementation notes**: Technical considerations and dependencies
- **Archive completed work**: Keep for reference but separate from active planning

For development standards and methodology, see [Standards Documentation](../standards/).