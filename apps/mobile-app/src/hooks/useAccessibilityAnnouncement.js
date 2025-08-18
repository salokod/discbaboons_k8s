/**
 * useAccessibilityAnnouncement Hook
 * Manages accessibility announcements for screen readers
 * Following established hook patterns from the codebase
 */

import {
  useState, useEffect, useCallback, useRef,
} from 'react';
import { AccessibilityInfo } from 'react-native';

function useAccessibilityAnnouncement() {
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const lastAnnouncementRef = useRef('');
  const announcementQueueRef = useRef([]);
  const isProcessingRef = useRef(false);

  // Check screen reader status on mount
  useEffect(() => {
    const checkScreenReaderStatus = async () => {
      try {
        const enabled = await AccessibilityInfo.isScreenReaderEnabled();
        setIsScreenReaderEnabled(enabled);
      } catch (error) {
        // Fallback to false if detection fails
        setIsScreenReaderEnabled(false);
      }
    };

    checkScreenReaderStatus();

    // Listen for screen reader status changes
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled,
    );

    return () => {
      if (subscription?.remove) {
        subscription.remove();
      }
    };
  }, []);

  // Process announcement queue
  const processQueue = useCallback(() => {
    if (isProcessingRef.current || announcementQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;
    const nextAnnouncement = announcementQueueRef.current.shift();

    AccessibilityInfo.announceForAccessibility(nextAnnouncement);
    lastAnnouncementRef.current = nextAnnouncement;

    // Schedule next announcement with delay
    setTimeout(() => {
      isProcessingRef.current = false;
      processQueue();
    }, 500);
  }, []);

  const announce = useCallback((text) => {
    // Validate input
    if (!text || typeof text !== 'string') {
      return;
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    // Prevent duplicate consecutive announcements only
    if (trimmedText === lastAnnouncementRef.current) {
      return;
    }

    // For this slice, always announce immediately
    // Queuing logic will be enhanced in later slices
    AccessibilityInfo.announceForAccessibility(trimmedText);
    lastAnnouncementRef.current = trimmedText;
  }, []);

  return {
    announce,
    isScreenReaderEnabled,
  };
}

export default useAccessibilityAnnouncement;
