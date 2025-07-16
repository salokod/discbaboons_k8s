# 🎒 Bag Management Development Plan

## Overview
Build bag functionality for disc inventory management. Users can create bags, manage them, move discs between bags as inventory, and share bags with friends.

---

## Database Schema

### Migration Files Needed

**`V12__create_bags_table.sql`**
```sql
CREATE TABLE bags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  is_friends_visible BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_bags_user_id ON bags(user_id);
CREATE INDEX idx_bags_is_public ON bags(is_public);
CREATE INDEX idx_bags_is_friends_visible ON bags(is_friends_visible);
```

**`V13__create_bag_contents_table.sql`** *(Enhanced for Phase 2)*
```sql
CREATE TABLE bag_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bag_id UUID NOT NULL,
  disc_id UUID NOT NULL,
  notes VARCHAR(255),
  weight DECIMAL(4,1),
  condition VARCHAR(20) DEFAULT 'good',
  plastic_type VARCHAR(50),  -- Champion, DX, Star, etc.
  color VARCHAR(50),         -- Red, Blue, Orange, etc.
  is_lost BOOLEAN DEFAULT false,  -- Mark disc as lost instead of deleting
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (bag_id) REFERENCES bags(id) ON DELETE CASCADE,
  FOREIGN KEY (disc_id) REFERENCES disc_master(id) ON DELETE CASCADE
);

CREATE INDEX idx_bag_contents_bag_id ON bag_contents(bag_id);
CREATE INDEX idx_bag_contents_disc_id ON bag_contents(disc_id);
CREATE INDEX idx_bag_contents_is_lost ON bag_contents(is_lost);
```

### Prisma Schema Update
```prisma
model bags {
  id                String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  user_id           Int
  name              String         @db.VarChar(100)
  description       String?
  is_public         Boolean        @default(false)
  is_friends_visible Boolean       @default(false)
  created_at        DateTime?      @default(now()) @db.Timestamp(6)
  updated_at        DateTime?      @default(now()) @db.Timestamp(6)
  users             users          @relation(fields: [user_id], references: [id], onDelete: Cascade)
  bag_contents      bag_contents[]

  @@index([user_id], map: "idx_bags_user_id")
  @@index([is_public], map: "idx_bags_is_public")
  @@index([is_friends_visible], map: "idx_bags_is_friends_visible")
}

model bag_contents {
  id           String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  bag_id       String      @db.Uuid
  disc_id      String      @db.Uuid
  notes        String?     @db.VarChar(255)
  weight       Decimal?    @db.Decimal(4,1)
  condition    String?     @default("good") @db.VarChar(20)
  plastic_type String?     @db.VarChar(50)
  color        String?     @db.VarChar(50)
  is_lost      Boolean     @default(false)
  added_at     DateTime?   @default(now()) @db.Timestamp(6)
  updated_at   DateTime?   @default(now()) @db.Timestamp(6)
  bags         bags        @relation(fields: [bag_id], references: [id], onDelete: Cascade)
  disc_master  disc_master @relation(fields: [disc_id], references: [id], onDelete: Cascade)

  @@index([bag_id], map: "idx_bag_contents_bag_id")
  @@index([disc_id], map: "idx_bag_contents_disc_id")
  @@index([is_lost], map: "idx_bag_contents_is_lost")
}

// Add to users model
model users {
  // ...existing fields...
  bags bags[]
}

// Add to disc_master model
model disc_master {
  // ...existing fields...
  bag_contents bag_contents[]
}
```

---

## Phase 1: Bag CRUD Operations

### Files to Create

#### Routes
- `routes/bags.routes.js`

#### Services
- `services/bags.create.service.js`
- `services/bags.list.service.js`
- `services/bags.get.service.js`
- `services/bags.update.service.js`
- `services/bags.delete.service.js`

#### Controllers
- `controllers/bags.create.controller.js`
- `controllers/bags.list.controller.js`
- `controllers/bags.get.controller.js`
- `controllers/bags.update.controller.js`
- `controllers/bags.delete.controller.js`

#### Tests
- `tests/integration/api/bags.create.integration.test.js`
- `tests/integration/api/bags.list.integration.test.js`
- `tests/integration/api/bags.get.integration.test.js`
- `tests/integration/api/bags.update.integration.test.js`
- `tests/integration/api/bags.delete.integration.test.js`

---

## API Endpoints

### Bag Management
```javascript
// routes/bags.routes.js
router.get('/', authenticateToken, bagsListController);           // List user's bags
router.post('/', authenticateToken, bagsCreateController);        // Create new bag
router.get('/:id', authenticateToken, bagsGetController);         // Get specific bag
router.put('/:id', authenticateToken, bagsUpdateController);      // Update bag
router.delete('/:id', authenticateToken, bagsDeleteController);   // Delete bag

// Phase 2: Bag Contents
router.post('/:id/discs', authenticateToken, bagsAddDiscController);                    // Add disc to bag
router.put('/:id/discs/:contentId', authenticateToken, bagsEditDiscController);         // Edit disc personal data
router.patch('/:id/discs/:contentId/lost', authenticateToken, bagsLostDiscController);  // Mark disc as lost/found
router.delete('/:id/discs/:contentId', authenticateToken, bagsRemoveDiscController);    // Remove disc from bag

// Phase 2: Disc Movement (ATOMIC OPERATIONS)
router.post('/discs/:contentId/move', authenticateToken, bagsMoveDiscController);       // Move disc between bags

// Phase 3: Friend Bag Viewing
router.get('/friends/:friendUserId', authenticateToken, bagsFriendsListController);    // List friend's visible bags
router.get('/friends/:friendUserId/:bagId', authenticateToken, bagsFriendsGetController); // Get friend's bag details
```

### Request/Response Examples

**POST `/api/bags`** - Create Bag
```json
// Request
{
  "name": "Tournament Bag",
  "description": "My go-to discs for tournaments",
  "is_public": false,
  "is_friends_visible": true
}

// Response (201)
{
  "success": true,
  "bag": {
    "id": "uuid-here",
    "name": "Tournament Bag",
    "description": "My go-to discs for tournaments",
    "is_public": false,
    "is_friends_visible": true,
    "created_at": "2025-06-28T10:00:00Z",
    "updated_at": "2025-06-28T10:00:00Z"
  }
}
```

**GET `/api/bags`** - List Bags
```json
// Response (200)
{
  "success": true,
  "bags": [
    {
      "id": "uuid-1",
      "name": "Tournament Bag",
      "description": "My go-to discs",
      "is_public": false,
      "is_friends_visible": true,
      "created_at": "2025-06-28T10:00:00Z",
      "disc_count": 15
    }
  ],
  "total": 1
}
```

**GET `/api/bags/friends/:friendUserId`** - List Friend's Visible Bags
```json
// Response (200)
{
  "success": true,
  "friend": {
    "id": 123,
    "username": "disc_master_bob"
  },
  "bags": [
    {
      "id": "friend-bag-uuid-1",
      "name": "Bob's Tournament Setup",
      "description": "What I throw in tournaments",
      "is_friends_visible": true,
      "created_at": "2025-06-28T09:00:00Z",
      "disc_count": 18
    }
  ],
  "total": 1
}
```

**GET `/api/bags/friends/:friendUserId/:bagId`** - Get Friend's Bag Details
```json
// Response (200)
{
  "success": true,
  "friend": {
    "id": 123,
    "username": "disc_master_bob"
  },
  "bag": {
    "id": "friend-bag-uuid-1",
    "name": "Bob's Tournament Setup",
    "description": "What I throw in tournaments",
    "is_friends_visible": true,
    "created_at": "2025-06-28T09:00:00Z",
    "contents": [
      {
        "id": "friend-content-uuid-1",
        "disc": {
          "id": "disc-uuid-1",
          "brand": "Innova",
          "model": "Destroyer",
          "speed": 12,
          "glide": 5,
          "turn": -1,
          "fade": 3
        },
        "notes": "Champion plastic, red",
        "weight": 175.0,
        "condition": "good",
        "added_at": "2025-06-28T09:30:00Z"
      }
    ]
  }
}
```

**GET `/api/bags/:id`** - Get Single Bag
```json
// Response (200) - Phase 1 (no contents)
{
  "success": true,
  "bag": {
    "id": "uuid-here",
    "name": "Tournament Bag",
    "description": "My go-to discs for tournaments",
    "is_public": false,
    "is_friends_visible": true,
    "created_at": "2025-06-28T10:00:00Z",
    "updated_at": "2025-06-28T10:00:00Z"
  }
}

// Response (200) - Phase 2 (with contents including personal data)
{
  "success": true,
  "bag": {
    "id": "uuid-here",
    "name": "Tournament Bag",
    "description": "My go-to discs for tournaments",
    "is_public": false,
    "is_friends_visible": true,
    "created_at": "2025-06-28T10:00:00Z",
    "contents": [
      {
        "id": "content-uuid-1",
        "disc": {
          "id": "disc-uuid-1",
          "brand": "Innova",
          "model": "Destroyer",
          "speed": 12,
          "glide": 5,
          "turn": -1,
          "fade": 3
        },
        "notes": "My go-to driver for hyzer shots",
        "weight": 175.0,
        "condition": "good",
        "plastic_type": "Champion",
        "color": "Red",
        "is_lost": false,
        "added_at": "2025-06-28T10:00:00Z",
        "updated_at": "2025-06-28T15:30:00Z"
      }
    ]
  }
}
```

**PUT `/api/bags/:id`** - Update Bag ✅ IMPLEMENTED
```json
// Request
{
  "name": "Updated Tournament Bag",
  "description": "Updated description for my tournament discs",
  "is_public": true,
  "is_friends_visible": false
}

// Response (200)
{
  "success": true,
  "bag": {
    "id": "uuid-here",
    "name": "Updated Tournament Bag",
    "description": "Updated description for my tournament discs",
    "is_public": true,
    "is_friends_visible": false,
    "user_id": 123,
    "created_at": "2025-06-28T10:00:00Z",
    "updated_at": "2025-06-29T14:30:00Z"
  }
}

// Response (400) - Validation Error
{
  "success": false,
  "message": "updateData is required"
}

// Response (404) - Not Found
{
  "success": false,
  "message": "Bag not found"
}
```

**POST `/api/bags/:id/discs`** - Add Disc to Bag (Phase 2)
```json
// Request
{
  "disc_id": "disc-uuid-1",
  "notes": "My favorite driver",
  "weight": 175.0,
  "condition": "new",
  "plastic_type": "Champion",
  "color": "Red"
}

// Response (201)
{
  "success": true,
  "bag_content": {
    "id": "content-uuid-1",
    "bag_id": "bag-uuid-1",
    "disc": {
      "id": "disc-uuid-1",
      "brand": "Innova",
      "model": "Destroyer",
      "speed": 12,
      "glide": 5,
      "turn": -1,
      "fade": 3
    },
    "notes": "My favorite driver",
    "weight": 175.0,
    "condition": "new",
    "plastic_type": "Champion",
    "color": "Red",
    "is_lost": false,
    "added_at": "2025-06-28T11:00:00Z",
    "updated_at": "2025-06-28T11:00:00Z"
  }
}
```

**PUT `/api/bags/:id/discs/:contentId`** - Edit Disc Personal Data (Phase 2)
```json
// Request
{
  "notes": "Updated notes - great for headwinds",
  "condition": "good",
  "plastic_type": "Star",
  "color": "Blue",
  "weight": 174.5
}

// Response (200)
{
  "success": true,
  "bag_content": {
    "id": "content-uuid-1",
    "bag_id": "bag-uuid-1",
    "disc": {
      "id": "disc-uuid-1",
      "brand": "Innova",
      "model": "Destroyer"
    },
    "notes": "Updated notes - great for headwinds",
    "weight": 174.5,
    "condition": "good",
    "plastic_type": "Star",
    "color": "Blue",
    "is_lost": false,
    "added_at": "2025-06-28T11:00:00Z",
    "updated_at": "2025-06-28T14:30:00Z"
  }
}
```

**PATCH `/api/bags/:id/discs/:contentId/lost`** - Mark Disc as Lost/Found (Phase 2)
```json
// Request
{
  "is_lost": true
}

// Response (200)
{
  "success": true,
  "message": "Disc marked as lost",
  "bag_content": {
    "id": "content-uuid-1",
    "is_lost": true,
    "updated_at": "2025-06-28T16:00:00Z"
  }
}
```

**DELETE `/api/bags/discs/:contentId`** - Remove Disc from Account (Phase 2) ✅ IMPLEMENTED
```json
// Response (200)
{
  "success": true,
  "message": "Disc removed from your account successfully"
}

// Response (404) - Not Found or Access Denied
{
  "success": false,
  "message": "Disc not found or access denied"
}
```

**POST `/api/bags/discs/move`** - Move Discs Between Bags (Bulk Operations) ✅ PLANNED
```json
// Single Disc Move
{
  "content_ids": ["content-uuid-1"],
  "to_bag_id": "target-bag-uuid",
  "update_data": {
    "notes": "Updated notes for new bag",
    "condition": "good"
  }
}

// Multiple Discs Move
{
  "content_ids": ["content-uuid-1", "content-uuid-2", "content-uuid-3"],
  "to_bag_id": "target-bag-uuid",
  "update_data": {
    "condition": "tournament-ready"
  }
}

// Move All Discs from Source Bag
{
  "from_bag_id": "source-bag-uuid",
  "to_bag_id": "target-bag-uuid",
  "move_all": true
}

// Move All Discs Matching Criteria
{
  "from_bag_id": "source-bag-uuid", 
  "to_bag_id": "target-bag-uuid",
  "filter": {
    "disc_type": "driver", // Based on speed > 10
    "condition": "good",
    "is_lost": false
  }
}

// Success Response (200)
{
  "success": true,
  "moved_count": 3,
  "moved_discs": [
    {
      "id": "new-content-uuid-1",
      "old_content_id": "content-uuid-1",
      "disc": { "brand": "Innova", "model": "Destroyer" },
      "notes": "Updated notes",
      "condition": "good"
    }
  ],
  "from_bag_id": "source-bag-uuid",
  "to_bag_id": "target-bag-uuid",
  "operation_time": "2025-06-28T11:00:00Z"
}
```

---

## Implementation Order

### Step 1: Database Setup
- [x] Create migration file `V12__create_bags_table.sql`
- [x] Update `schema.prisma` with bags model
- [x] Run migration: `npx prisma migrate dev`
- [x] Generate Prisma client: `npx prisma generate`

### Step 2: Create Bag Service ✅ COMPLETED
- [x] `services/bags.create.service.js`
- [x] `controllers/bags.create.controller.js`
- [x] Add route in `routes/bags.routes.js`
- [x] Mount route in `server.js`: `app.use('/api/bags', bagsRouter)`
- [x] Test with integration test - comprehensive coverage including validation, duplicates, authentication

### Step 3: List Bags Service ✅ COMPLETED
- [x] `services/bags.list.service.js`
- [x] `controllers/bags.list.controller.js`
- [x] Add route
- [x] Test

### Step 4: Get Single Bag Service ✅ COMPLETED
- [x] `services/bags.get.service.js`
- [x] `controllers/bags.get.controller.js`
- [x] Add route
- [x] Test

### Step 5: Update Bag Service ✅ COMPLETED
- [x] `services/bags.update.service.js`
- [x] `controllers/bags.update.controller.js`
- [x] Add route
- [x] Test

### Step 6: Delete Bag Service ✅ COMPLETED
- [x] `services/bags.delete.service.js` - Atomic deletion with user ownership validation
- [x] `controllers/bags.delete.controller.js` - Returns 200 with success message (consistent with codebase patterns)
- [x] Add DELETE /:id route with authentication middleware
- [x] Comprehensive unit and integration tests with edge cases

### Step 7: Phase 2 Database Setup ✅ COMPLETED
- [x] Create migration file `V13__create_bag_contents_table.sql` with enhanced schema
- [x] Update `schema.prisma` with bag_contents model including plastic_type, color, is_lost fields
- [x] Run migration: `npx prisma migrate dev`
- [x] Generate Prisma client: `npx prisma generate`

### Step 8: Add Disc to Bag Service ✅ COMPLETED
- [x] `services/bag-contents.add.service.js` - Validate disc_id, bag ownership, and personal data including pending disc security
- [x] `controllers/bag-contents.add.controller.js` - Handle plastic_type, color, weight, notes with proper error handling
- [x] Add POST /:id/discs route with authentication middleware
- [x] Comprehensive tests with validation for new fields including unit, controller, route, and integration tests
- [x] Security validation: Users can only add their own pending discs, all users can add approved discs
- [x] Full TDD implementation with thin slices and proper error handling using existing errorHandler middleware

### Step 9: Update Bag Get Service (with contents) ✅ COMPLETED
- [x] Modify `services/bags.get.service.js` to include bag contents with personal data
- [x] Filter out lost discs by default (add ?include_lost=true for showing lost discs)
- [x] Update integration tests for content inclusion  
- [x] Test with populated bags including lost discs

### Step 10: Add Custom Flight Numbers to bag_contents ✅ COMPLETED
- [x] Create migration `V14__add_flight_numbers_to_bag_contents.sql` - Add speed, glide, turn, fade to bag_contents
- [x] Update Prisma schema with nullable flight number fields
- [x] Run migration and regenerate Prisma client
- [x] Update `services/bag-contents.add.service.js` - Accept optional flight numbers when adding discs
- [x] Update `services/bags.get.service.js` - Return custom flight numbers if set, otherwise disc_master values
- [x] Update integration tests for flight number functionality
- [x] Test flight number overrides and fallback logic
- [x] Add comprehensive validation for flight number ranges (1-15, 1-7, -5 to +2, 0-5)
- [x] Manual API testing confirmed working end-to-end

### Step 11: Edit Bag Contents Service ✅ COMPLETED
- [x] `services/bag-contents.edit.service.js` - Update personal disc data (plastic_type, color, weight, condition, speed, glide, turn, fade)
- [x] `controllers/bag-contents.edit.controller.js` - PUT endpoint for disc content updates  
- [x] Add PUT /:id/discs/:contentId route with authentication middleware
- [x] Comprehensive unit tests with service mocking and error handling
- [x] Route tests in `bags.routes.test.js` for new endpoint with auth middleware
- [x] Comprehensive integration tests with authentication, validation, authorization, and edge cases
- [x] Flight number validation (speed 1-15, glide 1-7, turn -5 to +2, fade 0-5)
- [x] User ownership validation and authorization checks
- [x] Partial update support (only update provided fields)
- [x] Proper error handling with ValidationError and AuthorizationError
- [x] Fixed naming consistency to follow `bag-contents.*` pattern

### Step 11b: Add Custom Disc Names/Models to Bag Contents ✅ COMPLETED
- [x] Create migration `V15__add_custom_disc_names_to_bag_contents.sql` - Add brand, model fields to bag_contents
- [x] Update Prisma schema with nullable brand/model fields  
- [x] Update `services/bag-contents.add.service.js` - Accept optional custom brand/model when adding discs
- [x] Update `services/bag-contents.edit.service.js` - Allow editing custom brand/model
- [x] Update `services/bags.get.service.js` - Return custom brand/model if set, otherwise disc_master values
- [x] Add validation for brand/model field lengths (max 50 characters each)
- [x] Update unit tests for add/edit services with brand/model scenarios including validation tests
- [x] Update integration tests for custom brand/model functionality with Chance.js test data
- [x] Test brand/model overrides and fallback logic (similar to flight numbers)
- [x] Comprehensive validation tests (string type, length limits, null handling)
- [x] End-to-end testing for add, edit, and display functionality

**Rationale**: Users want to customize disc names for their personal collection (e.g., "Beat-in Destroyer", "Glow Champion Wraith", "First Ace Disc"). This follows the same pattern as custom flight numbers - nullable override fields that fall back to disc_master values.

### Step 12: Mark Disc as Lost/Found Service ✅ COMPLETED
- [x] **Migration V16** - Added `lost_notes VARCHAR(255)` and `lost_at TIMESTAMP` fields to bag_contents for enhanced lost disc tracking
- [x] **`services/bag-contents.mark-lost.service.js`** - Comprehensive lost/found functionality with bag management:
  - **Lost**: Sets `is_lost: true`, `bag_id: null` (removes from bag), `lost_notes`, `lost_at: NOW()`
  - **Found**: Requires `bag_id`, validates ownership, assigns to target bag, clears lost data
  - **Security**: User ownership validation for both disc content and target bags
  - **Validation**: UUID format validation, required field validation
  - **Timestamp tracking**: Always updates `updated_at` field
- [x] **`controllers/bag-contents.mark-lost.controller.js`** - PATCH endpoint with proper error handling (404, 400, 403)
- [x] **Route**: PATCH `/api/bags/discs/:contentId/lost` with authentication middleware
- [x] **Comprehensive unit tests** - TDD implementation covering all scenarios:
  - Lost/found functionality, bag assignment/removal, validation errors, authorization checks
- [x] **Comprehensive integration tests** - End-to-end API testing with Chance.js test data:
  - Complete workflow testing, security validation, error scenarios, data integrity
- [x] **Enhanced functionality**: Automatic date tracking, bag removal on lost, required bag assignment on found

**API Usage:**
```javascript
// Mark as lost with notes (removes from bag)
PATCH /api/bags/discs/:contentId/lost
{ "is_lost": true, "lost_notes": "prospect park hole 12" }

// Mark as found (requires target bag_id)
PATCH /api/bags/discs/:contentId/lost  
{ "is_lost": false, "bag_id": "target-bag-uuid" }
```

### Step 12b: List Lost Discs Service ✅ COMPLETED
- [x] `services/bag-contents.list-lost.service.js` - List all user's lost discs with filtering/sorting
- [x] `controllers/bag-contents.list-lost.controller.js` - GET endpoint for lost discs
- [x] Add GET `/api/bags/lost-discs` route with authentication middleware
- [x] **Features implemented:**
  - **Lost disc listing**: Query `bag_contents` where `is_lost: true` and `user_id: userId` (SECURITY: Users can only view their own lost discs)
  - **User ownership validation**: Ensure authentication and filter by authenticated user's ID only
  - **Include disc master data**: Full disc information (brand, model, flight numbers)
  - **Lost metadata**: `lost_notes`, `lost_at` timestamp for context
  - **Sorting options**: By `lost_at` (newest/oldest), by disc name, by lost location
  - **Filtering options**: Optional date range, search by lost_notes
  - **Pagination**: Support for large numbers of lost discs with correct total count and has_more logic
  - **Data merging**: Custom flight numbers and brand/model with disc_master fallbacks
- [x] **Comprehensive testing**: Unit tests with TDD, integration tests with various scenarios
  - **Security tests**: Verify users cannot access other users' lost discs
  - **Authentication tests**: Ensure endpoint requires valid authentication
  - **Authorization tests**: Confirm filtering by user_id prevents cross-user access
  - **Pagination tests**: Verify correct total count, has_more logic, and pagination parameters
- [x] **API Response Format**:
```javascript
// GET /api/bags/lost-discs?sort=lost_at&order=desc&limit=20&offset=0
{
  "success": true,
  "lost_discs": [
    {
      "id": "content-uuid",
      "disc_master": { "brand": "Innova", "model": "Destroyer", ... },
      "notes": "Original disc notes",
      "weight": 175.0,
      "condition": "good", 
      "plastic_type": "Champion",
      "color": "Red",
      "speed": 12, // Custom or fallback flight numbers
      "glide": 5,
      "turn": -1, 
      "fade": 3,
      "brand": "Custom Brand", // Custom or fallback names
      "model": "Custom Model",
      "lost_notes": "prospect park hole 12",
      "lost_at": "2024-01-15T14:30:00Z",
      "updated_at": "2024-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

**Rationale**: Users need a dedicated view of all their lost discs to:
- **Review lost inventory**: See what discs they've lost over time
- **Manage recovery**: Find discs to mark as found when recovered
- **Track loss patterns**: Understand where/when they lose discs most often
- **Bulk management**: Potentially mark multiple discs as found from one view

### Step 13: Remove Disc from Account Service ✅ COMPLETED
- [x] `services/bag-contents.remove.service.js` - Complete removal from user's account (permanent deletion)
- [x] `controllers/bag-contents.remove.controller.js` - DELETE endpoint with proper error handling
- [x] Add DELETE `/api/bags/discs/:contentId` route with authentication middleware
- [x] **Comprehensive TDD Implementation**: Full test-driven development with thin slices
  - **Service Tests**: Unit tests covering validation, UUID checking, ownership validation, and successful deletion
  - **Controller Tests**: HTTP response handling, error delegation to errorHandler middleware
  - **Route Tests**: Authentication middleware integration and proper mounting
  - **Integration Tests**: End-to-end API testing with real database operations
- [x] **Security Features**: User ownership validation, UUID format checking, proper error responses
- [x] **Error Handling**: Integration with existing errorHandler middleware for consistent responses
- [x] **Use Cases**: Perfect for accidental additions, sold/traded discs, data cleanup scenarios

**API Usage:**
```javascript
// Remove disc completely from account (permanent deletion)
DELETE /api/bags/discs/:contentId
Authorization: Bearer <token>

// Success Response (200)
{
  "success": true,
  "message": "Disc removed from your account successfully"
}

// Error Responses
// 401 - No authentication
// 404 - Invalid UUID or disc not found/access denied
```

**Key Differences from Mark Lost:**
- **Remove**: Permanent deletion from database (gone forever)
- **Mark Lost**: Keeps in database with `is_lost: true` for recovery tracking

### 🚨 CRITICAL: Fix Hardcoded disc_count After Phase 2 Setup ✅ COMPLETED
**COMPLETED after Step 7 (bag_contents table creation):**
- [x] **Update `services/bags.list.service.js`** - Removed hardcoded `disc_count: 0` and restored proper Prisma include:
  ```javascript
  // Fixed from (Phase 1): disc_count: 0 // HARDCODED - TEMPORARY
  // Now (Phase 2):
  include: {
    _count: { select: { bag_contents: true } }
  }
  // Result: disc_count: bag._count.bag_contents
  ```
- [x] **Update `tests/unit/services/bags.list.service.test.js`** - Restored dynamic disc_count testing with mock data
- [x] **Update `tests/integration/api/bags.list.integration.test.js`** - Integration tests work with real disc counts (0 for empty bags, actual count when discs added)
- [x] **Verify all bag listing functionality works with real disc counts** - Tested and confirmed working

### Step 14: Move Discs Between Bags Service (BULK OPERATIONS + ATOMIC TRANSACTIONS) ✅ COMPLETED
- [x] `services/bag-contents.move.service.js` - **ATOMIC BULK TRANSACTION** with personal data preservation
- [x] `controllers/bag-contents.move.controller.js` - Handle single, multiple, or all disc movements
- [x] Add PUT `/api/bags/discs/move` route for bulk operations
- [x] **Bulk Movement Support**:
  - **Single Disc**: Move one disc by contentId
  - **Multiple Discs**: Move array of contentIds
  - **All Discs**: Move all discs from source bag to target bag
  - **Updated Timestamps**: All moved discs get refreshed `updated_at` timestamp
- [x] **Comprehensive TDD Implementation**: Following thin slice methodology
  - **Service Tests**: Unit tests with comprehensive validation, UUID checking, ownership validation
  - **Controller Tests**: HTTP response handling with proper error delegation
  - **Route Tests**: Authentication middleware integration and endpoint registration
  - **Integration Tests**: End-to-end API testing with real database operations
- [x] **Security Features**: User ownership validation for both source and target bags, UUID format validation
- [x] **Transaction Safety**: Uses Prisma transactions with `transactionClient` for atomicity
- [x] **Error Handling**: Integration with existing errorHandler middleware for consistent responses

**API Usage:**
```javascript
// Move single disc
PUT /api/bags/discs/move
{
  "sourceBagId": "uuid-here",
  "targetBagId": "uuid-here", 
  "contentIds": ["disc-content-id"]
}

// Move multiple discs
PUT /api/bags/discs/move
{
  "sourceBagId": "uuid-here",
  "targetBagId": "uuid-here",
  "contentIds": ["id1", "id2", "id3"]
}

// Move all discs from source to target
PUT /api/bags/discs/move
{
  "sourceBagId": "uuid-here",
  "targetBagId": "uuid-here"
}

// Success Response (200)
{
  "success": true,
  "message": "Discs moved successfully",
  "movedCount": 3
}

// Error Responses
// 401 - No authentication
// 404 - Invalid UUID or bags not found/access denied
```

**Implementation Details:**
- **Service Layer (`bag-contents.move.service.js`)**:
  - Validates required parameters (userId, sourceBagId, targetBagId)
  - UUID format validation for bag IDs using regex pattern
  - User ownership validation for both source and target bags
  - Supports three movement modes based on options.contentIds
  - Updates `updated_at` timestamp during moves
  - Uses database transactions for atomicity with descriptive `transactionClient` naming
- **Controller Layer (`bag-contents.move.controller.js`)**:
  - Handles HTTP requests and responses with proper status codes
  - Delegates business logic to service layer
  - Returns appropriate responses (200 success, 404 not found)
  - Integrates with error handling middleware
- **Route Layer (`bags.routes.js`)**:
  - Added `PUT /api/bags/discs/move` endpoint
  - Includes authentication middleware
  - Follows existing route patterns and conventions
- **Comprehensive Testing**:
  - Unit tests for service with all edge cases and Chance.js test data
  - Controller tests with mocked dependencies and error scenarios
  - Route tests for endpoint registration and authentication
  - Integration tests with real database operations and security validation

### Step 15: Friend Bag Viewing (Phase 3) - Enhanced Friends List + Bag Viewing
**Strategy Pivot**: Enhance existing friends list service first, then add dedicated bag viewing services.

#### Step 15a: Enhanced Friends List Service ✅ COMPLETED
- [x] **Enhance `services/friends.list.service.js`** - Add bag visibility statistics to friends list
- [x] **Update friends list response format** - Include user details and bag stats for better UX
- [x] **Add comprehensive testing** - Update existing tests and add new functionality tests
- [x] **Backward compatibility** - Ensure enhanced service doesn't break existing functionality

**Enhanced Friends List Response Format:**
```javascript
// GET /api/friends
{
  "success": true,
  "friends": [
    {
      "id": 5,
      "username": "disc_master_bob",
      "email": "bob@example.com",
      "friendship": {
        "id": 2,
        "status": "accepted",
        "created_at": "2025-06-22T23:14:06.055Z"
      },
      "bag_stats": {
        "total_bags": 3,
        "visible_bags": 2,  // friends-visible + public
        "public_bags": 1
      }
    }
  ]
}
```

#### Step 15b: Dedicated Friend Bag Services ✅ COMPLETED
- [x] **15b1: Friend Bag List Service** ✅ COMPLETED (TDD implementation)
  - [x] `services/bags.friends.list.service.js` - Show specific friend's visible bags with disc counts
  - [x] `controllers/bags.friends.list.controller.js` - GET /api/bags/friends/:friendUserId
  - [x] Unit tests: friendship validation, privacy enforcement, disc count inclusion
  - [x] Integration tests: authentication, authorization, edge cases
  - [x] Route mounting: Added to bags.routes.js with authentication middleware
  - [x] **Full TDD implementation**: Service → Controller → Routes → Integration tests
  - [x] **Security features**: Bidirectional friendship validation, privacy level enforcement
  - [x] **API endpoint**: `GET /api/bags/friends/:friendUserId` returns friend's visible bags with disc counts
- [x] **15b2: Friend Bag Get Service** ✅ COMPLETED (TDD implementation)
  - [x] `services/bags.friends.get.service.js` - Show specific friend's bag contents (including personal data)
  - [x] `controllers/bags.friends.get.controller.js` - GET /api/bags/friends/:friendUserId/:bagId
  - [x] Unit tests: friendship validation, bag visibility, content filtering (hide lost discs)
  - [x] Integration tests: end-to-end API testing with real bag contents and personal data
  - [x] Route mounting: Add GET /api/bags/friends/:friendUserId/:bagId endpoint
  - [x] **Enhanced content display**: Show friend's disc personal data (notes, condition, custom flight numbers, custom names)
  - [x] **Data transformation**: Custom flight numbers and brand/model with disc_master fallbacks
  - [x] **Security validation**: User ownership, friendship verification, bag visibility enforcement

**Benefits of This Approach:**
- **Better UX**: Frontend knows which friends have viewable bags before making additional calls
- **Efficient Discovery**: One API call shows all friends with their bag availability
- **Backwards Compatible**: Enhanced existing endpoint instead of replacing it
- **Informative**: Shows public vs friends-only bag counts for UI decision making
- **Two-Phase Implementation**: Enhanced list first, then dedicated bag viewing services

---

## Friend Bag Viewing Strategy

### Privacy & Access Control

**Bag Visibility Levels:**
1. **Private** (`is_public: false, is_friends_visible: false`): Only owner can see
2. **Friends Only** (`is_public: false, is_friends_visible: true`): Owner + accepted friends can see
3. **Public** (`is_public: true`): Anyone can see (overrides friends setting)

### Friend Validation Logic

```javascript
// services/bags.friends.list.service.js
const listFriendBagsService = async (userId, friendUserId) => {
  // 1. Verify friendship exists and is accepted
  const friendship = await prisma.friendship_requests.findFirst({
    where: {
      OR: [
        { 
          requester_id: userId, 
          recipient_id: friendUserId, 
          status: 'accepted' 
        },
        { 
          requester_id: friendUserId, 
          recipient_id: userId, 
          status: 'accepted' 
        }
      ]
    }
  });
  
  if (!friendship) {
    const error = new Error('You are not friends with this user');
    error.name = 'AuthorizationError';
    throw error;
  }
  
  // 2. Get friend's bags that are visible to friends or public
  const bags = await prisma.bags.findMany({
    where: {
      user_id: friendUserId,
      OR: [
        { is_public: true },
        { is_friends_visible: true }
      ]
    },
    include: {
      _count: {
        select: { bag_contents: true }
      }
    }
  });
  
  return {
    friend: { id: friendUserId },
    bags: bags.map(bag => ({
      ...bag,
      disc_count: bag._count.bag_contents
    }))
  };
};
```

### Friend Bag Services

#### Files to Create (Phase 3)
- `services/bags.friends.list.service.js`
- `services/bags.friends.get.service.js`
- `controllers/bags.friends.list.controller.js`
- `controllers/bags.friends.get.controller.js`
- `tests/integration/api/bags.friends.integration.test.js`

---

## Atomic Disc Movement Strategy

### Concurrency Requirements for Disc Movement

**Critical Constraints:**
- Disc must be removed from source bag AND added to target bag atomically
- If either operation fails, entire transaction must rollback
- Prevent race conditions where disc could be "lost" or "duplicated"
- Validate user owns both bags before starting transaction

### Bulk Move Disc Service Implementation Strategy

```javascript
// services/bag-contents.move.service.js
const moveDiscsService = async (userId, moveRequest, prismaClient = prisma) => {
  return await prismaClient.$transaction(async (tx) => {
    // 1. Determine which discs to move
    let discsToMove = [];
    
    if (moveRequest.content_ids) {
      // Specific discs by ID
      discsToMove = await tx.bag_contents.findMany({
        where: {
          id: { in: moveRequest.content_ids },
          user_id: userId  // Security: User must own all discs
        },
        include: { disc_master: true }
      });
    } else if (moveRequest.move_all && moveRequest.from_bag_id) {
      // All discs from source bag
      discsToMove = await tx.bag_contents.findMany({
        where: {
          bag_id: moveRequest.from_bag_id,
          user_id: userId,  // Security: User must own source bag
          is_lost: false   // Don't move lost discs
        },
        include: { disc_master: true }
      });
    } else if (moveRequest.filter && moveRequest.from_bag_id) {
      // Filtered discs from source bag
      const whereClause = {
        bag_id: moveRequest.from_bag_id,
        user_id: userId,
        is_lost: false
      };
      
      // Apply filters
      if (moveRequest.filter.condition) {
        whereClause.condition = moveRequest.filter.condition;
      }
      if (moveRequest.filter.disc_type === 'driver') {
        whereClause.OR = [
          { speed: { gte: 10 } },
          { disc_master: { speed: { gte: 10 } } }
        ];
      }
      
      discsToMove = await tx.bag_contents.findMany({
        where: whereClause,
        include: { disc_master: true }
      });
    }
    
    if (discsToMove.length === 0) {
      throw new Error('No discs found to move');
    }
    
    // 2. Validate target bag ownership
    const targetBag = await tx.bags.findFirst({
      where: { 
        id: moveRequest.to_bag_id,
        user_id: userId
      }
    });
    
    if (!targetBag) {
      throw new Error('Target bag not found or access denied');
    }
    
    // 3. Create new content records in target bag (BULK)
    const newContentData = discsToMove.map(disc => ({
      bag_id: moveRequest.to_bag_id,
      disc_id: disc.disc_id,
      user_id: userId,
      notes: moveRequest.update_data?.notes || disc.notes,
      weight: moveRequest.update_data?.weight || disc.weight,
      condition: moveRequest.update_data?.condition || disc.condition,
      plastic_type: moveRequest.update_data?.plastic_type || disc.plastic_type,
      color: moveRequest.update_data?.color || disc.color,
      speed: moveRequest.update_data?.speed || disc.speed,
      glide: moveRequest.update_data?.glide || disc.glide,
      turn: moveRequest.update_data?.turn || disc.turn,
      fade: moveRequest.update_data?.fade || disc.fade,
      brand: moveRequest.update_data?.brand || disc.brand,
      model: moveRequest.update_data?.model || disc.model,
      is_lost: false
    }));
    
    const newContents = await tx.bag_contents.createMany({
      data: newContentData
    });
    
    // 4. Delete original content records (BULK)
    await tx.bag_contents.deleteMany({
      where: {
        id: { in: discsToMove.map(d => d.id) }
      }
    });
    
    // 5. Return detailed results
    return {
      moved_count: discsToMove.length,
      moved_discs: discsToMove.map((originalDisc, index) => ({
        old_content_id: originalDisc.id,
        disc: originalDisc.disc_master,
        notes: newContentData[index].notes,
        condition: newContentData[index].condition,
        // ... other updated fields
      })),
      from_bag_id: discsToMove[0]?.bag_id || moveRequest.from_bag_id,
      to_bag_id: moveRequest.to_bag_id
    };
  });
};
```

### Move Disc Endpoint
```javascript
// POST /api/bags/discs/:contentId/move
// Body: { "to_bag_id": "uuid", "notes": "optional", "condition": "optional" }
```

### Move Disc Integration Tests Strategy

```javascript
// tests/integration/api/bags.movedisc.integration.test.js

describe('POST /api/bags/discs/:contentId/move', () => {
  test('should move disc between bags atomically', async () => {
    // Create two bags
    // Add disc to bag A
    // Move disc from bag A to bag B
    // Verify disc is in bag B
    // Verify disc is NOT in bag A
    // Verify disc count is correct in both bags
  });
  
  test('should fail if user does not own source bag', async () => {
    // Create bag A owned by user 1
    // Create bag B owned by user 2
    // Try to move disc from A to B as user 2
    // Should fail with 403
  });
  
  test('should fail if user does not own target bag', async () => {
    // Create bag A owned by user 1
    // Create bag B owned by user 2
    // Try to move disc from A to B as user 1
    // Should fail with 403
  });
  
  test('should handle concurrent move attempts gracefully', async () => {
    // Create two bags
    // Add disc to bag A
    // Attempt simultaneous moves of same disc
    // One should succeed, one should fail
    // Verify disc only exists in one bag
  });
  
  test('should rollback if target bag creation fails', async () => {
    // Simulate failure during new content creation
    // Verify disc still exists in original bag
    // Verify no partial state
  });
});
```

### Friend Bag Integration Tests Strategy

```javascript
// tests/integration/api/bags.friends.integration.test.js

describe('Friend Bag Viewing', () => {
  test('should allow friends to view friends-visible bags', async () => {
    // Create two users
    // Send friend request and accept
    // Create bag with is_friends_visible: true
    // Friend should be able to view bag
  });
  
  test('should not allow non-friends to view friends-visible bags', async () => {
    // Create two users (not friends)
    // Create bag with is_friends_visible: true
    // Non-friend should get 403 error
  });
  
  test('should allow anyone to view public bags', async () => {
    // Create user and bag with is_public: true
    // Any authenticated user should be able to view
  });
  
  test('should not show private bags to friends', async () => {
    // Create friends
    // Create private bag (is_public: false, is_friends_visible: false)
    // Friend should not see it in bag list
  });
  
  test('should handle friendship status changes', async () => {
    // Create friends and friend-visible bag
    // Friend can initially view bag
    // Remove friendship
    // Friend should no longer be able to view bag
  });
});
```

### Breadcrumbs for Move Functionality

**Step 11 Detailed Breakdown:**

11a. **Design Transaction Logic**
- [ ] Map out exact Prisma transaction steps
- [ ] Identify all failure points
- [ ] Design rollback scenarios

11b. **Implement Atomic Service**
- [ ] `services/bags.movedisc.service.js`
- [ ] Use Prisma `$transaction()` for atomicity
- [ ] Validate ownership of both bags
- [ ] Handle all error cases gracefully

11c. **Create Move Controller**
- [ ] `controllers/bags.movedisc.controller.js`
- [ ] Extract `contentId` and `to_bag_id` from request
- [ ] Call move service with proper error handling

11d. **Add Move Route**
- [ ] Add POST route: `/discs/:contentId/move`
- [ ] Include authentication middleware
- [ ] Mount in bags router

11e. **Comprehensive Concurrency Testing**
- [ ] Test basic move functionality
- [ ] Test ownership validation
- [ ] Test concurrent access scenarios
- [ ] Test transaction rollback scenarios
- [ ] Test with non-existent bags/discs

11f. **Performance Testing**
- [ ] Test move operation under load
- [ ] Verify transaction isolation
- [ ] Monitor for deadlocks

### Breadcrumbs for Friend Viewing Functionality

**Step 12 Detailed Breakdown:**

12a. **Implement Friend Bag List Service**
- [ ] `services/bags.friends.list.service.js`
- [ ] Validate friendship using existing friendship_requests table
- [ ] Filter bags by visibility settings
- [ ] Include disc counts

12b. **Implement Friend Bag Get Service**
- [ ] `services/bags.friends.get.service.js`
- [ ] Validate friendship and bag visibility
- [ ] Include full bag contents
- [ ] Proper error handling for access denied

12c. **Create Friend Bag Controllers**
- [ ] `controllers/bags.friends.list.controller.js`
- [ ] `controllers/bags.friends.get.controller.js`
- [ ] Extract friendUserId from URL params
- [ ] Handle authentication and authorization

12d. **Add Friend Bag Routes**
- [ ] Add GET route: `/friends/:friendUserId`
- [ ] Add GET route: `/friends/:friendUserId/:bagId`
- [ ] Include authentication middleware
- [ ] Mount in bags router

12e. **Comprehensive Friend Access Testing**
- [ ] Test friendship validation
- [ ] Test privacy level enforcement
- [ ] Test friendship status changes
- [ ] Test edge cases (deleted users, etc.)

---

## Error Handling

### Common Error Responses
```json
// 400 - Validation Error
{
  "success": false,
  "message": "Bag name is required"
}

// 401 - Unauthorized
{
  "success": false,
  "message": "Access token required"
}

// 403 - Forbidden
{
  "success": false,
  "message": "You can only access your own bags"
}

// 403 - Friend Access Denied
{
  "success": false,
  "message": "You are not friends with this user"
}

// 404 - Not Found
{
  "success": false,
  "message": "Bag not found"
}

// 409 - Conflict (for move operations)
{
  "success": false,
  "message": "Disc is currently being moved by another operation"
}
```

---

## Validation Rules

### Create/Update Bag
- `name`: Required, 1-100 characters, unique per user
- `description`: Optional, max 500 characters
- `is_public`: Boolean, defaults to false
- `is_friends_visible`: Boolean, defaults to false

### Add/Edit Disc Content
- `disc_id`: Required, must exist in disc_master and be approved
- `notes`: Optional, max 255 characters
- `weight`: Optional, decimal 1-300 grams
- `condition`: Optional, enum: ['new', 'good', 'worn', 'beat-in']
- `plastic_type`: Optional, max 50 characters (e.g., "Champion", "Star", "DX")
- `color`: Optional, max 50 characters (e.g., "Red", "Blue", "Orange")
- `is_lost`: Boolean, defaults to false

### Move Disc
- `to_bag_id`: Required, must be owned by the same user
- All personal data fields can be updated during move (notes, weight, condition, plastic_type, color)

### Friend Access
- `friendUserId`: Required, must be a valid user ID
- Must have accepted friendship to view friends-visible bags
- Public bags viewable by any authenticated user

---

## Testing Strategy

### Integration Tests Per Endpoint
1. **Authentication**: All endpoints require valid token
2. **Authorization**: Users can only access their own bags or permitted friend bags
3. **Validation**: Test required fields and data types
4. **CRUD Operations**: Full create, read, update, delete cycle
5. **Concurrency**: Atomic disc movement operations
6. **Friend Access**: Privacy levels and friendship validation
7. **Edge Cases**: Non-existent bags, invalid IDs, race conditions, friendship changes

### Test Data Isolation
- Use unique test data per test file (like `discs.approve` pattern)
- Clean up test bags in `afterEach`
- Use test-specific bag names/descriptions
- Clean up friendship_requests between test users

---

## Current Status: Bag Create Endpoint Complete ✅

**✅ COMPLETED:** Bag CRUD Operations (Phase 1)
- **Create Bag Service**: Full implementation with validation, security, and comprehensive testing
- **List Bags Service**: Service with pagination, filtering, and disc count integration  
- **Get Single Bag Service**: Service with ownership validation and UUID format checking
- **Update Bag Service**: Service with partial updates, validation, and atomic operations
- **Delete Bag Service**: Service with atomic deletion and user ownership validation
- All services include comprehensive unit tests and integration tests
- All routes properly mounted with authentication middleware
- Full error handling with proper HTTP status codes and consistent response patterns
- Ready for deployment

**✅ COMPLETED:** Phase 2 Foundation - Bag Contents Management

**Enhanced Schema Implemented:** bag_contents table created with plastic_type, color, is_lost fields for comprehensive disc management with personal data tracking and loss prevention.

**✅ COMPLETED:** Add Disc to Bag Service with full security validation including pending disc ownership checks

**✅ COMPLETED:** Step 12 - Mark Disc as Lost/Found Service with Enhanced Bag Management
- **Lost Disc Tracking**: Database migration V16 with `lost_notes` and `lost_at` fields
- **Bag Management**: Lost discs removed from bags (`bag_id: null`), found discs require target bag assignment
- **Enhanced Security**: User ownership validation for both disc content and target bags
- **Comprehensive Testing**: Full TDD implementation with unit and integration tests
- **API Endpoint**: PATCH `/api/bags/discs/:contentId/lost` with proper validation and error handling

**✅ COMPLETED:** Step 12b - List Lost Discs Service with Pagination & Data Merging
- **Lost Disc Listing**: GET `/api/bags/lost-discs` endpoint with comprehensive filtering and sorting
- **Fixed Pagination Logic**: Corrected total count calculation and has_more logic (was showing incorrect values)
- **Data Merging**: Custom flight numbers and brand/model with disc_master fallbacks
- **Security**: User ownership validation ensures users only see their own lost discs
- **Comprehensive Testing**: Unit and integration tests with proper pagination validation
- **Bug Fixes**: Fixed pagination issues where has_more showed true when limit=total, now correctly calculates based on actual total count

**🎯 CURRENT STATUS:** Step 15b2 - Friend Bag Get Service ✅ COMPLETED

### **Latest Accomplishment: Step 15b2 - Friend Bag Get Service** ✅ COMPLETED
**API Endpoint:** `GET /api/bags/friends/:friendUserId/:bagId`

**What We Built:**
- **Service Layer**: Complete friendship validation, bag visibility enforcement, and content retrieval with personal data
- **Controller Layer**: Parameter validation (friendUserId integer + bagId UUID), service delegation, proper error handling
- **Routes Layer**: Authentication middleware integration, endpoint mounting in bags.routes.js with route testing
- **Comprehensive Testing**: Unit tests, controller tests, route tests, and integration tests covering all scenarios

**Key Features Implemented:**
- **Bidirectional Friendship Validation**: Either user can be requester/recipient in friendship table
- **Bag Visibility Enforcement**: Only returns public OR friends-visible bags (private bags return 403)
- **Content Filtering**: Excludes lost discs (is_lost: false) from friend's view
- **Personal Data Display**: Shows friend's notes, condition, plastic type, color, weight
- **Custom Data Merging**: Custom flight numbers and brand/model with disc_master fallbacks
- **Security**: User ownership validation, UUID format checking, authentication requirements
- **Error Handling**: ValidationError, AuthorizationError with proper HTTP status codes

**API Response Example:**
```javascript
GET /api/bags/friends/123/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>

{
  "success": true,
  "friend": { "id": 123 },
  "bag": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Bob's Tournament Setup",
    "description": "What I throw in tournaments",
    "is_friends_visible": true,
    "created_at": "2025-07-16T10:00:00Z",
    "contents": [
      {
        "id": "content-uuid",
        "disc": { "brand": "Innova", "model": "Destroyer", "speed": 12, "glide": 5, "turn": -1, "fade": 3 },
        "notes": "Champion plastic, red",
        "weight": 175.0,
        "condition": "good",
        "plastic_type": "Champion",
        "color": "Red",
        "speed": 13, // Custom override
        "brand": "Custom Brand", // Custom override
        "model": "Custom Model", // Custom override
        "added_at": "2025-07-16T10:30:00Z"
      }
    ]
  }
}
```

**🎉 PHASE 3 COMPLETE: Friend Bag Viewing Functionality**
- ✅ Enhanced friends list with bag statistics
- ✅ Friend bag listing with disc counts  
- ✅ Friend bag detailed view with personal data

### **Step 15b2 Planning: Friend Bag Get Service**
**Goal**: Allow users to view the contents of a specific friend's bag, including personal data

**API Endpoint**: `GET /api/bags/friends/:friendUserId/:bagId`

**Expected Response Format:**
```javascript
{
  "success": true,
  "friend": { "id": 123, "username": "disc_master_bob" },
  "bag": {
    "id": "bag-uuid",
    "name": "Bob's Tournament Setup", 
    "description": "What I throw in tournaments",
    "is_friends_visible": true,
    "created_at": "2025-06-28T09:00:00Z",
    "contents": [
      {
        "id": "content-uuid-1",
        "disc": {
          "id": "disc-uuid-1", 
          "brand": "Innova",
          "model": "Destroyer",
          "speed": 12, "glide": 5, "turn": -1, "fade": 3
        },
        "notes": "Champion plastic, red",
        "weight": 175.0,
        "condition": "good",
        "plastic_type": "Champion",
        "color": "Red",
        "added_at": "2025-06-28T09:30:00Z"
      }
    ]
  }
}
```

**Key Implementation Considerations:**
- **Reuse existing friendship validation** from Step 15b1
- **Reuse existing bag visibility logic** (public OR friends-visible)
- **Filter out lost discs** (is_lost: false) 
- **Include personal data**: notes, condition, custom flight numbers, custom brand/model
- **Security**: Validate user is friends with bag owner AND bag is visible to friends
- **Performance**: Single query with joins to get bag + contents + disc_master data

**TDD Implementation Plan:**
1. **Service layer**: `bags.friends.get.service.js` (friendship + bag visibility + content filtering)
2. **Controller layer**: `bags.friends.get.controller.js` (parameter validation + service delegation) 
3. **Route integration**: Add to bags.routes.js with authentication
4. **Integration tests**: Full end-to-end testing with real friendship and bag data

This plan ensures robust disc movement with proper concurrency handling, friend access controls, and privacy management while building incrementally from basic bag management.

---

## 🔧 Technical Debt & Refactoring Notes

### Prisma Pattern Inconsistency - REQUIRES STANDARDIZATION

**Issue**: Services use inconsistent Prisma injection patterns across the codebase.

**Current Patterns Found:**
1. **Modern Pattern** (bag-contents services): `import prisma from '../lib/prisma.js'` + `prismaClient = prisma` parameter for testing
2. **Legacy Pattern** (discs.approve.service): `import { PrismaClient } from '@prisma/client'` + `const prisma = new PrismaClient()` (not testable)

**Recommended Standard**: Use the modern pattern for all services:
```javascript
import prisma from '../lib/prisma.js';
const myService = async (param1, param2, prismaClient = prisma) => { ... };
```

**Benefits of Standard Pattern:**
- Centralized connection management
- Testable with mock injection
- Resource efficient (no multiple connections)
- Consistent across codebase

**TODO - Refactoring Required:**
- [ ] Audit all service files for Prisma usage patterns
- [ ] Convert `discs.approve.service.js` and similar files to use standard pattern
- [ ] Update associated tests to use prismaClient parameter injection
- [ ] Document the standard in project guidelines
- [ ] Ensure all future services follow the standard pattern

**Priority**: Medium (technical debt cleanup)