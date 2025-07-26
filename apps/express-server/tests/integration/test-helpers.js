import Chance from 'chance';

const chance = new Chance();

// Valid US states that pass the courses.submit.service validation
const VALID_US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

// Global counter for additional uniqueness in parallel tests
let globalTestCounter = 0;

/**
 * Generate globally unique identifiers for integration tests
 * This ensures no conflicts between parallel test executions
 */
export function createGloballyUniqueId(prefix = 'test') {
  const timestamp = Date.now();
  const pid = process.pid.toString().slice(-4); // Last 4 digits of process ID
  const random = chance.string({ length: 6, pool: 'abcdefghijklmnopqrstuvwxyz' }); // Longer random string
  // High-resolution time for extra uniqueness
  const microtime = process.hrtime.bigint().toString().slice(-6);
  // Global counter for absolute uniqueness within same process
  globalTestCounter += 1;
  const counter = globalTestCounter.toString().padStart(3, '0');

  return {
    // Short ID for usernames (keeping under 20 chars limit)
    shortId: `${prefix}${timestamp.toString().slice(-4)}${pid}${counter}`,
    // Full ID for emails, course names, etc.
    fullId: `${prefix}${timestamp}${pid}${microtime}${counter}${random}`,
    // Just the timestamp + pid + random for appending
    suffix: `${timestamp}${pid}${microtime}${counter}${random}`,
    // Raw values for custom formatting
    timestamp,
    pid,
    random,
    microtime,
    counter,
  };
}

/**
 * Create unique user data for registration that passes auth.register.service validation
 */
export function createUniqueUserData(prefix = 'test') {
  const ids = createGloballyUniqueId(prefix);

  // Ensure username is 4-20 characters as required by auth.register.service
  let username = ids.shortId;
  if (username.length > 20) {
    username = username.substring(0, 20);
  }
  if (username.length < 4) {
    username = username.padEnd(4, '0');
  }

  // Password must have uppercase, lowercase, number, and special character
  // and be 8-32 characters as required by auth.register.service
  const password = `Test1!${chance.word({ length: 2 })}`;

  return {
    username,
    email: `${ids.fullId}@ex.co`,
    password,
    ids, // Include the IDs for further use
  };
}

/**
 * Create unique course data that passes courses.submit.service validation
 */
export function createUniqueCourseData(prefix = 'testcourse') {
  const ids = createGloballyUniqueId(prefix);

  return {
    name: `${prefix} Course ${ids.suffix}`,
    city: chance.city(),
    stateProvince: chance.pickone(VALID_US_STATES), // Use only valid US states
    country: 'US',
    holeCount: chance.integer({ min: 9, max: 27 }),
    ids,
  };
}

/**
 * Create unique round data (requires courseId)
 */
export function createUniqueRoundData(courseId, maxHoles = 18, prefix = 'testround') {
  const ids = createGloballyUniqueId(prefix);

  return {
    courseId,
    name: `${prefix} Round ${ids.suffix}`,
    startingHole: chance.integer({ min: 1, max: Math.min(maxHoles, 18) }),
    isPrivate: chance.bool(),
    skinsEnabled: chance.bool(),
    skinsValue: chance.floating({ min: 1, max: 50, fixed: 2 }),
    ids,
  };
}

/**
 * Create simple unique round data for basic tests (no random startingHole)
 */
export function createSimpleRoundData(courseId, prefix = 'round') {
  const ids = createGloballyUniqueId(prefix);

  return {
    courseId,
    name: `${prefix} ${ids.suffix}`,
    ids,
  };
}

// ===== DATABASE SETUP HELPERS (for Martin Fowler testing pyramid) =====

/**
 * Generate a valid JWT token for testing (avoids auth API calls)
 */
export async function generateTestToken(userId) {
  // Dynamic import for ES modules
  const jwt = await import('jsonwebtoken');
  return jwt.default.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' },
  );
}

/**
 * Create a test user directly in DB (bypasses registration API)
 */
export async function createTestUser(overrides = {}) {
  const { query } = await import('./setup.js');

  const userData = createUniqueUserData(overrides.prefix || 'testuser');
  const passwordHash = '$2b$10$YourHashedPasswordHere'; // Pre-hashed test password

  const result = await query(
    `INSERT INTO users (username, email, password_hash, is_admin) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, username, email, is_admin`,
    [userData.username, userData.email, passwordHash, overrides.isAdmin || false],
  );

  const user = result.rows[0];
  const token = await generateTestToken(user.id);

  return { user, token, userData };
}

/**
 * Create a test course directly in DB (bypasses course API)
 */
export async function createTestCourse(overrides = {}) {
  const { query } = await import('./setup.js');

  const courseData = createUniqueCourseData(overrides.prefix || 'testcourse');

  const result = await query(
    `INSERT INTO courses (id, name, city, state_province, country, hole_count, approved, is_user_submitted, submitted_by_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      overrides.id || chance.guid(),
      courseData.name,
      courseData.city,
      courseData.stateProvince,
      courseData.country,
      courseData.holeCount,
      overrides.approved !== undefined ? overrides.approved : true,
      overrides.isUserSubmitted || false,
      overrides.submittedById || null,
    ],
  );

  return result.rows[0];
}

/**
 * Create a test round with player directly in DB (bypasses round API)
 */
export async function createTestRound(userId, courseId, overrides = {}) {
  const { query } = await import('./setup.js');

  // Validate FK references exist before creating round
  const userExists = await query('SELECT id FROM users WHERE id = $1', [userId]);
  if (userExists.rows.length === 0) {
    throw new Error(`createTestRound: User with id ${userId} does not exist`);
  }

  const courseExists = await query('SELECT id FROM courses WHERE id = $1', [courseId]);
  if (courseExists.rows.length === 0) {
    throw new Error(`createTestRound: Course with id ${courseId} does not exist`);
  }

  const roundData = createSimpleRoundData(courseId, overrides.prefix || 'testround');

  // Create round
  const roundResult = await query(
    `INSERT INTO rounds (created_by_id, course_id, name, starting_hole, is_private, skins_enabled, skins_value, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      userId,
      courseId,
      roundData.name,
      overrides.startingHole || 1,
      overrides.isPrivate || false,
      overrides.skinsEnabled || false,
      overrides.skinsValue || null,
      overrides.status || 'in_progress',
    ],
  );

  const round = roundResult.rows[0];

  // Auto-add creator as player
  const playerResult = await query(
    `INSERT INTO round_players (round_id, user_id, is_guest)
     VALUES ($1, $2, false)
     RETURNING *`,
    [round.id, userId],
  );

  return { round, player: playerResult.rows[0] };
}

/**
 * Add player to round directly in DB
 */
export async function addPlayerToRound(roundId, userId = null, guestName = null) {
  const { query } = await import('./setup.js');

  // Validate FK references exist
  const roundExists = await query('SELECT id FROM rounds WHERE id = $1', [roundId]);
  if (roundExists.rows.length === 0) {
    throw new Error(`addPlayerToRound: Round with id ${roundId} does not exist`);
  }

  if (userId) {
    const userExists = await query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userExists.rows.length === 0) {
      throw new Error(`addPlayerToRound: User with id ${userId} does not exist`);
    }
  }

  const isGuest = !userId;
  const playerResult = await query(
    `INSERT INTO round_players (round_id, user_id, guest_name, is_guest)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [roundId, userId, guestName, isGuest],
  );

  return playerResult.rows[0];
}

/**
 * Create friendship between users directly in DB
 */
export async function createFriendship(userIdA, userIdB) {
  const { query } = await import('./setup.js');

  await query(
    `INSERT INTO friendship_requests (requester_id, recipient_id, status, created_at)
     VALUES ($1, $2, 'accepted', NOW())`,
    [userIdA, userIdB],
  );
}

// ===== CLEANUP HELPERS =====

export async function cleanupRounds(roundIds) {
  if (roundIds.length === 0) return;
  const { query } = await import('./setup.js');

  // Clean up in reverse order of foreign key dependencies
  // Most dependent tables first, rounds table last
  // Use try/catch for each table in case it doesn't exist or data is already deleted
  const cleanupQueries = [
    'DELETE FROM side_bet_participants WHERE side_bet_id IN (SELECT id FROM side_bets WHERE round_id = ANY($1))',
    'DELETE FROM side_bets WHERE round_id = ANY($1)',
    'DELETE FROM scores WHERE round_id = ANY($1)',
    'DELETE FROM round_hole_pars WHERE round_id = ANY($1)',
    'DELETE FROM round_players WHERE round_id = ANY($1)',
    'DELETE FROM rounds WHERE id = ANY($1)',
  ];

  // Clean up sequentially to maintain foreign key constraint order
  // Use reduce to avoid for-of loops while maintaining order
  await cleanupQueries.reduce(async (previousPromise, cleanupQuery) => {
    await previousPromise;
    try {
      await query(cleanupQuery, [roundIds]);
    } catch (error) {
      // Continue - table might not exist or data already deleted
      // This is normal in parallel test execution
    }
  }, Promise.resolve());
}

export async function cleanupCourses(courseIds) {
  if (courseIds.length === 0) return;
  const { query } = await import('./setup.js');
  try {
    await query('DELETE FROM courses WHERE id = ANY($1)', [courseIds]);
  } catch (error) {
    // Course might already be deleted or not exist
  }
}

export async function cleanupUsers(userIds) {
  if (userIds.length === 0) return;
  const { query } = await import('./setup.js');
  try {
    await query('DELETE FROM users WHERE id = ANY($1)', [userIds]);
  } catch (error) {
    // User might already be deleted or not exist
  }
}
