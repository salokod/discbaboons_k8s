/**
 * ThemePreviewCard Component
 * Shows a mini preview of what the app looks like with a specific theme
 */

import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { themes } from '../../design-system/themes';
import { spacing } from '../../design-system/spacing';

function ThemePreviewCard({ theme }) {
  const themeColors = themes[theme];

  const styles = StyleSheet.create({
    container: {
      width: 100,
      height: 80,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    background: {
      flex: 1,
      backgroundColor: themeColors.background,
      padding: spacing.xs,
    },
    surface: {
      flex: 1,
      backgroundColor: themeColors.surface,
      borderRadius: 4,
      padding: spacing.xs,
    },
    primaryAccent: {
      width: 16,
      height: 4,
      backgroundColor: themeColors.primary,
      borderRadius: 2,
      marginTop: spacing.xs,
    },
  });

  return (
    <View testID="theme-preview-card" style={styles.container}>
      <View testID="preview-background" style={styles.background}>
        <View testID="preview-surface" style={styles.surface}>
          <View testID="preview-primary" style={styles.primaryAccent} />
        </View>
      </View>
    </View>
  );
}

ThemePreviewCard.propTypes = {
  theme: PropTypes.string.isRequired,
};

// Add display name for React DevTools
ThemePreviewCard.displayName = 'ThemePreviewCard';

export default memo(ThemePreviewCard);
