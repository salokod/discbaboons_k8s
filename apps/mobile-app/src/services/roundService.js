/**
 * Round Service
 * Handles API calls for round management operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/environment';
import { getTokens } from './tokenStorage';
import { getCourseById } from './courseService';

/**
 * Validate round name format before sending to API
 * @param {string} name - Round name to validate
 * @throws {Error} Validation error if round name is invalid
 */
function validateRoundName(name) {
  if (!name || typeof name !== 'string') {
    throw new Error('Round name is required');
  }

  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    throw new Error('Round name cannot be empty');
  }

  if (trimmedName.length > 100) {
    throw new Error('Round name must be no more than 100 characters');
  }
}

/**
 * Validate course ID format
 * @param {string} courseId - Course ID to validate
 * @throws {Error} Validation error if course ID is invalid
 */
function validateCourseId(courseId) {
  if (!courseId || typeof courseId !== 'string') {
    throw new Error('Course ID is required');
  }

  const trimmedId = courseId.trim();
  if (trimmedId.length === 0) {
    throw new Error('Course ID is required');
  }
}

/**
 * Get authentication headers with access token
 * @returns {Promise<Object>} Headers object with Authorization
 * @throws {Error} If no access token is available
 */
async function getAuthHeaders() {
  const tokens = await getTokens();

  if (!tokens || !tokens.accessToken) {
    throw new Error('Authentication required. Please log in again.');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokens.accessToken}`,
  };
}

/**
 * Create a new round
 * @param {Object} roundData - Round data (courseId, name, etc.)
 * @returns {Promise<Object>} Created round data
 * @throws {Error} Create round failed error with message
 */
export async function createRound(roundData) {
  // Validate inputs before making API call
  if (!roundData || typeof roundData !== 'object') {
    throw new Error('Round data is required');
  }

  const { courseId, name } = roundData;
  validateCourseId(courseId);
  validateRoundName(name);

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    // Prepare payload for API
    const payload = {
      courseId,
      name: name.trim(),
      // Optional fields can be added later
      startingHole: roundData.startingHole || 1,
      isPrivate: roundData.isPrivate || false,
      skinsEnabled: roundData.skinsEnabled || false,
      skinsValue: roundData.skinsValue || null,
    };

    const response = await fetch(`${API_BASE_URL}/api/rounds`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Authentication required
        throw new Error(data.message || 'Authentication required. Please log in again.');
      }
      if (response.status === 400) {
        // Backend validation errors
        throw new Error(data.message || 'Invalid round data provided');
      }
      if (response.status === 429) {
        // Rate limiting
        throw new Error(data.message || 'Too many requests. Please try again later.');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Handle direct response object (backend returns round object directly)
    if (!data || !data.id) {
      throw new Error('Invalid response from server');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Get user's rounds with pagination
 * @param {Object} params - Query parameters
 * @returns {Promise<{rounds: Array, pagination: Object}>} User's rounds and pagination info
 * @throws {Error} Request failed error with message
 */
export async function getRounds(params = {}) {
  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    // Build query parameters (API supports limit, offset, status)
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.offset !== undefined) queryParams.set('offset', params.offset.toString());
    if (params.status) queryParams.set('status', params.status.toString());

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/api/rounds${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Authentication required
        throw new Error(data.message || 'Authentication required. Please log in again.');
      }
      if (response.status === 400) {
        // Backend validation errors for query parameters
        throw new Error(data.message || 'Invalid request parameters');
      }
      if (response.status === 429) {
        // Rate limiting
        throw new Error(data.message || 'Too many requests. Please try again later.');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format - backend doesn't include 'success' field
    if (!data || !Array.isArray(data.rounds)) {
      throw new Error('Invalid response from server');
    }

    // Backend returns pagination fields at root level, not in a pagination object
    return {
      rounds: data.rounds,
      pagination: {
        total: data.total || data.rounds.length,
        limit: data.limit || 20,
        offset: data.offset || 0,
        hasMore: data.hasMore || false,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Get a single round by ID with details
 * @param {string} roundId - Round ID to retrieve
 * @returns {Promise<Object>} Round data with players and pars
 * @throws {Error} Get round failed error with message
 */
export async function getRoundDetails(roundId) {
  // Validate inputs before making API call
  if (!roundId || typeof roundId !== 'string') {
    throw new Error('Round ID is required');
  }

  const trimmedId = roundId.trim();
  if (trimmedId.length === 0) {
    throw new Error('Round ID is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/rounds/${roundId}`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Authentication required
        throw new Error(data.message || 'Authentication required. Please log in again.');
      }
      if (response.status === 400) {
        // Backend validation errors
        throw new Error(data.message || 'Invalid round ID format');
      }
      if (response.status === 404) {
        // Round not found
        throw new Error(data.message || 'Round not found');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Handle both wrapped and direct response formats
    // Backend can return either { success: true, round: {...} } or direct round object
    let roundData;
    if (data && data.success && data.round) {
      // Wrapped format
      roundData = data.round;
    } else if (data && data.id) {
      // Direct format - backend returns round object directly
      roundData = data;
    } else {
      throw new Error('Invalid response from server');
    }

    // Validate essential fields
    if (!roundData.id) {
      throw new Error('Invalid round data from server');
    }

    // Ensure players is always an array (even if empty)
    if (!roundData.players) {
      roundData.players = [];
    }

    // Ensure pars is always an object (even if empty)
    if (!roundData.pars) {
      roundData.pars = {};
    }

    return roundData;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Get round leaderboard with player standings
 * @param {string} roundId - Round ID to retrieve leaderboard for
 * @returns {Promise<Array>} Leaderboard data with player standings
 * @throws {Error} Get leaderboard failed error with message
 */
export async function getRoundLeaderboard(roundId) {
  // Validate inputs before making API call
  if (!roundId || typeof roundId !== 'string') {
    throw new Error('Round ID is required');
  }

  const trimmedId = roundId.trim();
  if (trimmedId.length === 0) {
    throw new Error('Round ID is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/rounds/${roundId}/leaderboard`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Authentication required
        throw new Error(data.message || 'Authentication required. Please log in again.');
      }
      if (response.status === 400) {
        // Backend validation errors
        throw new Error(data.message || 'Invalid round ID format');
      }
      if (response.status === 404) {
        // Round not found
        throw new Error(data.message || 'Round not found');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format - backend returns { players: [...], roundSettings: {...} }
    if (!data || !Array.isArray(data.players)) {
      throw new Error('Invalid response from server');
    }

    return {
      players: data.players,
      roundSettings: data.roundSettings || {},
    };
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Add players (friends and guests) to a round
 * @param {string} roundId - Round ID
 * @param {Object} players - Players to add
 * @returns {Promise<Object>} Response result
 * @throws {Error} API error or network error
 */
export async function addPlayersToRound(roundId, players) {
  if (!roundId || !roundId.trim()) {
    throw new Error('Round ID is required');
  }

  if (!players || !Array.isArray(players) || players.length === 0) {
    throw new Error('At least one player is required');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/rounds/${roundId}/players`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ players }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to add players: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please check your connection and try again');
    }
    throw error;
  }
}

/**
 * Pause a round
 * @param {string} roundId - Round ID to pause
 * @returns {Promise<Object>} Updated round data
 * @throws {Error} Request failed error with message
 */
export async function pauseRound(roundId) {
  // Validate inputs before making API call
  if (!roundId || typeof roundId !== 'string') {
    throw new Error('Round ID is required');
  }

  const trimmedId = roundId.trim();
  if (trimmedId.length === 0) {
    throw new Error('Round ID is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/rounds/${roundId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status: 'in_progress' }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Authentication required
        throw new Error(data.message || 'Authentication required. Please log in again.');
      }
      if (response.status === 400) {
        // Backend validation errors
        throw new Error(data.message || 'Invalid request');
      }
      if (response.status === 404) {
        // Round not found
        throw new Error(data.message || 'Round not found');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate and unwrap response format - backend returns { success: true, data: {...} }
    if (!data || !data.success || !data.data || !data.data.id) {
      throw new Error('Invalid response from server');
    }

    return data.data;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Complete a round
 * @param {string} roundId - Round ID to complete
 * @returns {Promise<Object>} Updated round data
 * @throws {Error} Request failed error with message
 */
export async function completeRound(roundId) {
  // Validate inputs before making API call
  if (!roundId || typeof roundId !== 'string') {
    throw new Error('Round ID is required');
  }

  const trimmedId = roundId.trim();
  if (trimmedId.length === 0) {
    throw new Error('Round ID is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/rounds/${roundId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status: 'completed' }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Authentication required
        throw new Error(data.message || 'Authentication required. Please log in again.');
      }
      if (response.status === 400) {
        // Backend validation errors
        throw new Error(data.message || 'Invalid request');
      }
      if (response.status === 404) {
        // Round not found
        throw new Error(data.message || 'Round not found');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate and unwrap response format - backend returns { success: true, data: {...} }
    if (!data || !data.success || !data.data || !data.data.id) {
      throw new Error('Invalid response from server');
    }

    return data.data;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Get pars for all holes in a round
 * @param {string} roundId - Round ID to retrieve pars for
 * @returns {Promise<Object>} Pars object with hole numbers as keys
 * @throws {Error} Get pars failed error with message
 */
export async function getRoundPars(roundId) {
  // Validate inputs before making API call
  if (!roundId || typeof roundId !== 'string') {
    throw new Error('Round ID is required');
  }

  const trimmedId = roundId.trim();
  if (trimmedId.length === 0) {
    throw new Error('Round ID is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/rounds/${roundId}/pars`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Authentication required
        throw new Error(data.message || 'Authentication required. Please log in again.');
      }
      if (response.status === 400) {
        // Backend validation errors
        throw new Error(data.message || 'Invalid round ID format');
      }
      if (response.status === 404) {
        // Round not found
        throw new Error(data.message || 'Round not found');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Return pars object directly
    return data || {};
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Helper to decode JWT token payload
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded payload or null if invalid
 */
function decodeJWT(token) {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode base64 payload (second part)
    const payload = parts[1];
    // Replace URL-safe characters
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Decode base64 to string
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join(''),
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

/**
 * Helper to get current user ID from JWT token
 * @returns {Promise<string|null>} Current user ID or null
 */
async function getCurrentUserId() {
  try {
    const tokens = await getTokens();
    if (!tokens?.accessToken) return null;

    const decoded = decodeJWT(tokens.accessToken);
    if (!decoded) return null;

    // Try different common JWT user ID fields
    return decoded.userId || decoded.sub || decoded.user_id || null;
  } catch (error) {
    // Silently fail - return null on any error
    return null;
  }
}

/**
 * Get cached recent courses if fresh (<24h)
 * @returns {Promise<Array|null>} Cached courses or null if not found/stale
 */
async function getCachedRecentCourses() {
  try {
    const cachedData = await AsyncStorage.getItem('recent_courses');
    if (!cachedData) return null;

    const { userId, courses, updated_at: updatedAt } = JSON.parse(cachedData);

    // Check if cache is for current user
    const currentUserId = await getCurrentUserId();
    if (userId !== currentUserId) return null;

    // Check if cache is fresh (<24 hours)
    const cacheAge = Date.now() - new Date(updatedAt).getTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    if (cacheAge > TWENTY_FOUR_HOURS) return null;

    return courses;
  } catch (error) {
    // Return null on any error (invalid JSON, storage error, etc.)
    return null;
  }
}

/**
 * Cache recent courses (non-blocking)
 * @param {Array} courses - Courses to cache
 */
function cacheRecentCourses(courses) {
  // Use setTimeout to make it non-blocking
  setTimeout(async () => {
    try {
      const userId = await getCurrentUserId();
      await AsyncStorage.setItem('recent_courses', JSON.stringify({
        userId,
        courses,
        updated_at: new Date().toISOString(),
      }));
    } catch (error) {
      // Silently fail - caching is not critical
    }
  }, 0);
}

/**
 * Get recent courses from user's completed rounds
 * Fetches 10 most recent completed rounds, extracts unique courses (up to 5)
 * Caches result in AsyncStorage with 24h TTL
 *
 * @returns {Promise<Array>} Array of recent course objects
 */
export async function getRecentCourses() {
  try {
    // Check cache first
    const cached = await getCachedRecentCourses();
    if (cached) return cached;

    // Fetch 10 recent completed rounds (reduced from 20 for performance)
    const { rounds } = await getRounds({ limit: 10, status: 'completed' });

    // Extract unique course IDs (most recent first)
    const coursesMap = new Map();
    rounds.forEach((round) => {
      if (!coursesMap.has(round.course_id)) {
        coursesMap.set(round.course_id, {
          id: round.course_id,
          last_played_at: round.created_at || round.start_time,
        });
      }
    });

    // Get top 5 unique courses
    const recentCourseIds = Array.from(coursesMap.keys()).slice(0, 5);

    // Fetch course details (use allSettled for resilience)
    const coursePromises = recentCourseIds.map((id) => getCourseById(id));
    const results = await Promise.allSettled(coursePromises);

    const courses = results
      .filter((result) => result.status === 'fulfilled')
      .map((result, index) => ({
        ...result.value,
        last_played_at: Array.from(coursesMap.values())[index].last_played_at,
      }));

    // Cache result (non-blocking)
    cacheRecentCourses(courses);

    return courses;
  } catch (error) {
    // Return empty array on any error - this feature is not critical
    return [];
  }
}

/**
 * Submit scores for a round
 * @param {string} roundId - Round ID to submit scores for
 * @param {Array} scores - Array of score objects {hole, player_id, score}
 * @returns {Promise<Object>} Submit result
 * @throws {Error} Submit scores failed error with message
 */
export async function submitScores(roundId, scores) {
  // Validate inputs before making API call
  if (!roundId || typeof roundId !== 'string') {
    throw new Error('Round ID is required');
  }

  const trimmedId = roundId.trim();
  if (trimmedId.length === 0) {
    throw new Error('Round ID is required');
  }

  if (!scores || !Array.isArray(scores)) {
    throw new Error('Scores array is required');
  }

  if (scores.length === 0) {
    throw new Error('Scores array cannot be empty');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/rounds/${roundId}/scores`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ scores }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Authentication required
        throw new Error(data.message || 'Authentication required. Please log in again.');
      }
      if (response.status === 400) {
        // Backend validation errors
        throw new Error(data.message || 'Invalid score data');
      }
      if (response.status === 404) {
        // Round not found
        throw new Error(data.message || 'Round not found');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}

/**
 * Get side bets for a round
 * @param {string} roundId - Round ID to get side bets for
 * @returns {Promise<Array>} Array of side bet objects with participants
 * @throws {Error} Get side bets failed error with message
 */
export async function getRoundSideBets(roundId) {
  // Validate inputs before making API call
  if (!roundId || typeof roundId !== 'string') {
    throw new Error('Round ID is required');
  }

  const trimmedId = roundId.trim();
  if (trimmedId.length === 0) {
    throw new Error('Round ID is required');
  }

  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_BASE_URL}/api/rounds/${roundId}/side-bets`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId); // Clear timeout on successful response

    const data = await response.json();

    if (!response.ok) {
      // Handle different error types based on backend error responses
      if (response.status === 401) {
        // Authentication required
        throw new Error(data.message || 'Authentication required. Please log in again.');
      }
      if (response.status === 400) {
        // Backend validation errors
        throw new Error(data.message || 'Invalid round ID format');
      }
      if (response.status === 404) {
        // Round not found
        throw new Error(data.message || 'Round not found');
      }
      if (response.status >= 500) {
        // Backend returns "Internal Server Error" for server issues
        throw new Error('Something went wrong. Please try again.');
      }
      // Other network or connection errors
      throw new Error(data.message || 'Unable to connect. Please check your internet.');
    }

    // Validate response format - backend returns array of side bets directly
    if (!Array.isArray(data)) {
      throw new Error('Invalid response from server');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}
