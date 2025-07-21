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

/**
 * Generate globally unique identifiers for integration tests
 * This ensures no conflicts between parallel test executions
 */
export function createGloballyUniqueId(prefix = 'test') {
  const timestamp = Date.now();
  const pid = process.pid.toString().slice(-4); // Last 4 digits of process ID
  const random = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' });

  return {
    // Short ID for usernames (keeping under 20 chars limit)
    shortId: `${prefix}${timestamp.toString().slice(-8)}${pid}`,
    // Full ID for emails, course names, etc.
    fullId: `${prefix}${timestamp}${pid}${random}`,
    // Just the timestamp + pid + random for appending
    suffix: `${timestamp}${pid}${random}`,
    // Raw values for custom formatting
    timestamp,
    pid,
    random,
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
