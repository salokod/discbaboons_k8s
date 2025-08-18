/**
 * useAccessibilityAnnouncement Hook Tests
 * Test-driven development for accessibility announcements
 */

import { renderHook, act } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import useAccessibilityAnnouncement from '../../src/hooks/useAccessibilityAnnouncement';

// Mock React Native AccessibilityInfo
jest.mock('react-native', () => ({
  AccessibilityInfo: {
    announceForAccessibility: jest.fn(),
    isScreenReaderEnabled: jest.fn(),
    addEventListener: jest.fn(() => ({
      remove: jest.fn(),
    })),
  },
}));

describe('useAccessibilityAnnouncement Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('should export a function', () => {
    it('should be a function', () => {
      expect(typeof useAccessibilityAnnouncement).toBe('function');
    });
  });

  describe('hook interface', () => {
    it('should return announce function', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncement());

      expect(typeof result.current.announce).toBe('function');
    });

    it('should return isScreenReaderEnabled boolean', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncement());

      expect(typeof result.current.isScreenReaderEnabled).toBe('boolean');
    });
  });

  describe('screen reader detection', () => {
    it('should return true when screen reader is enabled', async () => {
      AccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(true);

      const { result } = renderHook(() => useAccessibilityAnnouncement());

      // Wait for the async effect to complete
      await act(async () => {
        // Allow the useEffect to run
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      expect(result.current.isScreenReaderEnabled).toBe(true);
    });

    it('should return false when screen reader is disabled', async () => {
      AccessibilityInfo.isScreenReaderEnabled.mockResolvedValue(false);

      const { result } = renderHook(() => useAccessibilityAnnouncement());

      // Wait for the async effect to complete
      await act(async () => {
        // Allow the useEffect to run
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
      });

      expect(result.current.isScreenReaderEnabled).toBe(false);
    });
  });

  describe('announcement functionality', () => {
    it('should call AccessibilityInfo.announceForAccessibility when announcing', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncement());
      const testMessage = 'Test announcement';

      act(() => {
        result.current.announce(testMessage);
      });

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(testMessage);
    });

    it('should not announce empty or null messages', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncement());

      act(() => {
        result.current.announce('');
      });
      expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();

      act(() => {
        result.current.announce(null);
      });
      expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();

      act(() => {
        result.current.announce(undefined);
      });
      expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
    });

    it('should trim whitespace from announcements', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncement());
      const testMessage = '  Test announcement  ';

      act(() => {
        result.current.announce(testMessage);
      });

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith('Test announcement');
    });
  });

  describe('announcement deduplication', () => {
    it('should prevent duplicate consecutive announcements', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncement());
      const testMessage = 'Duplicate test';

      act(() => {
        result.current.announce(testMessage);
        result.current.announce(testMessage);
      });

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledTimes(1);
    });

    it('should allow same announcement after different announcement', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncement());
      const message1 = 'First message';
      const message2 = 'Second message';

      // First announcement
      act(() => {
        result.current.announce(message1);
      });
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledTimes(1);
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenLastCalledWith(message1);

      // Second announcement (different)
      act(() => {
        result.current.announce(message2);
      });
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledTimes(2);
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenLastCalledWith(message2);

      // Third announcement (same as first, should be allowed)
      act(() => {
        result.current.announce(message1);
      });
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledTimes(3);
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenLastCalledWith(message1);
    });
  });

  describe('announcement queuing', () => {
    it('should handle multiple announcements', () => {
      const { result } = renderHook(() => useAccessibilityAnnouncement());

      act(() => {
        result.current.announce('First');
        result.current.announce('Second');
        result.current.announce('Third');
      });

      // For this basic slice, all announcements should be made
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledTimes(3);
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenNthCalledWith(1, 'First');
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenNthCalledWith(2, 'Second');
      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenNthCalledWith(3, 'Third');
    });
  });
});
