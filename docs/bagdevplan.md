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

**`002_create_bag_contents_table.sql`** *(for later)*
```sql
CREATE TABLE bag_contents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bag_id UUID NOT NULL,
  disc_id UUID NOT NULL,
  notes VARCHAR(255),
  weight DECIMAL(4,1),
  condition VARCHAR(20) DEFAULT 'good',
  added_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (bag_id) REFERENCES bags(id) ON DELETE CASCADE,
  FOREIGN KEY (disc_id) REFERENCES disc_master(id) ON DELETE CASCADE
);

CREATE INDEX idx_bag_contents_bag_id ON bag_contents(bag_id);
CREATE INDEX idx_bag_contents_disc_id ON bag_contents(disc_id);
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
  id         String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  bag_id     String      @db.Uuid
  disc_id    String      @db.Uuid
  notes      String?     @db.VarChar(255)
  weight     Decimal?    @db.Decimal(4,1)
  condition  String?     @default("good") @db.VarChar(20)
  added_at   DateTime?   @default(now()) @db.Timestamp(6)
  bags       bags        @relation(fields: [bag_id], references: [id], onDelete: Cascade)
  disc_master disc_master @relation(fields: [disc_id], references: [id], onDelete: Cascade)

  @@index([bag_id], map: "idx_bag_contents_bag_id")
  @@index([disc_id], map: "idx_bag_contents_disc_id")
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
router.post('/:id/discs', authenticateToken, bagsAddDiscController);      // Add disc to bag
router.delete('/:id/discs/:contentId', authenticateToken, bagsRemoveDiscController); // Remove disc from bag

// Phase 2: Disc Movement (ATOMIC OPERATIONS)
router.post('/discs/:contentId/move', authenticateToken, bagsMoveDiscController);  // Move disc between bags

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

// Response (200) - Phase 2 (with contents)
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
        "notes": "Champion plastic, blue",
        "weight": 175.0,
        "condition": "new",
        "added_at": "2025-06-28T10:00:00Z"
      }
    ]
  }
}
```

**POST `/api/bags/discs/:contentId/move`** - Move Disc Between Bags (Phase 2)
```json
// Request
{
  "to_bag_id": "target-bag-uuid",
  "notes": "Updated notes for new bag",
  "condition": "good"
}

// Response (200)
{
  "success": true,
  "moved_disc": {
    "id": "new-content-uuid",
    "bag_id": "target-bag-uuid",
    "disc": {
      "id": "disc-uuid",
      "brand": "Innova",
      "model": "Destroyer"
    },
    "notes": "Updated notes for new bag",
    "condition": "good",
    "added_at": "2025-06-28T11:00:00Z"
  },
  "from_bag_id": "source-bag-uuid",
  "to_bag_id": "target-bag-uuid"
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

### Step 3: List Bags Service
- [ ] `services/bags.list.service.js`
- [ ] `controllers/bags.list.controller.js`
- [ ] Add route
- [ ] Test

### Step 4: Get Single Bag Service
- [ ] `services/bags.get.service.js`
- [ ] `controllers/bags.get.controller.js`
- [ ] Add route
- [ ] Test

### Step 5: Update Bag Service
- [ ] `services/bags.update.service.js`
- [ ] `controllers/bags.update.controller.js`
- [ ] Add route
- [ ] Test

### Step 6: Delete Bag Service
- [ ] `services/bags.delete.service.js`
- [ ] `controllers/bags.delete.controller.js`
- [ ] Add route
- [ ] Test

### Step 7: Phase 2 Database Setup
- [ ] Create migration file `002_create_bag_contents_table.sql`
- [ ] Update `schema.prisma` with bag_contents model and relations
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Generate Prisma client: `npx prisma generate`

### Step 8: Add Disc to Bag Service
- [ ] `services/bags.adddisc.service.js`
- [ ] `controllers/bags.adddisc.controller.js`
- [ ] Add route
- [ ] Test

### Step 9: Remove Disc from Bag Service
- [ ] `services/bags.removedisc.service.js`
- [ ] `controllers/bags.removedisc.controller.js`
- [ ] Add route
- [ ] Test

### Step 10: Update Bag Get Service (with contents)
- [ ] Modify `services/bags.get.service.js` to include bag contents
- [ ] Update integration tests
- [ ] Test with populated bags

### 🚨 CRITICAL: Fix Hardcoded disc_count After Phase 2 Setup
**MUST DO after Step 7 (bag_contents table creation):**
- [ ] **Update `services/bags.list.service.js`** - Remove hardcoded `disc_count: 0` and restore proper Prisma include:
  ```javascript
  // Current (Phase 1): disc_count: 0 // HARDCODED - TEMPORARY
  // Fix to (Phase 2):
  include: {
    _count: { select: { bag_contents: true } }
  }
  // Then: disc_count: bag._count.bag_contents
  ```
- [ ] **Update `tests/unit/services/bags.list.service.test.js`** - Restore dynamic disc_count testing with mock data
- [ ] **Update `tests/integration/api/bags.list.integration.test.js`** - Test actual disc counts with real bag contents
- [ ] **Verify all bag listing functionality works with real disc counts**

### Step 11: Move Disc Between Bags Service (CRITICAL CONCURRENCY)
- [ ] `services/bags.movedisc.service.js` - **ATOMIC TRANSACTION**
- [ ] `controllers/bags.movedisc.controller.js`
- [ ] Add route
- [ ] **Comprehensive concurrency tests**

### Step 12: Friend Bag Viewing (Phase 3)
- [ ] `services/bags.friends.list.service.js`
- [ ] `services/bags.friends.get.service.js`
- [ ] `controllers/bags.friends.list.controller.js`
- [ ] `controllers/bags.friends.get.controller.js`
- [ ] Add friend bag routes
- [ ] **Comprehensive friendship validation tests**

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

### Move Disc Service Implementation Strategy

```javascript
// services/bags.movedisc.service.js
const moveDiscService = async (userId, contentId, targetBagId, updateData) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Get the current bag content with user validation
    const currentContent = await tx.bag_contents.findFirst({
      where: { 
        id: contentId,
        bags: { user_id: userId }  // Ensure user owns source bag
      },
      include: { bags: true }
    });
    
    if (!currentContent) {
      throw new Error('Disc not found or access denied');
    }
    
    // 2. Validate target bag ownership
    const targetBag = await tx.bags.findFirst({
      where: { 
        id: targetBagId,
        user_id: userId  // Ensure user owns target bag
      }
    });
    
    if (!targetBag) {
      throw new Error('Target bag not found or access denied');
    }
    
    // 3. Create new content in target bag
    const newContent = await tx.bag_contents.create({
      data: {
        bag_id: targetBagId,
        disc_id: currentContent.disc_id,
        notes: updateData.notes || currentContent.notes,
        weight: updateData.weight || currentContent.weight,
        condition: updateData.condition || currentContent.condition,
      },
      include: {
        disc_master: true,
        bags: true
      }
    });
    
    // 4. Delete from source bag
    await tx.bag_contents.delete({
      where: { id: contentId }
    });
    
    // 5. Return move result
    return {
      moved_disc: newContent,
      from_bag_id: currentContent.bag_id,
      to_bag_id: targetBagId
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

### Add/Move Disc
- `disc_id`: Required, must exist in disc_master and be approved
- `notes`: Optional, max 255 characters
- `weight`: Optional, decimal 1-300 grams
- `condition`: Optional, enum: ['new', 'good', 'worn', 'beat-in']

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

**✅ COMPLETED:** Bag create functionality is fully implemented and tested
- Service layer with comprehensive validation
- Controller with proper error handling  
- Routes properly mounted in server.js
- Integration tests with 100% coverage of validation scenarios
- Ready for deployment

**🎯 NEXT STEPS:** Implement remaining CRUD operations

**Next file to create:** `services/bags.list.service.js` (Step 3)

This plan ensures robust disc movement with proper concurrency handling, friend access controls, and privacy management while building incrementally from basic bag management.