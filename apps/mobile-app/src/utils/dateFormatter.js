/**
 * Formats a round start time for display with relative time formatting
 * @param {string} startTimeISOString - ISO date string
 * @returns {string} - Formatted time display
 */
export const formatRoundStartTime = (startTimeISOString) => {
  if (!startTimeISOString) {
    return 'No start time';
  }

  try {
    const startDate = new Date(startTimeISOString);
    const now = new Date();

    // Format time as h:mm AM/PM
    const formatTime = (date) => date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Check if it's today
    const isToday = startDate.toDateString() === now.toDateString();
    if (isToday) {
      return `Started ${formatTime(startDate)} today`;
    }

    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = startDate.toDateString() === yesterday.toDateString();
    if (isYesterday) {
      return `Started ${formatTime(startDate)} yesterday`;
    }

    // Check if it's within the last 7 days (this week)
    const daysDiff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 7) {
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const dayName = dayNames[startDate.getDay()];
      return `Started ${formatTime(startDate)} ${dayName}`;
    }

    // For older dates, use full date format
    return `Started ${formatTime(startDate)} ${startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })}`;
  } catch (error) {
    return 'Invalid date';
  }
};
