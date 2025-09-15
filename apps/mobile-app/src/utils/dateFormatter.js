/**
 * Formats a round start time for display
 * @param {string} startTime - ISO date string
 * @returns {string} - Formatted time display
 */
export const formatRoundStartTime = (startTime) => {
  if (!startTime) {
    return 'No start time';
  }

  try {
    const date = new Date(startTime);
    const now = new Date();

    // Check if the date is in the past
    if (date <= now) {
      return `Started ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
    return `Starts ${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } catch (error) {
    return 'Invalid date';
  }
};
