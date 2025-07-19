# 🏌️ Round Management Development Plan

## Overview
Build comprehensive round management system for disc golf. Users can create rounds with friends/guests, track scores in real-time, manage betting (skins/side bets), and utilize extensive course database with admin-approved user submissions.

---

## Database Schema

### Migration Files Needed

**`V17__create_courses_table.sql`**
```sql
CREATE TABLE courses (
  id VARCHAR(100) PRIMARY KEY, -- Use CSV id format like "adventist-discovery-park"
  name VARCHAR(200) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip VARCHAR(10),
  hole_count INTEGER NOT NULL,
  rating DECIMAL(3,1), -- Course rating like 4.5
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_user_submitted BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT true, -- CSV courses pre-approved
  submitted_by_id INTEGER, -- NULL for CSV courses
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (submitted_by_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_courses_state ON courses(state);
CREATE INDEX idx_courses_city ON courses(city);
CREATE INDEX idx_courses_approved ON courses(approved);
CREATE INDEX idx_courses_is_user_submitted ON courses(is_user_submitted);
CREATE INDEX idx_courses_location ON courses(latitude, longitude);
```

**`V18__create_rounds_table.sql`**
```sql
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_id INTEGER NOT NULL,
  course_id VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  is_private BOOLEAN DEFAULT false,
  skins_enabled BOOLEAN DEFAULT false,
  skins_value DECIMAL(10,2), -- Per hole skins value
  status VARCHAR(20) DEFAULT 'upcoming', -- upcoming, in_progress, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT
);

CREATE INDEX idx_rounds_created_by ON rounds(created_by_id);
CREATE INDEX idx_rounds_course_id ON rounds(course_id);
CREATE INDEX idx_rounds_start_time ON rounds(start_time);
CREATE INDEX idx_rounds_status ON rounds(status);
```

**`V19__create_round_players_table.sql`**
```sql
CREATE TABLE round_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL,
  user_id INTEGER, -- NULL for guest players
  guest_name VARCHAR(100), -- Name for guest players
  is_guest BOOLEAN DEFAULT false,
  joined_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_player_type CHECK (
    (is_guest = true AND guest_name IS NOT NULL AND user_id IS NULL) OR
    (is_guest = false AND user_id IS NOT NULL AND guest_name IS NULL)
  )
);

CREATE INDEX idx_round_players_round_id ON round_players(round_id);
CREATE INDEX idx_round_players_user_id ON round_players(user_id);
CREATE UNIQUE INDEX idx_round_players_unique_user ON round_players(round_id, user_id) WHERE user_id IS NOT NULL;
```

**`V20__create_scores_table.sql`**
```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL,
  player_id UUID NOT NULL, -- References round_players.id
  hole_number INTEGER NOT NULL,
  strokes INTEGER NOT NULL,
  par INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES round_players(id) ON DELETE CASCADE,
  CONSTRAINT check_hole_number CHECK (hole_number > 0 AND hole_number <= 50),
  CONSTRAINT check_strokes CHECK (strokes > 0 AND strokes <= 20),
  CONSTRAINT check_par CHECK (par > 0 AND par <= 10)
);

CREATE INDEX idx_scores_round_id ON scores(round_id);
CREATE INDEX idx_scores_player_id ON scores(player_id);
CREATE INDEX idx_scores_hole_number ON scores(hole_number);
CREATE UNIQUE INDEX idx_scores_unique ON scores(round_id, player_id, hole_number);
```

**`V21__create_side_bets_table.sql`**
```sql
CREATE TABLE side_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL,
  bet_type VARCHAR(50) NOT NULL, -- 'closest_to_pin', 'longest_drive', 'lowest_score', 'custom'
  hole_number INTEGER, -- NULL for round-long bets
  created_by_id UUID NOT NULL, -- References round_players.id
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_id) REFERENCES round_players(id) ON DELETE CASCADE
);

CREATE INDEX idx_side_bets_round_id ON side_bets(round_id);
CREATE INDEX idx_side_bets_hole_number ON side_bets(hole_number);
```

**`V22__create_side_bet_participants_table.sql`**
```sql
CREATE TABLE side_bet_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  side_bet_id UUID NOT NULL,
  player_id UUID NOT NULL, -- References round_players.id
  is_winner BOOLEAN DEFAULT false,
  joined_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (side_bet_id) REFERENCES side_bets(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES round_players(id) ON DELETE CASCADE
);

CREATE INDEX idx_side_bet_participants_side_bet_id ON side_bet_participants(side_bet_id);
CREATE INDEX idx_side_bet_participants_player_id ON side_bet_participants(player_id);
CREATE UNIQUE INDEX idx_side_bet_participants_unique ON side_bet_participants(side_bet_id, player_id);
```

### Prisma Schema Updates
**Note:** These models will be added to the existing schema alongside current models.

```prisma
model courses {
  id                String     @id @db.VarChar(100)
  name              String     @db.VarChar(200)
  city              String     @db.VarChar(100)
  state             String     @db.VarChar(50)
  zip               String?    @db.VarChar(10)
  hole_count        Int
  rating            Decimal?   @db.Decimal(3,1)
  latitude          Decimal?   @db.Decimal(10,8)
  longitude         Decimal?   @db.Decimal(11,8)
  is_user_submitted Boolean    @default(false)
  approved          Boolean    @default(true)
  submitted_by_id   Int?
  admin_notes       String?
  created_at        DateTime?  @default(now()) @db.Timestamp(6)
  updated_at        DateTime?  @default(now()) @db.Timestamp(6)
  users             users?     @relation("CourseSubmissions", fields: [submitted_by_id], references: [id], onDelete: SetNull)
  rounds            rounds[]

  @@index([state], map: "idx_courses_state")
  @@index([city], map: "idx_courses_city")
  @@index([approved], map: "idx_courses_approved")
  @@index([is_user_submitted], map: "idx_courses_is_user_submitted")
  @@index([latitude, longitude], map: "idx_courses_location")
}

model rounds {
  id             String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_by_id  Int
  course_id      String          @db.VarChar(100)
  name           String          @db.VarChar(200)
  start_time     DateTime        @db.Timestamp(6)
  is_private     Boolean         @default(false)
  skins_enabled  Boolean         @default(false)
  skins_value    Decimal?        @db.Decimal(10,2)
  status         String          @default("upcoming") @db.VarChar(20)
  created_at     DateTime?       @default(now()) @db.Timestamp(6)
  updated_at     DateTime?       @default(now()) @db.Timestamp(6)
  users          users           @relation("RoundCreators", fields: [created_by_id], references: [id], onDelete: Cascade)
  courses        courses         @relation(fields: [course_id], references: [id], onDelete: Restrict)
  round_players  round_players[]
  scores         scores[]
  side_bets      side_bets[]

  @@index([created_by_id], map: "idx_rounds_created_by")
  @@index([course_id], map: "idx_rounds_course_id")
  @@index([start_time], map: "idx_rounds_start_time")
  @@index([status], map: "idx_rounds_status")
}

model round_players {
  id                      String                    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  round_id                String                    @db.Uuid
  user_id                 Int?
  guest_name              String?                   @db.VarChar(100)
  is_guest                Boolean                   @default(false)
  joined_at               DateTime?                 @default(now()) @db.Timestamp(6)
  rounds                  rounds                    @relation(fields: [round_id], references: [id], onDelete: Cascade)
  users                   users?                    @relation("RoundParticipants", fields: [user_id], references: [id], onDelete: Cascade)
  scores                  scores[]
  side_bets               side_bets[]
  side_bet_participants   side_bet_participants[]

  @@index([round_id], map: "idx_round_players_round_id")
  @@index([user_id], map: "idx_round_players_user_id")
  @@unique([round_id, user_id], map: "idx_round_players_unique_user")
}

model scores {
  id           String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  round_id     String        @db.Uuid
  player_id    String        @db.Uuid
  hole_number  Int
  strokes      Int
  par          Int
  created_at   DateTime?     @default(now()) @db.Timestamp(6)
  updated_at   DateTime?     @default(now()) @db.Timestamp(6)
  rounds       rounds        @relation(fields: [round_id], references: [id], onDelete: Cascade)
  round_players round_players @relation(fields: [player_id], references: [id], onDelete: Cascade)

  @@index([round_id], map: "idx_scores_round_id")
  @@index([player_id], map: "idx_scores_player_id")
  @@index([hole_number], map: "idx_scores_hole_number")
  @@unique([round_id, player_id, hole_number], map: "idx_scores_unique")
}

model side_bets {
  id                      String                    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  round_id                String                    @db.Uuid
  name                    String                    @db.VarChar(200)
  description             String?
  amount                  Decimal                   @db.Decimal(10,2)
  bet_type                String                    @db.VarChar(50)
  hole_number             Int?
  created_by_id           String                    @db.Uuid
  created_at              DateTime?                 @default(now()) @db.Timestamp(6)
  rounds                  rounds                    @relation(fields: [round_id], references: [id], onDelete: Cascade)
  round_players           round_players             @relation(fields: [created_by_id], references: [id], onDelete: Cascade)
  side_bet_participants   side_bet_participants[]

  @@index([round_id], map: "idx_side_bets_round_id")
  @@index([hole_number], map: "idx_side_bets_hole_number")
}

model side_bet_participants {
  id           String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  side_bet_id  String        @db.Uuid
  player_id    String        @db.Uuid
  is_winner    Boolean       @default(false)
  joined_at    DateTime?     @default(now()) @db.Timestamp(6)
  side_bets    side_bets     @relation(fields: [side_bet_id], references: [id], onDelete: Cascade)
  round_players round_players @relation(fields: [player_id], references: [id], onDelete: Cascade)

  @@index([side_bet_id], map: "idx_side_bet_participants_side_bet_id")
  @@index([player_id], map: "idx_side_bet_participants_player_id")
  @@unique([side_bet_id, player_id], map: "idx_side_bet_participants_unique")
}

// Update existing users model to add new relationships
model users {
  id                                                          Int                   @id @default(autoincrement())
  username                                                    String                @unique @db.VarChar(50)
  created_at                                                  DateTime?             @default(now()) @db.Timestamp(6)
  password_hash                                               String
  last_password_change                                        DateTime?             @default(now()) @db.Timestamp(6)
  email                                                       String?               @unique(map: "users_email_unique") @db.VarChar(255)
  is_admin                                                    Boolean               @default(false)
  
  // Existing relationships
  bag_contents                                                bag_contents[]
  bags                                                        bags[]
  disc_master                                                 disc_master[]
  friendship_requests_friendship_requests_recipient_idTousers friendship_requests[] @relation("friendship_requests_recipient_idTousers")
  friendship_requests_friendship_requests_requester_idTousers friendship_requests[] @relation("friendship_requests_requester_idTousers")
  user_profiles                                               user_profiles?
  
  // New round-related relationships
  courses                                                     courses[]             @relation("CourseSubmissions")
  rounds                                                      rounds[]              @relation("RoundCreators")
  round_players                                               round_players[]       @relation("RoundParticipants")

  @@index([last_password_change], map: "idx_users_last_password_change")
}
```

---

## Development Phases

### Phase 1: Course Management Foundation ✅ **COMPLETED**
**Target: Week 1-2**

#### Step 1.1: Course Data Infrastructure ✅ **COMPLETED**
- ✅ Create course migration files (V17__create_courses_table.sql)
- ✅ Update Prisma schema with courses model
- ✅ Add course-data.csv import to rebuild-apps.sh with Python script
- ✅ Create course seeding service (scripts/import_courses.py)
- ✅ Test course data import (7,008 courses imported successfully)

#### Step 1.2: Course API Endpoints **IN PROGRESS**
- ✅ `GET /api/courses` - Search/filter courses with pagination (state, city, name, limit, offset)
- ✅ `GET /api/courses/:id` - Get course details
- [ ] `POST /api/courses` - Submit user course (authenticated)
- [ ] `GET /api/courses/pending` - Admin: List pending courses
- [ ] `PUT /api/courses/:id/approve` - Admin: Approve/reject course

#### Step 1.3: Course Services & Controllers **IN PROGRESS**
- ✅ `courses.search.service.js` - Course search with filters and pagination (default 50, max 500)
- ✅ `courses.search.controller.js` - Controller with parameter extraction
- ✅ `courses.get.service.js` - Single course retrieval
- ✅ `courses.get.controller.js` - Controller for course details
- ✅ `courses.routes.js` - Route setup with authentication middleware (search + get)
- ✅ Integration with server.js and auth middleware
- ✅ Comprehensive test coverage (unit tests, integration tests)
- [ ] `courses.submit.service.js` - User course submission
- [ ] `courses.admin.service.js` - Admin approval workflow

#### Current API Status ✅
**Endpoints:**
1. **`GET /api/courses`** (authenticated) - Search/filter courses
   - **Response Format:**
   ```json
   {
     "courses": [...],     // Array of course objects
     "total": 7008,        // Total matching courses
     "limit": 50,          // Results per page (default 50, max 500)
     "offset": 0,          // Starting position
     "hasMore": true       // Whether more results exist
   }
   ```
   - **Filters:** state, city, name (case-insensitive partial match)
   - **Pagination:** limit (max 500), offset

2. **`GET /api/courses/:id`** (authenticated) - Get course details
   - **Response:** Single course object or null if not found
   - **Validation:** Returns 400 if courseId is missing
   - **Security:** Only returns approved courses

- **Data:** 7,008 US disc golf courses imported from CSV

### Phase 2: Round Management Core
**Target: Week 3-4**

#### Step 2.1: Round Creation & Management
- [ ] Create round-related migration files (V15-V16)
- [ ] `POST /api/rounds` - Create round with course and players
- [ ] `GET /api/rounds` - List user's rounds (upcoming/in-progress/completed)
- [ ] `GET /api/rounds/:id` - Get round details with players
- [ ] `PUT /api/rounds/:id` - Update round details
- [ ] `DELETE /api/rounds/:id` - Cancel/delete round

#### Step 2.2: Player Management
- [ ] `POST /api/rounds/:id/players` - Add friend/guest to round
- [ ] `DELETE /api/rounds/:id/players/:playerId` - Remove player
- [ ] `GET /api/rounds/:id/players` - List round players
- [ ] Guest player validation and management
- [ ] Friend invitation system integration

#### Step 2.3: Round Privacy & Security
- [ ] Private round access controls
- [ ] Friend-only round visibility
- [ ] Player authorization middleware
- [ ] Round ownership validation

### Phase 3: Scoring System
**Target: Week 5-6**

#### Step 3.1: Score Entry & Management
- [ ] Create scores migration (V17)
- [ ] `POST /api/rounds/:id/scores` - Submit/update scores
- [ ] `GET /api/rounds/:id/scores` - Get all round scores
- [ ] `GET /api/rounds/:id/leaderboard` - Real-time leaderboard
- [ ] Hole-by-hole score validation
- [ ] Score calculation utilities (par, total, relative)

#### Step 3.2: Real-time Score Updates
- [ ] WebSocket integration for live scoring
- [ ] Score change notifications
- [ ] Offline score caching strategy
- [ ] Sync conflict resolution
- [ ] Mobile-optimized score entry

#### Step 3.3: Scoring Analytics
- [ ] Round statistics calculation
- [ ] Player performance metrics
- [ ] Course difficulty analysis
- [ ] Historical scoring trends

### Phase 4: Betting System
**Target: Week 7-8**

#### Step 4.1: Skins Game
- [ ] Skins calculation engine
- [ ] Hole winner determination
- [ ] Carry-over logic for ties
- [ ] Final payout calculation
- [ ] Skins leaderboard display

#### Step 4.2: Side Bets
- [ ] Create side bets migrations (V18-V19)
- [ ] `POST /api/rounds/:id/side-bets` - Create side bet
- [ ] `POST /api/rounds/:id/side-bets/:betId/join` - Join side bet
- [ ] `PUT /api/rounds/:id/side-bets/:betId/winner` - Declare winner
- [ ] Side bet types: closest to pin, longest drive, lowest score
- [ ] Custom side bet creation

#### Step 4.3: Betting Analytics
- [ ] Betting history tracking
- [ ] Win/loss statistics
- [ ] Payout calculations
- [ ] Betting leaderboards

### Phase 5: Advanced Features
**Target: Week 9-10**

#### Step 5.1: Social Features
- [ ] Round sharing and invitations
- [ ] Round result sharing
- [ ] Achievement system
- [ ] Round photo/video attachments

#### Step 5.2: Mobile Optimization
- [ ] Offline-first architecture
- [ ] Progressive Web App features
- [ ] Touch-optimized scoring interface
- [ ] GPS integration for course location

#### Step 5.3: Admin Dashboard
- [ ] Course approval interface
- [ ] User management
- [ ] Round monitoring
- [ ] System analytics

#### Step 5.4: Logging System Implementation
- [ ] Install winston or pino logging library
- [ ] Create centralized logger configuration (`lib/logger.js`)
- [ ] Replace console.log statements throughout codebase
- [ ] Configure log levels by environment (dev/test/prod)
- [ ] Add structured logging for database operations
- [ ] Implement log rotation and retention policies
- [ ] Add request/response logging middleware
- [ ] Set up log aggregation for production monitoring

**Current Issue:** Database errors are logged via console.log in lib/database.js which clutters CI/CD pipeline logs. Need environment-aware logging that only shows detailed errors in development mode.

**Files to Update:**
- `lib/database.js` - Replace console.log with proper logger
- `server.js` - Add request logging middleware  
- `middleware/errorHandler.js` - Structured error logging
- `services/*.js` - Replace any console.log with logger calls

---

## API Endpoints Overview

### Course Management
- ✅ `GET /api/courses` - Search courses with filters and pagination (authenticated)
  - **Filters:** `?state=California&city=Sacramento&name=park`
  - **Pagination:** `?limit=100&offset=50` (max limit: 500)
  - **Response:** Paginated results with metadata
- ✅ `GET /api/courses/:id` - Get course details (authenticated)
  - **Response:** Single course object or null
  - **Security:** Only approved courses
- [ ] `POST /api/courses` - Submit user course
- [ ] `GET /api/courses/pending` - Admin: pending courses
- [ ] `PUT /api/courses/:id/approve` - Admin: approve course

### Round Management
- `POST /api/rounds` - Create round
- `GET /api/rounds` - List user rounds
- `GET /api/rounds/:id` - Get round details
- `PUT /api/rounds/:id` - Update round
- `DELETE /api/rounds/:id` - Cancel round

### Player Management
- `POST /api/rounds/:id/players` - Add player
- `DELETE /api/rounds/:id/players/:playerId` - Remove player
- `GET /api/rounds/:id/players` - List players

### Scoring
- `POST /api/rounds/:id/scores` - Submit scores
- `GET /api/rounds/:id/scores` - Get scores
- `GET /api/rounds/:id/leaderboard` - Real-time leaderboard

### Betting
- `POST /api/rounds/:id/side-bets` - Create side bet
- `POST /api/rounds/:id/side-bets/:betId/join` - Join bet
- `PUT /api/rounds/:id/side-bets/:betId/winner` - Declare winner
- `GET /api/rounds/:id/skins` - Get skins results

---

## Technical Considerations

### Real-time Features
- WebSocket integration for live scoring
- Server-Sent Events for leaderboard updates
- Optimistic UI updates with rollback capability

### Offline Support
- IndexedDB for offline score storage
- Background sync for score submission
- Conflict resolution strategies

### Security
- Round privacy controls
- Player authorization middleware
- Input validation for all score entries
- Rate limiting for API endpoints

### Performance
- Database indexing for common queries
- Caching strategies for course data
- Pagination for large datasets
- Optimized queries for leaderboards

### Mobile Considerations
- Touch-friendly score entry interface
- Responsive design for all screen sizes
- GPS integration for course check-in
- Battery optimization strategies

---

## Testing Strategy

### Unit Tests
- Service layer business logic
- Scoring calculations
- Betting algorithms
- Validation functions

### Integration Tests
- API endpoint functionality
- Database operations
- Authentication flows
- Real-time features

### End-to-End Tests
- Complete round workflow
- Multi-player scenarios
- Betting workflows
- Mobile interface testing

---

## Deployment Considerations

### Database
- Migration rollback strategies
- Course data seeding automation
- Performance monitoring
- Backup strategies

### Real-time Infrastructure
- WebSocket scaling
- Connection management
- Failover strategies

### Monitoring
- Round completion rates
- Scoring performance
- User engagement metrics
- Error tracking

---

## Success Metrics

### User Engagement
- Rounds created per week
- Average players per round
- Round completion rate
- Return user percentage

### Feature Adoption
- Skins game usage
- Side bet participation
- Course submission rate
- Mobile app usage

### Technical Performance
- API response times
- Real-time update latency
- Offline sync success rate
- Database query performance

---

## Future Enhancements

### Advanced Analytics
- Course difficulty ratings
- Player skill analysis
- Predictive scoring
- Performance insights

### Social Features
- Tournament creation
- League management
- Player rankings
- Social sharing

### Business Features
- Premium features
- Course partnerships
- Sponsorship integration
- Event management

