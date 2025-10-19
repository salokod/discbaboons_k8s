/**
 * Unit tests for roundUtils
 * Tests utility functions for round-related operations
 */

import { getPrimaryButtonLabel, getDateLabel, getPlayerEmptyStateMessage } from '../../src/utils/roundUtils';

describe('roundUtils', () => {
  describe('getPrimaryButtonLabel', () => {
    describe('status-based labels for all users', () => {
      it('should return "View Details" for pending status', () => {
        expect(getPrimaryButtonLabel('pending', false)).toBe('View Details');
        expect(getPrimaryButtonLabel('pending', true)).toBe('View Details');
      });

      it('should return "View Details" for confirmed status', () => {
        expect(getPrimaryButtonLabel('confirmed', false)).toBe('View Details');
        expect(getPrimaryButtonLabel('confirmed', true)).toBe('View Details');
      });

      it('should return "Open Scorecard" for in_progress status', () => {
        expect(getPrimaryButtonLabel('in_progress', false)).toBe('Open Scorecard');
        expect(getPrimaryButtonLabel('in_progress', true)).toBe('Open Scorecard');
      });

      it('should return "View Summary" for completed status', () => {
        expect(getPrimaryButtonLabel('completed', false)).toBe('View Summary');
        expect(getPrimaryButtonLabel('completed', true)).toBe('View Summary');
      });

      it('should return "View Details" for cancelled status', () => {
        expect(getPrimaryButtonLabel('cancelled', false)).toBe('View Details');
        expect(getPrimaryButtonLabel('cancelled', true)).toBe('View Details');
      });
    });

    describe('edge cases', () => {
      it('should return "View Details" for unknown status', () => {
        expect(getPrimaryButtonLabel('unknown', false)).toBe('View Details');
      });

      it('should return "View Details" for null status', () => {
        expect(getPrimaryButtonLabel(null, false)).toBe('View Details');
      });

      it('should return "View Details" for undefined status', () => {
        expect(getPrimaryButtonLabel(undefined, false)).toBe('View Details');
      });

      it('should return "View Details" for empty string status', () => {
        expect(getPrimaryButtonLabel('', false)).toBe('View Details');
      });

      it('should handle missing isOwner parameter (default to false)', () => {
        expect(getPrimaryButtonLabel('in_progress')).toBe('Open Scorecard');
      });
    });

    describe('isOwner parameter does not affect labels', () => {
      it('should return same label regardless of isOwner for pending', () => {
        const labelAsOwner = getPrimaryButtonLabel('pending', true);
        const labelAsNonOwner = getPrimaryButtonLabel('pending', false);
        expect(labelAsOwner).toBe(labelAsNonOwner);
      });

      it('should return same label regardless of isOwner for in_progress', () => {
        const labelAsOwner = getPrimaryButtonLabel('in_progress', true);
        const labelAsNonOwner = getPrimaryButtonLabel('in_progress', false);
        expect(labelAsOwner).toBe(labelAsNonOwner);
      });

      it('should return same label regardless of isOwner for completed', () => {
        const labelAsOwner = getPrimaryButtonLabel('completed', true);
        const labelAsNonOwner = getPrimaryButtonLabel('completed', false);
        expect(labelAsOwner).toBe(labelAsNonOwner);
      });
    });
  });

  describe('getDateLabel', () => {
    describe('status-based date labels', () => {
      it('should return "Created" for pending status', () => {
        expect(getDateLabel('pending')).toBe('Created');
      });

      it('should return "Starts" for confirmed status', () => {
        expect(getDateLabel('confirmed')).toBe('Starts');
      });

      it('should return "Started" for in_progress status', () => {
        expect(getDateLabel('in_progress')).toBe('Started');
      });

      it('should return "Completed" for completed status', () => {
        expect(getDateLabel('completed')).toBe('Completed');
      });

      it('should return "Cancelled" for cancelled status', () => {
        expect(getDateLabel('cancelled')).toBe('Cancelled');
      });
    });

    describe('edge cases', () => {
      it('should return "Created" for unknown status', () => {
        expect(getDateLabel('unknown')).toBe('Created');
      });

      it('should return "Created" for null status', () => {
        expect(getDateLabel(null)).toBe('Created');
      });

      it('should return "Created" for undefined status', () => {
        expect(getDateLabel(undefined)).toBe('Created');
      });

      it('should return "Created" for empty string status', () => {
        expect(getDateLabel('')).toBe('Created');
      });
    });
  });

  describe('getPlayerEmptyStateMessage', () => {
    describe('status-specific empty state messages', () => {
      it('should return "Waiting for players to join" for pending status', () => {
        expect(getPlayerEmptyStateMessage('pending')).toBe('Waiting for players to join');
      });

      it('should return "Ready to start with confirmed players" for confirmed status', () => {
        expect(getPlayerEmptyStateMessage('confirmed')).toBe('Ready to start with confirmed players');
      });

      it('should return "Round in progress with no players" for in_progress status', () => {
        expect(getPlayerEmptyStateMessage('in_progress')).toBe('Round in progress with no players');
      });

      it('should return "Round completed with no players" for completed status', () => {
        expect(getPlayerEmptyStateMessage('completed')).toBe('Round completed with no players');
      });

      it('should return "This round was cancelled" for cancelled status', () => {
        expect(getPlayerEmptyStateMessage('cancelled')).toBe('This round was cancelled');
      });
    });

    describe('edge cases', () => {
      it('should return "No players yet" for unknown status', () => {
        expect(getPlayerEmptyStateMessage('unknown')).toBe('No players yet');
      });

      it('should return "No players yet" for null status', () => {
        expect(getPlayerEmptyStateMessage(null)).toBe('No players yet');
      });

      it('should return "No players yet" for undefined status', () => {
        expect(getPlayerEmptyStateMessage(undefined)).toBe('No players yet');
      });

      it('should return "No players yet" for empty string status', () => {
        expect(getPlayerEmptyStateMessage('')).toBe('No players yet');
      });
    });
  });
});
