/**
 * roundUtils
 * Utility functions for round-related operations
 */

/**
 * Get the primary button label based on round status
 * @param {string} status - The round status
 * @param {boolean} isOwner - Reserved for future use
 * @returns {string} The label to display on the primary button
 */
// eslint-disable-next-line no-unused-vars
export function getPrimaryButtonLabel(status, isOwner = false) {
  // Map status to appropriate button label
  switch (status) {
    case 'in_progress':
      return 'Open Scorecard';
    case 'completed':
      return 'View Summary';
    case 'pending':
    case 'confirmed':
    case 'cancelled':
      return 'View Details';
    default:
      // Safe default for unknown/null/undefined statuses
      return 'View Details';
  }
}

/**
 * Get the date label prefix based on round status
 * @param {string} status - Round status (pending, confirmed, in_progress, completed, cancelled)
 * @returns {string} Date label prefix (e.g., "Started", "Completed")
 */
export function getDateLabel(status) {
  // Map status to appropriate date label
  switch (status) {
    case 'pending':
      return 'Created';
    case 'confirmed':
      return 'Starts';
    case 'in_progress':
      return 'Started';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      // Safe default for unknown/null/undefined statuses
      return 'Created';
  }
}

/**
 * Get empty state message for player list based on round status
 * @param {string} status - Round status
 * @returns {string} Empty state message
 */
export function getPlayerEmptyStateMessage(status) {
  // Map status to appropriate empty state message
  switch (status) {
    case 'pending':
      return 'Waiting for players to join';
    case 'confirmed':
      return 'Ready to start with confirmed players';
    case 'in_progress':
      return 'Round in progress with no players';
    case 'completed':
      return 'Round completed with no players';
    case 'cancelled':
      return 'This round was cancelled';
    default:
      // Safe default for unknown/null/undefined statuses
      return 'No players yet';
  }
}
