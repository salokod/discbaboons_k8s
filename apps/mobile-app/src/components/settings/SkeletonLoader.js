/**
 * SkeletonLoader Component
 * Provides animated skeleton loading placeholders
 */

import { useState, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useThemeColors } from '../../context/ThemeContext';

// Get screen width for gradient animation
const { width } = Dimensions.get('window');

function SkeletonLoader({
  width: skeletonWidth = '100%',
  height = 20,
  borderRadius = 4,
  style,
  testID,
}) {
  const colors = useThemeColors();
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  const styles = StyleSheet.create({
    skeleton: {
      backgroundColor: colors.border,
      width: skeletonWidth,
      height,
      borderRadius,
      overflow: 'hidden',
    },
    shimmer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surface,
    },
  });

  return (
    <View style={[styles.skeleton, style]} testID={testID}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            opacity,
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

// Add display name for React DevTools
SkeletonLoader.displayName = 'SkeletonLoader';

export default memo(SkeletonLoader);
