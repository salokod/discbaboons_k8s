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

**`V18__internationalize_courses_table.sql`** 🌍 **NEW - INTERNATIONAL SUPPORT**
```sql
-- Add country column (required for international support)
ALTER TABLE courses ADD COLUMN country VARCHAR(2) NOT NULL DEFAULT 'US';

-- Update all existing courses to be explicitly marked as USA
UPDATE courses SET country = 'US' WHERE country = 'US';

-- Rename state to state_province for international compatibility
ALTER TABLE courses RENAME COLUMN state TO state_province;

-- Rename zip to postal_code for international compatibility  
ALTER TABLE courses RENAME COLUMN zip TO postal_code;

-- Drop old indexes
DROP INDEX IF EXISTS idx_courses_state;

-- Create new indexes for international fields
CREATE INDEX idx_courses_country ON courses(country);
CREATE INDEX idx_courses_state_province ON courses(state_province);
CREATE INDEX idx_courses_country_state_province ON courses(country, state_province);
CREATE INDEX idx_courses_country_city ON courses(country, city);

-- Add comments for clarity
COMMENT ON COLUMN courses.country IS 'Two-letter ISO country code (e.g., US, CA, AU, GB)';
COMMENT ON COLUMN courses.state_province IS 'State, province, or region within country';
COMMENT ON COLUMN courses.postal_code IS 'ZIP code, postal code, or equivalent for the country';
```

**`V20__add_course_review_tracking.sql`** 🔧 **ADMIN WORKFLOW FIX** ✅
```sql
-- Add reviewed_at and reviewed_by fields to track admin review status
ALTER TABLE courses ADD COLUMN reviewed_at TIMESTAMP NULL;
ALTER TABLE courses ADD COLUMN reviewed_by_id INTEGER NULL;

-- Add foreign key for reviewed_by_id
ALTER TABLE courses ADD CONSTRAINT fk_courses_reviewed_by 
  FOREIGN KEY (reviewed_by_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create index for pending course queries (unreviewed user submissions)
CREATE INDEX idx_courses_pending ON courses(is_user_submitted, reviewed_at) 
  WHERE is_user_submitted = true AND reviewed_at IS NULL;

-- Add comments for clarity
COMMENT ON COLUMN courses.reviewed_at IS 'Timestamp when admin reviewed the course (approved or denied)';
COMMENT ON COLUMN courses.reviewed_by_id IS 'Admin user ID who reviewed the course';
```

**`V21__create_rounds_table.sql`**
```sql
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_id INTEGER NOT NULL,
  course_id VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  start_time TIMESTAMP NOT NULL DEFAULT NOW(), -- Always current time, no future rounds
  starting_hole INTEGER NOT NULL DEFAULT 1, -- Which hole to start on (1-N)
  is_private BOOLEAN DEFAULT false,
  skins_enabled BOOLEAN DEFAULT false,
  skins_value DECIMAL(10,2), -- Per hole skins value, carries over on ties
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
  CONSTRAINT check_starting_hole CHECK (starting_hole > 0 AND starting_hole <= 50)
);

CREATE INDEX idx_rounds_created_by ON rounds(created_by_id);
CREATE INDEX idx_rounds_course_id ON rounds(course_id);
CREATE INDEX idx_rounds_start_time ON rounds(start_time);
CREATE INDEX idx_rounds_status ON rounds(status);
CREATE INDEX idx_rounds_starting_hole ON rounds(starting_hole);

-- Add comments for clarity
COMMENT ON COLUMN rounds.start_time IS 'Round start time - always set to creation time, no future scheduling';
COMMENT ON COLUMN rounds.starting_hole IS 'Which hole number to start the round on (default 1)';
COMMENT ON COLUMN rounds.skins_value IS 'Dollar amount per hole for skins game, carries over on ties';
```

**`V22__create_round_players_table.sql`**
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

**`V23__create_scores_and_pars_tables.sql`**
```sql
-- Round hole pars table (separate from scores)
CREATE TABLE round_hole_pars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL,
  hole_number INTEGER NOT NULL,
  par INTEGER NOT NULL DEFAULT 3, -- Default par 3 for disc golf
  set_by_player_id UUID NOT NULL, -- Who set/changed the par
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (set_by_player_id) REFERENCES round_players(id) ON DELETE CASCADE,
  CONSTRAINT check_par CHECK (par > 0 AND par <= 10),
  CONSTRAINT check_hole_number CHECK (hole_number > 0 AND hole_number <= 50)
);

CREATE UNIQUE INDEX idx_round_hole_pars_unique ON round_hole_pars(round_id, hole_number);
CREATE INDEX idx_round_hole_pars_round_id ON round_hole_pars(round_id);

-- Scores table (par removed - looked up from round_hole_pars)
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL,
  player_id UUID NOT NULL, -- References round_players.id
  hole_number INTEGER NOT NULL,
  strokes INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (round_id) REFERENCES rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES round_players(id) ON DELETE CASCADE,
  CONSTRAINT check_hole_number CHECK (hole_number > 0 AND hole_number <= 50),
  CONSTRAINT check_strokes CHECK (strokes > 0 AND strokes <= 20)
);

CREATE INDEX idx_scores_round_id ON scores(round_id);
CREATE INDEX idx_scores_player_id ON scores(player_id);
CREATE INDEX idx_scores_hole_number ON scores(hole_number);
CREATE UNIQUE INDEX idx_scores_unique ON scores(round_id, player_id, hole_number);

-- Comments for clarity
COMMENT ON TABLE round_hole_pars IS 'Par values for each hole in a round, editable by any player';
COMMENT ON COLUMN round_hole_pars.par IS 'Par value for this hole (default 3, editable during round)';
COMMENT ON COLUMN round_hole_pars.set_by_player_id IS 'Player who last set/changed the par value';
COMMENT ON TABLE scores IS 'Player scores per hole (par looked up from round_hole_pars table)';
```

**`V24__create_side_bets_table.sql`**
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

**`V25__create_side_bet_participants_table.sql`**
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
  state_province    String     @db.VarChar(50)
  country           String     @default("US") @db.VarChar(2)
  postal_code       String?    @db.VarChar(10)
  hole_count        Int
  latitude          Decimal?   @db.Decimal(10,8)
  longitude         Decimal?   @db.Decimal(11,8)
  is_user_submitted Boolean    @default(false)
  approved          Boolean    @default(true)
  submitted_by_id   Int?
  admin_notes       String?
  reviewed_at       DateTime?  @db.Timestamp(6)
  reviewed_by_id    Int?
  created_at        DateTime?  @default(now()) @db.Timestamp(6)
  updated_at        DateTime?  @default(now()) @db.Timestamp(6)
  users_submitted   users?     @relation("CourseSubmissions", fields: [submitted_by_id], references: [id], onDelete: SetNull)
  users_reviewed    users?     @relation("CourseReviews", fields: [reviewed_by_id], references: [id], onDelete: SetNull)
  rounds            rounds[]

  @@index([country], map: "idx_courses_country")
  @@index([state_province], map: "idx_courses_state_province")
  @@index([country, state_province], map: "idx_courses_country_state_province")
  @@index([country, city], map: "idx_courses_country_city")
  @@index([city], map: "idx_courses_city")
  @@index([approved], map: "idx_courses_approved")
  @@index([is_user_submitted], map: "idx_courses_is_user_submitted")
  @@index([latitude, longitude], map: "idx_courses_location")
  @@index([is_user_submitted, reviewed_at], map: "idx_courses_pending", where: "is_user_submitted = true AND reviewed_at IS NULL")
}

model rounds {
  id             String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  created_by_id  Int
  course_id      String          @db.VarChar(100)
  name           String          @db.VarChar(200)
  start_time     DateTime        @default(now()) @db.Timestamp(6)
  starting_hole  Int             @default(1)
  is_private     Boolean         @default(false)
  skins_enabled  Boolean         @default(false)
  skins_value    Decimal?        @db.Decimal(10,2)
  status         String          @default("in_progress") @db.VarChar(20)
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
  @@index([starting_hole], map: "idx_rounds_starting_hole")
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
  courses_submitted                                           courses[]             @relation("CourseSubmissions")
  courses_reviewed                                            courses[]             @relation("CourseReviews")
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

#### Step 1.2: Course API Endpoints ✅ **COMPLETED**
- ✅ `GET /api/courses` - Search/filter courses with pagination (state, city, name, limit, offset)
- ✅ `GET /api/courses/:id` - Get course details
- ✅ **🌍 PIVOT: International Course Support** - Add migration V18 for country/state_province fields
- ✅ `POST /api/courses` - Submit user course (authenticated) - **Updated for international support**
- ✅ `GET /api/courses/pending` - Admin: List pending courses
- ✅ `PUT /api/courses/:id/approve` - Admin: Approve/reject course

#### Step 1.3: Course Services & Controllers ✅ **COMPLETED**
- ✅ `courses.search.service.js` - Course search with filters and pagination (default 50, max 500)
- ✅ `courses.search.controller.js` - Controller with parameter extraction
- ✅ `courses.get.service.js` - Single course retrieval
- ✅ `courses.get.controller.js` - Controller for course details
- ✅ `courses.submit.service.js` - User course submission with international validation
- ✅ `courses.submit.controller.js` - Controller for course submission
- ✅ `courses.routes.js` - Route setup with authentication middleware (search + get + submit)
- ✅ Integration with server.js and auth middleware
- ✅ Comprehensive test coverage (unit tests, integration tests)
- ✅ Updated all tests for international schema (country, state_province, postal_code)
- ✅ Updated import script for international schema
- ✅ Add latitude and longitude to optional fields to the course submit endpoint (rating removed).
- ✅ Remove rating field from courses system (V19 migration, services, tests, docs)
- ✅ Add duplicate course detection to prevent 500 errors on identical submissions
- ✅ **🎯 COMPLETED: Unapproved Course Visibility**
  - ✅ Update course search/get services to include user's own unapproved courses
  - ✅ Update course search/get services to include unapproved courses from accepted friends
  - ✅ Add friend relationship checking logic
  - ✅ Update tests for new visibility rules
  - ✅ Update API documentation for unapproved course access
- ✅ **🎯 COMPLETED: Case-Insensitive Search**
  - ✅ Update all text-based search filters to use case-insensitive partial matching
  - ✅ Fix 'east moline' vs 'East Moline' search compatibility
  - ✅ Add comprehensive unit and integration tests for case-insensitive search
  - ✅ Update existing tests to reflect new search behavior
- ✅ **🎯 COMPLETED: Course Admin & Editing System**
  - ✅ `courses.admin.service.js` - Admin approval workflow (list pending, approve/reject)
  - ✅ `courses.edit.service.js` - Course editing with permission system:
    - ✅ Admins can edit any course
    - ✅ Users can edit their own submitted courses
    - ✅ Approved friends can edit each other's courses
  - ✅ `GET /api/courses/pending` - Admin: List pending courses
  - ✅ `PUT /api/courses/:id/approve` - Admin: Approve/reject course
  - ✅ `PUT /api/courses/:id` - Edit course (user/friend/admin permissions)
  - ✅ Admin authentication middleware integration
  - ✅ Comprehensive test coverage for admin and editing functionality
  - ✅ Complete API documentation for all new endpoints
- ✅ **🎯 COMPLETED: Advanced Search Filters & Test Optimization**
  - ✅ `is_user_submitted` boolean filter - Find user-submitted vs system courses
  - ✅ `approved` boolean filter - Find approved vs pending courses
  - ✅ Boolean validation with proper error handling (400 responses)
  - ✅ Controller-level query parameter parsing (string "true"/"false" → boolean)
  - ✅ Service-level validation with ValidationError handling
  - ✅ **Test Suite Optimization**: Split large integration test file (33→30 tests)
    - ✅ `courses.search.basic.integration.test.js` - Location/filtering tests (16 tests)
    - ✅ `courses.search.permissions.integration.test.js` - Visibility/boolean tests (14 tests)
    - ✅ Shared helper (`courses.search.helper.js`) - Reusable setup/teardown
    - ✅ **Performance**: Parallel test execution, faster CI/CD pipeline
    - ✅ **Maintainability**: Logical separation, reduced code duplication
- ✅ **🎯 COMPLETED: Course Review Tracking System**
  - ✅ V20__add_course_review_tracking.sql migration - Add reviewed_at and reviewed_by_id fields
  - ✅ Updated courses.admin.service.js to track admin review with timestamp and user ID
  - ✅ Updated pending courses query to filter on reviewed_at IS NULL instead of approved = false
  - ✅ Fixed admin workflow: denied courses no longer appear in pending list after review
  - ✅ Added partial index for efficient pending course queries

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
   - **Text Filters:** country, stateProvince (or legacy state), city, name (case-insensitive partial match)
   - **Boolean Filters:** is_user_submitted, approved (exact match, validated)
   - **Pagination:** limit (max 500), offset
   - **Sorting:** ORDER BY country ASC, state_province ASC, city ASC, name ASC
   - **Visibility:** Approved courses + user's own unapproved + friends' unapproved courses
   - **Validation:** Boolean parameters validated, returns 400 for invalid values

2. **`GET /api/courses/:id`** (authenticated) - Get course details
   - **Response:** Single course object or null if not found
   - **Validation:** Returns 400 if courseId is missing
   - **Visibility:** Approved courses + user's own unapproved + friends' unapproved courses

3. **`POST /api/courses`** (authenticated) - Submit user course for approval
   - **Request:** Course data with international support (name, city, stateProvince, country, holeCount, postalCode, latitude, longitude)
   - **Validation:** Country-specific state/province validation (strict for US/CA, inclusive for others), coordinate validation, duplicate detection
   - **Response:** 201 Created with course object (approved: false, is_user_submitted: true)
   - **Security:** Requires authentication, validates user ownership, prevents duplicate submissions
   - **Documentation:** `/docs/api/courses/POST_courses.md`

- **Data:** 7,008 US disc golf courses imported from CSV + user-submitted courses
- **International Support:** Full country/state_province/postal_code schema with migration V18

#### Current Round API Status ✅
**Endpoints:**
1. **`POST /api/rounds`** (authenticated) - Create new round
   - **Request Fields:** courseId (required), name (required), startingHole (optional, default 1), isPrivate (optional), skinsEnabled (optional), skinsValue (optional)
   - **Validation:** Course existence, starting hole bounds (1 to course hole count), required field validation
   - **Response:** 201 Created with round object including UUID, creator info, course reference, start time (immediate), status ("in_progress")
   - **Business Rules:** Immediate start (no future scheduling), course validation, starting hole validation, skins game support
   - **Security:** Authentication required, user becomes round creator, course access validation
   - **Error Handling:** 400 for validation errors, 401 for missing auth, proper error format `{ success: false, message: "..." }`
   - **Documentation:** `/docs/api/rounds/POST_rounds.md`

2. **`GET /api/rounds`** (authenticated) - List user's rounds with filtering and pagination
   - **Query Params:** status, isPrivate, skinsEnabled, name (partial match), limit (default 50, max 500), offset
   - **Filtering:** Status (in_progress/completed/cancelled), privacy, skins enabled, name search
   - **Response:** Paginated results with metadata `{ rounds: [...], total: N, limit: N, offset: N, hasMore: boolean }`
   - **Round Data:** Each round includes `player_count` field showing number of players in the round (minimum 1 since creator is auto-added)
   - **Business Rules:** User isolation (only own rounds), ordered by created_at DESC, case-insensitive name search
   - **Security:** Authentication required, results isolated to authenticated user
   - **Error Handling:** 401 for missing auth, proper pagination metadata always included
   - **Documentation:** `/docs/api/rounds/GET_rounds.md`

- **Database:** V21 migration completed with rounds table (UUID primary keys, foreign key constraints, proper indexing)
- **Testing:** Full TDD coverage (unit tests for service/controller/routes, integration tests with real database)
- **Architecture:** Service → Controller → Routes → Server integration pattern established

### Phase 2: Round Management Core ✅ **PHASE 2.1 COMPLETED**
**Target: Week 3-4**

#### Step 2.1: Round Creation & Basic Management ✅ **COMPLETED**
- ✅ Create round-related migration files (V21__create_rounds_table.sql) **V21 migration completed**
- ✅ `POST /api/rounds` - Create round with course validation and starting hole selection
  - ✅ `rounds.create.service.js` - Full TDD with validation (course lookup, starting hole validation, required fields)
  - ✅ `rounds.create.controller.js` - TDD with success/error handling
  - ✅ `rounds.routes.js` - Authentication middleware integration
  - ✅ Server integration in `server.js`
  - ✅ Comprehensive unit tests (service, controller, routes)
  - ✅ Integration tests with real database operations
  - ✅ **API Documentation:** `/docs/api/rounds/POST_rounds.md`
- ✅ `GET /api/rounds` - List user's rounds (with filtering and pagination)
  - ✅ `rounds.list.service.js` - Service with filtering (status, isPrivate, skinsEnabled, name), pagination, and user isolation
  - ✅ `rounds.list.controller.js` - Controller with query parameter parsing and validation
  - ✅ Integration with existing `rounds.routes.js` and authentication
  - ✅ Comprehensive unit tests (service, controller, routes)
  - ✅ Integration tests with real database operations
  - ✅ **API Documentation:** `/docs/api/rounds/GET_rounds.md`

#### Step 2.2: Player Management Infrastructure ✅ **COMPLETED**
- ✅ **Create round_players migration** (V22__create_round_players_table.sql) - Migration completed and tested
- ✅ `POST /api/rounds/:id/players` - **BATCH ADD** friends/guests to round (auto-join, no invitations)
  - ✅ **NEW: Batch API Design** - Accept array of players in single request
  - ✅ Request format: `{ players: [{ userId: 123 }, { guestName: "John" }] }`
  - ✅ Atomic transaction - all players added or none (single database transaction)
  - ✅ Validate round exists and user has permission (creator or existing player)
  - ✅ Support adding registered users (by userId) and guests (by name) in same batch
  - ✅ Implement friend auto-join (no acceptance required)
  - ✅ Prevent duplicate players in same round and within batch
  - ✅ Return array of all created players with full details
- ✅ `GET /api/rounds/:id/players` - List round players
  - ✅ Return both registered users and guest players
  - ✅ Include player details (username for users, guest_name for guests)
  - ✅ Permission validation (round creator or existing player can view)
  - ✅ JOIN with users table to get usernames
  - ✅ Order by joined_at timestamp
- ✅ `DELETE /api/rounds/:id/players/:playerId` - Remove player
  - ✅ Round creator can remove any player
  - ✅ Players can remove themselves
  - ✅ UUID validation for roundId and playerId parameters
  - ✅ Complete TDD implementation with service, controller, route
  - ✅ Comprehensive unit and integration tests

#### Step 2.3: Round Details & Advanced Management **DEPENDS ON 2.2** ✅ **COMPLETED**
- ✅ `GET /api/rounds/:id` - Get round details WITH players and pars
  - ✅ Include full round details (all round fields)
  - ✅ Include array of players (from round_players LEFT JOIN users)
  - ✅ Include pars object with hole numbers as keys: `{ pars: { "1": 3, "2": 4, "3": 3 } }`
  - ✅ Only accessible to round participants (creator or existing player)
  - ✅ UUID validation for roundId parameter
  - ✅ Complete TDD implementation with service, controller, route
  - ✅ Comprehensive unit and integration tests
  - ✅ Updated API documentation with pars data structure
- ✅ `PUT /api/rounds/:id` - Update round details
  - ✅ Any participant can edit (not just creator)
  - ✅ Update name, status, starting_hole, is_private, skins_enabled, skins_value
  - ✅ Comprehensive field validation (UUID, types, allowed values)
  - ✅ Permission validation (only round participants can update)
  - ✅ Complete TDD implementation with service, controller, route
  - ✅ Comprehensive unit and integration tests
- ✅ `DELETE /api/rounds/:id` - Cancel/delete round
  - ✅ Only round creator can delete (stricter permission than update)
  - ✅ Hard delete implementation with CASCADE cleanup
  - ✅ Handles cascading deletes (round_players, future scores automatically)
  - ✅ Complete parameter validation (UUID format, required fields)
  - ✅ Complete TDD implementation with service, controller, route
  - ✅ Comprehensive unit and integration tests

#### Step 2.4: Round Rules & Requirements
**Player Management:**
- **No Player Limits**: Rounds can have unlimited players (let users feel the pain if they want)
- **Auto-Join Friends**: Friends automatically join rounds when added (no invitation acceptance)
- **Guest Players**: Name-only entries for non-app users, no round visibility or access
- **Friend/Invite Only**: No public round discovery, only friend-based or direct invites

**Round Timing:**
- **Immediate Start**: Rounds start at creation time (start_time = NOW()), no future scheduling
- **Starting Hole**: Choose which hole to start on (1-N), editable after creation
- **Any Player Can Edit**: All round participants can modify round details

**Skins Game Rules:**
- **Per-Hole Value**: Dollar amount set per hole (e.g., $5/hole)
- **Carry-Over Ties**: If hole ties, skins carry forward to next hole
- **Final Hole Tiebreaker**: If final hole ties with skins on the line, prompt users for tiebreaker method
- **Multiple Skins**: 1 or many skins can be riding on a single hole

**Course Management:**
- **Course Deletion**: If course gets deleted/modified, preserve original data for historical rounds
- **Course Changes**: Show both previous and current course info if course details change

**Future Features:**
- **Push Notifications**: WebApp push notifications for round invites/updates (requires device token storage)

### Phase 3: Scoring System
**Target: Week 5-6**

#### Step 3.1: Par Management System
- [x] Create scores and pars migrations (V23)
- [x] `PUT /api/rounds/:id/holes/:holeNumber/par` - Set/update hole par
  - [x] **Default Par 3**: All holes start with par 3 (disc golf standard)
  - [x] **Any Player Can Edit**: Any round participant can change par for any hole
  - [x] Validate par range (1-10) and hole number
  - [x] Track who set/changed the par (audit trail)
  - [x] **Trigger Score Recalculation**: Update all relative scores when par changes
  - [x] **Trigger Skins Recalculation**: Recalculate skins from affected hole forward
- [x] `GET /api/rounds/:id/pars` - Get all round pars
  - [x] Return object with hole numbers as keys: `{ "1": 3, "2": 4, "3": 3 }`
  - [x] Default to par 3 for holes without explicit par set (not included in response)
  - [ ] Include who set each par and when (for audit) - **Future enhancement**
  - [x] **AFTER THIS**: Go back to Step 2.3 and add pars data to GET /api/rounds/:id endpoint

#### Step 3.2: Score Entry & Management
- [x] `POST /api/rounds/:id/scores` - Submit/update scores ✅ **COMPLETED**
  - [x] **Batch API Design**: Accept array of scores for multiple players/holes
  - [x] **Simplified Format**: `{ scores: [{ playerId, holeNumber, strokes }] }` (no par field)
  - [x] **Par Lookup**: Get par from round_hole_pars table, default to 3 if not set
  - [x] Support both new scores and updates (upsert logic)
  - [x] Validate hole numbers against course hole count
  - [x] Validate strokes (1-20) ranges
  - [x] **Retroactive Score Changes**: Allow editing previous holes' scores
  - [x] Complete TDD implementation with service, controller, route
  - [x] Comprehensive unit and integration tests
  - [x] API documentation: `/docs/api/rounds/POST_rounds_id_scores.md`
  - [ ] **Skins Recalculation Trigger**: Mark round for skins recalculation on any score change - **Future enhancement**
- [x] `GET /api/rounds/:id/scores` - Get all round scores ✅ **COMPLETED**
  - [x] Return matrix organized by player and hole
  - [x] **Dynamic Par Calculation**: Join with round_hole_pars table for current par values
  - [x] Include calculated totals and relative scores
  - [x] Format: `{ playerUuid: { username/guestName, holes: { 1: { strokes, par, relative } }, total, totalPar, relativeScore } }`
  - [x] Complete TDD implementation with service, controller, routes
  - [x] Comprehensive unit and integration tests
  - [x] API documentation: `/docs/api/rounds/GET_rounds_id_scores.md`
- [x] `GET /api/rounds/:id/leaderboard` - Real-time leaderboard (**INCREMENTAL APPROACH**) ✅ **COMPLETED**
  - [x] **Phase 1 (Now)**: Basic leaderboard functionality ✅ **COMPLETED**
    - [x] Sort players by total strokes (ascending)  
    - [x] Include position, holes completed, current hole
    - [x] Show round skins settings (skins_enabled, skins_value from rounds table)
    - [x] **Placeholder skins data**: skinsWon: 0, carry-over: 0 (until Phase 4)
    - [x] Complete TDD implementation with service, controller, route
    - [x] API documentation with clear "skins coming soon" notes: `/docs/api/rounds/GET_rounds_id_leaderboard.md`
  - [ ] **Phase 2 (Phase 4.1)**: Full skins integration (requires skins_results table)
    - [ ] **DEPENDS ON**: Skins Calculation Engine (Step 4.1)
    - [ ] **DEPENDS ON**: skins_results table creation
    - [ ] Replace placeholder data with real skinsWon count per player
    - [ ] Show current skins carry-over amount from ongoing holes
    - [ ] Update API documentation to remove "coming soon" notes
- [ ] Hole-by-hole score validation
- [ ] Score calculation utilities (par, total, relative)

#### Step 3.3: Real-time Score Updates & Skins Recalculation
- [ ] **Skins Recalculation Engine**
  - [ ] Triggered automatically on any score change (including retroactive edits)
  - [ ] **Triggered on par changes**: Recalculate when hole par is updated
  - [ ] Recalculate from the edited hole forward to end of round
  - [ ] Store skins history/audit trail for transparency
  - [ ] Handle cascading effects of score/par changes on carry-overs
  - [ ] Notify all players when skins winners change
- [ ] WebSocket integration for live scoring
- [ ] Score change notifications
- [ ] **Skins Change Notifications**: Alert players when skins winners change due to score/par edits
- [ ] Offline score caching strategy
- [ ] Sync conflict resolution
- [ ] Mobile-optimized score entry

#### Step 3.4: Scoring Analytics
- [ ] Round statistics calculation
- [ ] Player performance metrics
- [ ] Course difficulty analysis
- [ ] Historical scoring trends

### Phase 4: Betting System
**Target: Week 7-8**

#### Step 4.1: Skins Game ✅ **CORE IMPLEMENTATION COMPLETED**
**⚠️ IMPORTANT**: Update GET /api/rounds/:id/leaderboard endpoint when complete (remove placeholder skins data)

- ✅ **Skins Calculation Engine** (per-hole dollar value) ✅ **COMPLETED**
  - ✅ Calculate winner per hole (lowest score wins)
  - ✅ Handle ties with carry-over to next hole
  - ✅ Support multiple skins on a single hole (accumulation from ties)
  - ✅ **Fixed Carry-Over Display Bug**: `carriedOver` field now correctly shows skins carried INTO each hole
    - ✅ **Issue**: Previously showed `carriedOver: 1` for all tied holes regardless of actual carry-in amount
    - ✅ **Fix**: Updated logic to track `currentCarryOver` before incrementing for tied holes
    - ✅ **Result**: Proper accumulation display (hole 1: 0, hole 2: 1, hole 3: 2, winner gets all 3)
    - ✅ **Testing**: Comprehensive unit tests updated to expect correct carry-over values
    - ✅ **Integration**: Full integration test coverage for non-hole-1 starting rounds
  - ✅ **Non-Hole-1 Starting Support**: Proper skins calculation for rounds starting on any hole
    - ✅ **Play Order**: Correctly processes holes in starting_hole sequence (e.g., 5→6→7→8→9→1→2→3)
    - ✅ **Carry-Over Flow**: Skins properly carry forward across hole boundary (hole 9 → hole 1)
    - ✅ **Testing**: Added comprehensive integration test for hole-5 start scenario
  - [ ] **Retroactive Recalculation**: Full recalc when any score changes - **Future enhancement**
  - [ ] Track skins history for audit trail - **Future enhancement**
- [ ] **Skins Money Tracking** - **Planned Enhancement**
  - [ ] Calculate net gain/loss per player across all participants
  - [ ] **Formula**: `netGain = totalValueWon - (totalSkinsInRound * skinsValuePerHole)`
  - [ ] **Example**: Win all 9 skins at $1/hole with 2 opponents = +$18 (you get $9 from each)
  - [ ] **Example**: Lose all skins in 3-player game = -$9 (pay $1/hole to winner)
  - [ ] Add `netGain` field to playerSummary in skins API response
  - [ ] Include total pot contribution and winnings breakdown
  - [ ] Update API documentation with money tracking examples
- [ ] **Skins State Management** - **Future enhancement (caching optimization)**
  - [ ] Create `skins_results` table to store calculated results
  - [ ] Store hole-by-hole winners and carry-over amounts
  - [ ] Cache results but invalidate on score changes
  - [ ] Include timestamp of last calculation
- [ ] **Score Change Impact** - **Future enhancement**
  - [ ] Detect which holes are affected by score edit
  - [ ] Recalculate skins from earliest affected hole
  - [ ] Update all downstream carry-overs
  - [ ] Generate change notification for affected players
- [ ] Final hole tiebreaker system (prompt users for method if tied on last hole) - **Future enhancement**
- [ ] Final payout calculation and distribution - **Future enhancement**
- [ ] Skins leaderboard display with carry-over tracking - **Future enhancement**
- ✅ **Skins API Endpoints** ✅ **COMPLETED**
  - ✅ `GET /api/rounds/:id/skins` - Current skins results with carry-over tracking
  - [ ] `GET /api/rounds/:id/skins/history` - Audit trail of changes - **Future enhancement**

#### Current Skins Implementation Status ✅
- **Service**: `skins.calculate.service.js` - Full TDD implementation with comprehensive unit tests
- **Controller**: `skins.calculate.controller.js` - Thin controller following established patterns  
- **Routes**: Added to `rounds.routes.js` with authentication middleware
- **API Endpoint**: `GET /api/rounds/:id/skins` - Production ready with full integration tests
- **Authentication**: Only round participants can view skins results
- **Business Logic**: Real-time calculation with proper carry-over logic and player summaries
- **Documentation**: Complete API documentation at `/docs/api/rounds/GET_rounds_id_skins.md`

**What's Working Now:**
- Winner detection (lowest score wins each hole)
- Tie handling with carry-over accumulation to next hole
- Player summary with total skins won and dollar values
- Sequential hole processing for proper carry-over logic
- Full permission validation (creator + players only)
- Comprehensive error handling and validation
- Real-time calculation (no caching needed for MVP)

**Planned Money Tracking Enhancement:**
- **Net Gain/Loss Calculation**: Track how much each player is up/down
- **Multi-Player Math**: Winner gets skins value × number of other players
- **Example Scenarios**:
  - 2 players, $1/hole: Winner gets $1, loser pays $1 (net: +$1/-$1)
  - 3 players, $1/hole: Winner gets $2, losers each pay $1 (net: +$2/-$1/-$1)
  - 4 players, $5/hole: Winner gets $15, losers each pay $5 (net: +$15/-$5/-$5/-$5)

#### Step 4.2: Side Bets
- [ ] Create side bets migrations (V24-V25)
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
  - **Text Filters:** `?country=US&stateProvince=California&city=Sacramento&name=park`
  - **Boolean Filters:** `?is_user_submitted=true&approved=false`
  - **Pagination:** `?limit=100&offset=50` (max limit: 500)
  - **Response:** Paginated results with metadata
  - **Validation:** 400 error for invalid boolean values
- ✅ `GET /api/courses/:id` - Get course details (authenticated)
  - **Response:** Single course object or null
  - **Visibility:** Approved + user's own + friends' unapproved courses
- ✅ `POST /api/courses` - Submit user course (with international support)
- ✅ `GET /api/courses/pending` - Admin: pending courses
- ✅ `PUT /api/courses/:id/approve` - Admin: approve course  
- ✅ `PUT /api/courses/:id` - Edit course (user/friend/admin permissions)

### Round Management
- ✅ `POST /api/rounds` - Create round (with starting_hole selection, course validation, skins support)
  - **Request:** Course ID, round name, optional starting hole, privacy, skins settings
  - **Validation:** Course exists, starting hole within course bounds, required fields
  - **Response:** 201 Created with round object (immediate start time, in_progress status)
  - **Security:** Requires authentication, validates course access
  - **Documentation:** `/docs/api/rounds/POST_rounds.md`
- ✅ `GET /api/rounds` - List user rounds (with filtering and pagination)
  - **Filters:** status, isPrivate, skinsEnabled, name search
  - **Pagination:** limit/offset with metadata (total, hasMore)
  - **Response:** User's own rounds ordered by created_at DESC
  - **Security:** Requires authentication, user isolation
  - **Documentation:** `/docs/api/rounds/GET_rounds.md`
- ✅ `GET /api/rounds/:id` - Get round details WITH players and pars
  - **Response:** Full round object with embedded players array and pars object
  - **Pars Format:** `{ pars: { "1": 3, "2": 4, "18": 5 } }` for holes with explicit par set
  - **Permissions:** Only round participants (creator or existing player)
  - **Validation:** UUID format validation for roundId
  - **Security:** Requires authentication, participant-only access
  - **Documentation:** `/docs/api/rounds/GET_rounds_id.md`
- ✅ `PUT /api/rounds/:id` - Update round details (any participant can edit)
  - **Request:** Partial update data (name, status, starting_hole, is_private, skins_enabled, skins_value)
  - **Validation:** UUID format, field types, allowed values, participant permission
  - **Response:** 200 OK with updated round object
  - **Security:** Requires authentication, participant-only access
  - **Documentation:** `/docs/api/rounds/PUT_rounds_id.md`
- ✅ `DELETE /api/rounds/:id` - Delete round (only creator can delete)
  - **Request:** No body required, roundId in URL parameter
  - **Validation:** UUID format, round existence, creator permission
  - **Response:** 200 OK with success confirmation
  - **Security:** Requires authentication, creator-only access
  - **Database:** Hard delete with CASCADE cleanup of related data
  - **Documentation:** `/docs/api/rounds/DELETE_rounds_id.md`

### Player Management
- ✅ `POST /api/rounds/:id/players` - Add players (batch API)
- ✅ `GET /api/rounds/:id/players` - List round players
- ✅ `DELETE /api/rounds/:id/players/:playerId` - Remove player

### Par Management
- ✅ `PUT /api/rounds/:id/holes/:holeNumber/par` - Set/update hole par (any player, triggers recalculation)
- `GET /api/rounds/:id/pars` - Get all round pars (defaults to par 3)

### Scoring  
- `POST /api/rounds/:id/scores` - Submit/update scores (batch API, no par field, supports retroactive edits)
- `GET /api/rounds/:id/scores` - Get all scores in matrix format (dynamic par lookup)
- `GET /api/rounds/:id/leaderboard` - Real-time leaderboard with skins integration

### Betting
- ✅ `GET /api/rounds/:id/skins` - Get current skins results with carry-over tracking ✅ **COMPLETED**
  - **Response:** Complete skins calculation with hole-by-hole results and player summaries
  - **Business Logic:** Real-time winner detection, tie carry-over, sequential processing
  - **Security:** Requires authentication, participant-only access
  - **Data:** Dynamic calculation based on current scores and pars
  - **Documentation:** `/docs/api/rounds/GET_rounds_id_skins.md`
- `GET /api/rounds/:id/skins/history` - Audit trail of skins changes (score edits) - **Future enhancement**
- `POST /api/rounds/:id/side-bets` - Create side bet - **Not implemented**
- `POST /api/rounds/:id/side-bets/:betId/join` - Join bet - **Not implemented**
- `PUT /api/rounds/:id/side-bets/:betId/winner` - Declare winner - **Not implemented**

---

## Technical Considerations

### Real-time Features
- WebSocket integration for live scoring
- Server-Sent Events for leaderboard updates
- Optimistic UI updates with rollback capability
- **Skins Recalculation Notifications**: Real-time alerts when score edits change skins winners

### Skins Calculation Intelligence
- **Retroactive Score Change Handling**: Automatically detect and recalculate affected holes
- **Par Change Handling**: Recalculate skins when hole par values are updated
- **Cascade Effect Management**: Score/par changes trigger skins recalc from edited hole forward
- **Audit Trail**: Track all skins changes with timestamps and reason (initial calc vs score edit vs par change)
- **Performance Optimization**: Only recalculate affected holes, not entire round

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
- Course difficulty analysis (without ratings)
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

