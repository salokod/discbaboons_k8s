/**
 * Avatar Component
 * Displays user initials with themed background colors
 */

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';

function Avatar({ username }) {
  const colors = useThemeColors();

  const getInitial = (name) => {
    if (!name || typeof name !== 'string') {
      return '?';
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      return '?';
    }

    return trimmedName[0].toUpperCase();
  };

  const getBackgroundColor = (name) => {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return colors.textLight; // Default color for empty names
    }

    // Define a palette of theme-appropriate colors
    const colorPalette = [
      colors.primary,
      colors.secondary,
      colors.accent,
      '#2563EB', // Blue
      '#7C3AED', // Purple
      '#DC2626', // Red
      '#059669', // Green
      '#D97706', // Orange
      '#4338CA', // Indigo
      '#BE185D', // Pink
    ];

    // Simple hash function for consistent color selection
    let hash = 0;
    const trimmedName = name.trim().toLowerCase();
    for (let i = 0; i < trimmedName.length; i += 1) {
      const char = trimmedName.charCodeAt(i);
      hash = ((hash * 32) - hash) + char;
      hash = Math.imul(hash, 1); // Convert to 32-bit integer
    }

    // Use absolute value and modulo to get a consistent index
    const colorIndex = Math.abs(hash) % colorPalette.length;
    return colorPalette[colorIndex];
  };

  const backgroundColor = getBackgroundColor(username);

  const styles = StyleSheet.create({
    container: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    text: {
      ...typography.body2,
      color: colors.surface,
      fontWeight: '600',
    },
  });

  return (
    <View testID="avatar" style={styles.container}>
      <Text style={styles.text}>
        {getInitial(username)}
      </Text>
    </View>
  );
}

Avatar.propTypes = {
  username: PropTypes.string.isRequired,
};

export default Avatar;
