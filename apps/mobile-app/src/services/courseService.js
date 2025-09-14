/**
 * Course Service
 * Handles API calls for course search and management operations
 */

import { API_BASE_URL } from '../config/environment';
import { getTokens } from './tokenStorage';

/**
 * Transform course data from API format to frontend format
 * @param {Object} apiCourse - Course data from API
 * @returns {Object} Transformed course data for frontend consumption
 */
export function transformCourseData(apiCourse) {
  /* eslint-disable camelcase */
  const {
    state_province,
    hole_count,
    city,
    ...otherProps
  } = apiCourse;

  // Create location field combining city and state
  let location = '';
  if (city && state_province) {
    location = `${city}, ${state_province}`;
  } else if (city) {
    location = city;
  } else if (state_province) {
    location = state_province;
  }

  return {
    ...otherProps,
    city,
    state: state_province,
    holes: hole_count,
    location,
  };
  /* eslint-enable camelcase */
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
 * Search for courses with optional filters
 * @param {Object} params - Search parameters
 * @returns {Promise<{courses: Array, pagination: Object}>} Search results and pagination info
 * @throws {Error} Search failed error with message
 */
export async function searchCourses(params = {}) {
  // Create an AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Get auth headers with access token
    const headers = await getAuthHeaders();

    // Build query parameters (API supports name, state, city, limit, offset)
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.set('name', params.q.toString());
    if (params.state) queryParams.set('state', params.state.toString());
    if (params.city) queryParams.set('city', params.city.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.offset !== undefined) queryParams.set('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/api/courses${queryString ? `?${queryString}` : ''}`;

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
        throw new Error(data.message || 'Invalid search parameters');
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

    // Validate response format matches API documentation
    if (!data || !Array.isArray(data.courses)) {
      throw new Error('Invalid response from server');
    }

    return {
      courses: data.courses.map(transformCourseData),
      pagination: {
        total: data.total,
        limit: data.limit,
        offset: data.offset,
        hasMore: data.hasMore,
      },
    };
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    throw error; // Re-throw the error to be handled by caller
  }
}
