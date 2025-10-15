/**
 * Course Helper Utilities
 */

/**
 * Format timestamp as relative time
 * Examples: "3d" (3 days), "1w" (1 week), "2mo" (2 months)
 * @param {string} isoTimestamp - ISO timestamp string
 * @returns {string} Formatted relative time
 */
export const formatLastPlayed = (isoTimestamp) => {
  const now = new Date();
  const played = new Date(isoTimestamp);
  const diffMs = now - played;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return '1d';
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo`;
  return `${Math.floor(diffDays / 365)}y`;
};

/**
 * Get first letter of course name for badge
 * @param {string} courseName - Course name
 * @returns {string} First letter in uppercase
 */
export const getCourseInitial = (courseName) => {
  if (!courseName || typeof courseName !== 'string') return '?';
  return courseName.charAt(0).toUpperCase();
};
