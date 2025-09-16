# Baboons (Friends) Feature Implementation Plan
*Professional Friends Management for DiscBaboons Mobile App*

## Executive Summary

Transform the placeholder "Baboons" tab into a world-class social networking experience for the disc golf community. This implementation leverages existing robust APIs while introducing modern UX patterns and professional mobile interaction design.

## Strategic Overview

### Current State
- **Backend**: Complete friend request/management APIs ✅
- **Mobile**: Placeholder CommunityScreen with "Coming Soon" message
- **Gap**: No mobile implementation, state management, or user discovery

### Vision Statement
Create the most intuitive and professional friends management experience in disc golf apps - combining LinkedIn's professionalism with Instagram's social engagement, tailored for the disc golf community.

---

## UX Design Framework

### Core UX Principles
1. **Trust-First Design**: Clear privacy controls and professional interactions
2. **Activity-Driven**: Focus on shared disc golf experiences and bag collections
3. **Community-Centric**: Emphasize local connections and mutual interests
4. **Progressive Disclosure**: Simple core flows with advanced features discoverable
5. **Offline-Resilient**: Core functionality works without connectivity

### Visual Hierarchy & States

#### Friend Status Visual Language
```
🟢 Active Friends    → Full color, activity indicators, bag stats prominent
🟡 Pending Requests  → Warm colors, prominent action buttons, urgency indicators
🔵 Sent Requests     → Muted colors, "Pending" status, cancel option
🔍 Discoverable      → Neutral colors, clear "Add Friend" CTAs
```

### Screen Architecture

#### Primary Tab Navigation
```
┌─────────────────────────────────────────┐
│               Baboons                    │
├─────────────────────────────────────────┤
│  [Friends] [Requests] [Discover]         │
│                                         │
│  ┌─ Friends Tab ──────────────────────┐ │
│  │ Active connections, bag stats,      │ │
│  │ recent activity, mutual friends     │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─ Requests Tab ─────────────────────┐ │
│  │ Incoming (badge), Outgoing,        │ │
│  │ Quick actions, sender context      │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  ┌─ Discover Tab ─────────────────────┐ │
│  │ Search, suggestions, local players │ │
│  │ Based on: location, mutual friends │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### Key UX Interaction Patterns

**Friend Cards (Active Friends)**
- Profile photo + username + friendship duration
- Bag stats: "5 bags (3 visible)" with visual indicators
- Quick actions: View Profile, Message, View Bags
- Recent activity: "Added new Innova Destroyer 2 days ago"
- Mutual friend count: "4 mutual friends"

**Request Cards (Incoming)**
- Clear sender context: profile, mutual friends, recent activity
- Prominent Accept/Decline buttons (green/neutral, not red)
- Preview: "Joined 2 tournaments you've played"
- Time sensitivity: "3 days ago"

**Request Cards (Outgoing)**
- Muted styling with clear "Pending" status
- Cancel option (not prominent)
- Context reminder: "Met at Cedar Hills Open"

**Discovery Cards**
- Clear "Add Friend" CTA
- Connection context: "Plays at same courses as you"
- Mutual friend indicators: "Friends with Jane and Mike"
- Activity preview: "Played 15 rounds this month"

### Modern Mobile UX Patterns

#### Interaction Design
- **Swipe Actions**: Swipe right on friend card → Quick message
- **Long Press**: Hold friend card → Quick menu (Remove, Block, Mute)
- **Pull to Refresh**: Standard refresh pattern with haptic feedback
- **Search with Voice**: Voice search for player names and usernames
- **Smart Suggestions**: ML-driven friend recommendations

#### Accessibility Features
- **High Contrast Mode**: WCAG AAA compliant color schemes
- **Screen Reader**: Full VoiceOver/TalkBack support
- **Large Text**: Dynamic type scaling
- **Motor Accessibility**: Larger touch targets, swipe alternatives

#### Empty States & Onboarding
- **No Friends Yet**: Welcoming illustration + "Find Your Disc Golf Community"
- **No Requests**: "You're all caught up" with discovery suggestions
- **Search No Results**: Helpful tips + "Invite friends via contact list"

---

## Technical Implementation Plan

### Architecture Strategy

#### State Management (Redux-style)
```javascript
// Friend State Tree
{
  friends: {
    list: [],           // Active friends with bag stats
    pagination: {},     // Infinite scroll metadata
    loading: false,
    lastRefresh: timestamp,
    error: null
  },
  requests: {
    incoming: [],       // Requests to respond to
    outgoing: [],       // Sent requests
    badge: 0,          // Unread incoming count
    loading: false
  },
  discovery: {
    suggested: [],      // Algorithm-based suggestions
    search: {
      query: '',
      results: [],
      loading: false
    },
    nearby: []         // Location-based suggestions
  },
  profiles: {          // Cached friend profiles
    [userId]: {
      profile: {},
      bags: [],
      mutualFriends: [],
      lastFetch: timestamp
    }
  }
}
```

#### Service Layer Architecture
```javascript
// friendService.js - API Integration
export const friendService = {
  // Core Friend Management
  getFriends: (pagination) => {},
  getFriendProfile: (friendId) => {},
  removeFriend: (friendId) => {},      // New API needed

  // Request Management
  getRequests: (type) => {},
  sendRequest: (userId) => {},
  respondToRequest: (requestId, action) => {},
  cancelRequest: (requestId) => {},     // New API needed

  // Discovery & Search
  searchUsers: (query) => {},           // New API needed
  getSuggestedFriends: () => {},        // New API needed
  getNearbyPlayers: (location) => {},   // New API needed

  // Privacy & Safety
  blockUser: (userId) => {},            // New API needed
  reportUser: (userId, reason) => {},   // New API needed
};
```

### Component Hierarchy

```
BaboonsNavigator (Stack)
├── BaboonsHomeScreen (Tab Container)
│   ├── FriendsTab
│   │   ├── FriendsList (VirtualizedList)
│   │   │   └── FriendCard
│   │   ├── FriendsEmptyState
│   │   └── RefreshControl
│   ├── RequestsTab
│   │   ├── RequestSegmentControl (Incoming/Outgoing)
│   │   ├── IncomingRequestsList
│   │   │   └── IncomingRequestCard
│   │   └── OutgoingRequestsList
│   │       └── OutgoingRequestCard
│   └── DiscoverTab
│       ├── SearchHeader
│       ├── SuggestedFriendsList
│       └── NearbyPlayersList
├── FriendProfileScreen
│   ├── ProfileHeader
│   ├── MutualFriendsSection
│   ├── BagCollection
│   └── ActionSheet (Message/Block/Report)
├── UserSearchScreen
│   ├── SearchBar (with voice input)
│   ├── FilterChips
│   └── SearchResults
└── FriendRequestDetailScreen (from notification)
    ├── RequesterProfile
    ├── MutualContext
    └── ActionButtons
```

---

## Implementation Roadmap - TDD Slices

### Phase 1: Foundation & Core Infrastructure (Critical Path)

#### Slice 1.1: Friend Service Layer Foundation
**Test Focus**: Service contract and basic API integration
- **Test**: `friendService.getFriends()` returns properly formatted response
- **Test**: Service handles authentication token refresh on 401
- **Test**: Network error handling with user-friendly messages
- **Test**: Response data transformation matches component expectations

#### Slice 1.2: Friends Context & State Management
**Test Focus**: State management foundation
- **Test**: FriendsContext provides initial state structure
- **Test**: `FETCH_FRIENDS_SUCCESS` action updates state correctly
- **Test**: Loading states transition properly
- **Test**: Error states clear when new requests succeed

#### Slice 1.3: Basic Friends List Screen
**Test Focus**: Core UI rendering and data display
- **Test**: Renders loading state with skeleton placeholders
- **Test**: Displays FriendCard components when data loads
- **Test**: Shows EmptyState component when no friends
- **Test**: Pull-to-refresh triggers data reload

#### Slice 1.4: FriendCard Component
**Test Focus**: Individual friend display and basic interactions
- **Test**: Displays friend username, profile image, friendship date
- **Test**: Shows bag stats: "5 bags (3 visible)"
- **Test**: Navigate to friend profile on card tap
- **Test**: Accessibility: proper labels and roles

### Phase 2: Request Management Core

#### Slice 2.1: Request Service Methods
**Test Focus**: Friend request API integration
- **Test**: `getRequests('incoming')` filters correctly
- **Test**: `sendRequest(userId)` validates input and returns request
- **Test**: `respondToRequest(requestId, 'accept')` updates status
- **Test**: Optimistic updates with rollback on failure

#### Slice 2.2: Incoming Requests UI
**Test Focus**: Request response workflow
- **Test**: IncomingRequestCard displays sender context and mutual friends
- **Test**: Accept button triggers API call with loading state
- **Test**: Deny button triggers API call with confirmation
- **Test**: Request disappears from list after successful response

#### Slice 2.3: Outgoing Requests UI
**Test Focus**: Sent request monitoring
- **Test**: OutgoingRequestCard shows "Pending" status clearly
- **Test**: Cancel button shows confirmation before API call
- **Test**: Removed requests update state immediately

#### Slice 2.4: Request Badge & Tab Navigation
**Test Focus**: Navigation and notification badges
- **Test**: Tab badge shows incoming request count
- **Test**: Badge updates when new requests arrive
- **Test**: Tab switching preserves scroll position and state

### Phase 3: User Discovery & Search

#### Slice 3.1: User Search API Development (Backend)
**Test Focus**: New backend endpoint for user discovery
- **Test**: `GET /api/users/search?q=username` returns filtered results
- **Test**: Excludes current friends and blocked users from results
- **Test**: Rate limiting prevents search spam (100 requests/hour)
- **Test**: Search results include mutual friend counts

#### Slice 3.2: Search UI Component
**Test Focus**: User search interface
- **Test**: SearchBar debounces input after 300ms
- **Test**: Voice search button integrates with native speech recognition
- **Test**: Search results show UserCard with "Add Friend" button
- **Test**: Loading states and empty search results handled gracefully

#### Slice 3.3: Friend Suggestions Algorithm
**Test Focus**: Intelligent friend recommendations
- **Test**: Suggestions based on mutual friends (2+ mutual = high priority)
- **Test**: Location-based suggestions (same city/frequent courses)
- **Test**: Excludes already sent requests and blocked users
- **Test**: Randomizes suggestions to prevent staleness

### Phase 4: Advanced Social Features

#### Slice 4.1: Friend Profile Deep Dive
**Test Focus**: Detailed friend information and interactions
- **Test**: FriendProfileScreen displays comprehensive profile data
- **Test**: MutualFriendsSection shows common connections
- **Test**: BagCollection respects privacy settings (visible vs public)
- **Test**: Action buttons (message/remove/block) trigger appropriate flows

#### Slice 4.2: Privacy & Safety Features
**Test Focus**: User protection and content moderation
- **Test**: Block user removes them from all lists and prevents future requests
- **Test**: Report user flow captures reason and evidence
- **Test**: Privacy settings control friend list visibility
- **Test**: Blocked users list management interface

### Phase 5: Real-time & Engagement Features

#### Slice 5.1: WebSocket Integration for Real-time Updates
**Test Focus**: Live updates and notifications
- **Test**: WebSocket connects on app foreground, disconnects on background
- **Test**: New friend requests trigger badge updates immediately
- **Test**: Friend acceptances show real-time celebration animation
- **Test**: Connection resilience handles network interruptions

#### Slice 5.2: Push Notification System
**Test Focus**: Out-of-app engagement
- **Test**: Request permission flow for notifications follows best practices
- **Test**: Friend request notifications deep-link to specific request
- **Test**: Friend acceptance notifications include context
- **Test**: Notification preferences allow granular control

#### Slice 5.3: Advanced Social Context
**Test Focus**: Community features and social proof
- **Test**: Mutual friends display with profile previews
- **Test**: Shared tournament/course history in friend profiles
- **Test**: Activity feed shows friend bag updates and round scores
- **Test**: Local player discovery based on GPS and frequent courses

---

## API Enhancements Required

### New Endpoints Needed

#### User Discovery
- **GET /api/users/search** - Search users by username/name
  - Query params: `q`, `limit`, `offset`, `location`, `exclude_friends`
  - Returns: User profiles with mutual friend counts
- **GET /api/friends/suggestions** - Algorithm-based friend recommendations
  - Factors: Mutual friends, location, tournament history, bag preferences
- **GET /api/users/nearby** - Location-based user discovery
  - Query params: `lat`, `lng`, `radius`, `exclude_friends`

#### Enhanced Friend Management
- **DELETE /api/friends/:friendId** - Remove friendship (soft delete)
- **DELETE /api/friends/request/:requestId** - Cancel sent request
- **POST /api/users/block** - Block user (prevents all interactions)
- **GET /api/friends/:friendId/mutual** - Get mutual friends

#### Privacy & Safety
- **POST /api/users/report** - Report user for inappropriate behavior
- **GET /api/users/blocked** - List blocked users
- **PUT /api/profile/privacy** - Update friend list visibility settings

### WebSocket Events

#### Real-time Friend Updates
```javascript
// Server → Client Events
'friend:request:received'     // New incoming request
'friend:request:accepted'     // Your request was accepted
'friend:request:denied'       // Your request was denied
'friend:removed'              // Friend removed you
'friend:online'               // Friend came online
'friend:bag:updated'          // Friend updated their bags

// Client → Server Events
'friend:subscribe'            // Subscribe to friend updates
'friend:typing'               // Typing indicator for messages
```

---

## Database Schema Enhancements

### New Tables Required

```sql
-- User blocking functionality
CREATE TABLE blocked_users (
  id SERIAL PRIMARY KEY,
  blocker_id INTEGER REFERENCES users(id),
  blocked_id INTEGER REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Friend suggestions tracking (prevent showing same suggestions)
CREATE TABLE friend_suggestions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  suggested_user_id INTEGER REFERENCES users(id),
  suggestion_type VARCHAR(50), -- 'mutual_friends', 'location', 'activity'
  shown_at TIMESTAMP DEFAULT NOW(),
  dismissed_at TIMESTAMP,
  UNIQUE(user_id, suggested_user_id)
);

-- User reports for safety
CREATE TABLE user_reports (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER REFERENCES users(id),
  reported_user_id INTEGER REFERENCES users(id),
  reason VARCHAR(100),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Friend activity feed
CREATE TABLE friend_activities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  activity_type VARCHAR(50), -- 'bag_updated', 'round_completed', 'tournament_joined'
  metadata JSONB, -- Activity-specific data
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes for Performance

```sql
-- Search optimization
CREATE INDEX idx_users_username_search ON users USING gin(username gin_trgm_ops);
CREATE INDEX idx_users_location ON users (latitude, longitude);

-- Friend relationship lookups
CREATE INDEX idx_friendship_requests_composite ON friendship_requests(requester_id, recipient_id, status);
CREATE INDEX idx_blocked_users_lookup ON blocked_users(blocker_id, blocked_id);

-- Activity feed performance
CREATE INDEX idx_friend_activities_user_time ON friend_activities(user_id, created_at DESC);
```

---

## Success Metrics & KPIs

### Technical Performance
- Friend list load time: < 800ms p95
- Search response time: < 300ms p95
- WebSocket connection uptime: > 99.5%
- Offline capability: Core features work without network

### User Engagement
- Friend connections per user (target: 8-15 active friends)
- Request acceptance rate (target: > 65%)
- Daily friend interactions (profile views, messages, bag views)
- Time to first friend connection for new users (< 48 hours)

### Business Impact
- User retention improvement (30-day retention +15%)
- Session length increase through social engagement
- Viral coefficient through friend invitations
- Community health through moderation effectiveness

---

## Risk Mitigation Strategies

### Technical Risks

**Real-time Scalability**
- *Risk*: WebSocket connections overwhelming server
- *Mitigation*: Connection pooling, graceful degradation to polling
- *Fallback*: Long polling for older devices

**State Synchronization Issues**
- *Risk*: Inconsistent friend states between devices
- *Mitigation*: Single source of truth in Redux, timestamp-based conflict resolution
- *Fallback*: Force refresh on focus if timestamps mismatch

### UX/Business Risks

**User Privacy Concerns**
- *Risk*: Users uncomfortable with friend discovery
- *Mitigation*: Opt-in discovery, granular privacy controls
- *Feature*: "Invisible mode" for tournament play

**Community Toxicity**
- *Risk*: Harassment through friend system
- *Mitigation*: Robust blocking/reporting, proactive moderation
- *Feature*: Community guidelines integration

**Low Adoption Rate**
- *Risk*: Users don't engage with social features
- *Mitigation*: Seamless integration with bag sharing, tournament features
- *Strategy*: Gamification through "disc golf network" achievements

---

## Security & Privacy Framework

### Data Protection
- **Minimal Data Collection**: Only collect necessary social graph data
- **Data Retention**: Auto-delete denied requests after 90 days
- **Export Capability**: Users can export their friend data
- **Right to be Forgotten**: Complete data removal on account deletion

### Privacy Controls
- **Friend List Visibility**: Public, Friends Only, Private options
- **Discovery Opt-out**: Users can disable appearing in suggestions
- **Bag Sharing Granularity**: Per-friend sharing permissions
- **Activity Visibility**: Control what friends see about your disc golf activity

### Security Measures
- **Rate Limiting**: Aggressive limits on friend requests (10/hour), search (100/hour)
- **Spam Detection**: ML models to identify fake accounts and spam behavior
- **Report Processing**: 24-hour response time for safety reports
- **Account Verification**: Optional verification for tournament players

---

## Development Deployment Strategy

### Feature Flag Rollout
```
Week 1-2:   Internal team testing (100% feature flag coverage)
Week 3-4:   Beta group testing (tournament organizers, 50 users)
Week 5:     Limited rollout (10% of users, monitor metrics closely)
Week 6:     Expanded rollout (50% of users if metrics positive)
Week 7:     Full rollout (100% of users)
```

### Success Gates
- **Technical**: No P0 bugs, < 2% error rate, acceptable performance
- **User Experience**: > 60% feature adoption, < 10% negative feedback
- **Business**: Retention improvement visible, no community issues

### Rollback Plan
- **Immediate**: Feature flag disable (< 30 seconds)
- **Data Integrity**: All friend data preserved during rollback
- **User Communication**: In-app messaging about temporary unavailability

---

## Next Steps & Recommendations

### Immediate Actions (Week 1)
1. **Technical Setup**: Initialize friend service layer and state management
2. **Design System**: Create FriendCard, RequestCard component designs
3. **API Planning**: Prioritize new endpoints (search, suggestions, block)
4. **User Research**: Interview 5-10 active users about social features

### Development Priority Order
1. **Phase 1**: Core friends list and basic request management (MVP)
2. **Phase 2**: Search and discovery features (user acquisition)
3. **Phase 3**: Real-time updates and notifications (engagement)
4. **Phase 4**: Advanced social features and privacy controls (retention)

### Long-term Vision Extensions
- **Tournament Integration**: Friend-based tournament teams and brackets
- **Leaderboards**: Compare stats with friends across courses and time
- **Social Rounds**: Plan and track rounds with friends
- **Mentorship**: Experienced players mentor newer players through friend system

---

## Questions for Stakeholder Review

1. **Scope Prioritization**: Which Phase (1-4) should we target for initial release?
2. **Privacy Philosophy**: How permissive should default discovery settings be?
3. **Community Moderation**: What's our tolerance and response plan for inappropriate behavior?
4. **Integration Strategy**: How should friends integrate with tournaments and scoring features?
5. **Resource Allocation**: Do we have backend development capacity for new APIs?

---

*This implementation plan provides a comprehensive roadmap for transforming the Baboons tab into a professional, engaging social experience that strengthens the disc golf community while maintaining the highest standards of privacy, security, and user experience.*