/**
 * ThemePicker Component
 * Allows users to select and preview different app themes
 */

import { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { THEME_NAMES } from '../../design-system/themes';
import { useTheme, useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

function ThemePicker() {
  const { theme, changeTheme } = useTheme();
  const colors = useThemeColors();

  const themeOptions = [
    {
      key: THEME_NAMES.SYSTEM,
      label: 'System',
      description: 'Follow your device theme',
      icon: 'phone-portrait-outline',
    },
    {
      key: THEME_NAMES.LIGHT,
      label: 'Light',
      description: 'Clean and bright interface',
      icon: 'sunny-outline',
    },
    {
      key: THEME_NAMES.DARK,
      label: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: 'moon-outline',
    },
    {
      key: THEME_NAMES.BLACKOUT,
      label: 'Blackout',
      description: 'Pure black for OLED displays',
      icon: 'contrast-outline',
    },
  ];

  const handleThemeSelect = (themeKey) => {
    changeTheme(themeKey);
  };

  const styles = StyleSheet.create({
    container: {
      gap: spacing.md,
    },
    themeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 12,
        android: 8,
      }),
      borderWidth: 2,
      borderColor: 'transparent',
    },
    themeOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.surface,
    },
    themeOptionIcon: {
      marginRight: spacing.md,
    },
    themeOptionContent: {
      flex: 1,
    },
    themeOptionLabel: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    themeOptionDescription: {
      ...typography.caption,
      color: colors.textLight,
      lineHeight: 16,
    },
    checkIcon: {
      marginLeft: spacing.sm,
    },
  });

  return (
    <View testID="theme-picker" style={styles.container}>
      {themeOptions.map((option) => {
        const isSelected = theme === option.key;

        return (
          <TouchableOpacity
            key={option.key}
            testID={`theme-option-${option.key}`}
            style={[
              styles.themeOption,
              isSelected && styles.themeOptionSelected,
            ]}
            onPress={() => handleThemeSelect(option.key)}
          >
            <Icon
              name={option.icon}
              size={24}
              color={isSelected ? colors.primary : colors.textLight}
              style={styles.themeOptionIcon}
            />
            <View style={styles.themeOptionContent}>
              <Text style={styles.themeOptionLabel}>
                {option.label}
              </Text>
              <Text style={styles.themeOptionDescription}>
                {option.description}
              </Text>
            </View>
            {isSelected && (
              <Icon
                name="checkmark-circle"
                size={20}
                color={colors.primary}
                style={styles.checkIcon}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Add display name for React DevTools
ThemePicker.displayName = 'ThemePicker';

export default memo(ThemePicker);
