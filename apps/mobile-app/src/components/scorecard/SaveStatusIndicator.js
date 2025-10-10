import { useEffect, useRef } from 'react';
import {
  Text, StyleSheet, Animated,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/tokens';

export default function SaveStatusIndicator({ status, onDismiss }) {
  const colors = useThemeColors();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timeoutRef = useRef(null);

  const getStatusText = () => {
    switch (status) {
      case 'saved':
        return 'Saved';
      case 'saving':
        return 'Saving...';
      case 'error':
        return 'Error';
      default:
        return '';
    }
  };

  const getAccessibilityLabel = () => {
    switch (status) {
      case 'saved':
        return 'Scores saved';
      case 'saving':
        return 'Saving scores';
      case 'error':
        return 'Error saving scores';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'saved':
        return colors.success || colors.primary;
      case 'saving':
        return colors.warning || colors.textSecondary;
      case 'error':
        return colors.error || colors.error;
      default:
        return colors.textSecondary;
    }
  };

  // Auto-dismiss "Saved" status after 2.5 seconds
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Reset fade animation
    fadeAnim.setValue(1);

    // Only auto-dismiss "saved" status
    if (status === 'saved' && onDismiss) {
      timeoutRef.current = setTimeout(() => {
        // Fade out animation
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          // Call onDismiss callback after fade completes
          onDismiss();
        });
      }, 2500);
    }

    // Cleanup timeout on unmount or status change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [status, onDismiss, fadeAnim]);

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    text: {
      fontSize: 12,
      color: getStatusColor(),
    },
  });

  return (
    <Animated.View
      testID="save-status-indicator"
      style={[styles.container, { opacity: fadeAnim }]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={getAccessibilityLabel()}
    >
      <Text style={styles.text}>
        {getStatusText()}
      </Text>
    </Animated.View>
  );
}

SaveStatusIndicator.propTypes = {
  status: PropTypes.oneOf(['saved', 'saving', 'error']).isRequired,
  onDismiss: PropTypes.func,
};

SaveStatusIndicator.defaultProps = {
  onDismiss: null,
};
