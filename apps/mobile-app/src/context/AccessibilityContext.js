/**
 * AccessibilityContext
 * Manages app-wide accessibility settings and preferences
 * Following established context patterns from the codebase
 */

import {
  createContext, useContext, useState, useMemo, useEffect,
} from 'react';
import PropTypes from 'prop-types';
import { AccessibilityInfo } from 'react-native';

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [isReduceTransparencyEnabled, setIsReduceTransparencyEnabled] = useState(false);
  const [isBoldTextEnabled, setIsBoldTextEnabled] = useState(false);

  // Custom preferences (not from system)
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);
  const [motionPreference, setMotionPreference] = useState('auto'); // 'auto', 'reduced', 'none'

  // Load accessibility preferences on initialization
  useEffect(() => {
    const loadAccessibilityPreferences = async () => {
      try {
        const [
          screenReader,
          reduceMotion,
          reduceTransparency,
          boldText,
        ] = await Promise.all([
          AccessibilityInfo.isScreenReaderEnabled(),
          AccessibilityInfo.isReduceMotionEnabled
            ? AccessibilityInfo.isReduceMotionEnabled()
            : Promise.resolve(false),
          AccessibilityInfo.isReduceTransparencyEnabled
            ? AccessibilityInfo.isReduceTransparencyEnabled()
            : Promise.resolve(false),
          AccessibilityInfo.isBoldTextEnabled
            ? AccessibilityInfo.isBoldTextEnabled()
            : Promise.resolve(false),
        ]);

        setIsScreenReaderEnabled(screenReader);
        setIsReduceMotionEnabled(reduceMotion);
        setIsReduceTransparencyEnabled(reduceTransparency);
        setIsBoldTextEnabled(boldText);
      } catch (error) {
        // Graceful degradation - keep default values
      } finally {
        setIsLoading(false);
      }
    };

    loadAccessibilityPreferences();
  }, []);

  // Listen for accessibility changes
  useEffect(() => {
    const subscriptions = [];

    // Screen reader changes
    try {
      const screenReaderSubscription = AccessibilityInfo.addEventListener(
        'screenReaderChanged',
        setIsScreenReaderEnabled,
      );
      if (screenReaderSubscription) {
        subscriptions.push(screenReaderSubscription);
      }
    } catch (error) {
      // Some platforms may not support this
    }

    // Reduce motion changes
    try {
      const reduceMotionSubscription = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        setIsReduceMotionEnabled,
      );
      if (reduceMotionSubscription) {
        subscriptions.push(reduceMotionSubscription);
      }
    } catch (error) {
      // Some platforms may not support this
    }

    // Bold text changes
    try {
      const boldTextSubscription = AccessibilityInfo.addEventListener(
        'boldTextChanged',
        setIsBoldTextEnabled,
      );
      if (boldTextSubscription) {
        subscriptions.push(boldTextSubscription);
      }
    } catch (error) {
      // Some platforms may not support this
    }

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach((subscription) => {
        if (subscription?.remove) {
          subscription.remove();
        }
      });
    };
  }, []);

  // Custom preference setters
  const setHighContrastMode = (enabled) => {
    setIsHighContrastEnabled(enabled);
  };

  const value = useMemo(() => ({
    // System accessibility states
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    isReduceTransparencyEnabled,
    isBoldTextEnabled,

    // Custom preferences
    isHighContrastEnabled,
    motionPreference,

    // Loading state
    isLoading,

    // Setters for custom preferences
    setHighContrastMode,
    setMotionPreference,
  }), [
    isScreenReaderEnabled,
    isReduceMotionEnabled,
    isReduceTransparencyEnabled,
    isBoldTextEnabled,
    isHighContrastEnabled,
    motionPreference,
    isLoading,
  ]);

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

AccessibilityProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
