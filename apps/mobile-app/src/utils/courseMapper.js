// Course ID to display name mapping
const COURSE_MAPPINGS = {
  'prospect-park': 'Prospect Park',
  'central-park': 'Central Park',
  'golden-gate-park': 'Golden Gate Park',
  'bethpage-black': 'Bethpage Black',
  pebble_beach: 'Pebble Beach',
  // Add more course mappings as needed
};

/**
 * Converts a course ID to a human-readable display name
 * @param {string} courseId - The course identifier (e.g., 'prospect-park')
 * @returns {string} - Formatted display name (e.g., 'Prospect Park')
 */
export const getCourseDisplayName = (courseId) => {
  // Handle empty/null/undefined values
  if (!courseId) {
    return '';
  }

  // Return mapped name if it exists
  if (COURSE_MAPPINGS[courseId]) {
    return COURSE_MAPPINGS[courseId];
  }

  // Fallback: return original course ID for unmapped courses
  return courseId;
};
