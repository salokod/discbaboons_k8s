/**
 * Toast Component
 * Simple toast notification component for user feedback
 */

import {
  memo, useState, useEffect, useCallback,
} from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

function Toast({
  message,
  visible,
  onHide,
  duration = 2000,
}) {
  const colors = useThemeColors();
  const [fadeAnim] = useState(() => new Animated.Value(0));

  const hideToast = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onHide) {
        onHide();
      }
    });
  }, [fadeAnim, onHide]);

  useEffect(() => {
    if (visible) {
      // Show toast
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, duration, fadeAnim, hideToast]);

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: Platform.select({
        ios: 100,
        android: 80,
      }),
      left: spacing.lg,
      right: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 12,
        android: 8,
      }),
      padding: spacing.md,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 1000,
    },
    text: {
      ...typography.body,
      color: colors.text,
      textAlign: 'center',
    },
  });

  // eslint-disable-next-line no-underscore-dangle
  if (!visible && fadeAnim._value === 0) {
    return null;
  }

  return (
    <Animated.View
      testID="toast"
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text testID="toast-message" style={styles.text}>
        {message}
      </Text>
    </Animated.View>
  );
}

// Add display name for React DevTools
Toast.displayName = 'Toast';

export default memo(Toast);
