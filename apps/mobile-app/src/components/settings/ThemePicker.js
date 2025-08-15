/**
 * ThemePicker Component
 * Allows users to select and preview different app themes
 */

import {
  memo, useState, useEffect, useCallback,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { triggerSuccessHaptic, triggerSelectionHaptic } from '../../services/hapticService';
import { THEME_NAMES } from '../../design-system/themes';
import { useTheme, useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import Toast from '../common/Toast';

function ThemePicker() {
  const { theme, changeTheme, isLoading } = useTheme();
  const colors = useThemeColors();
  const [loadingTheme, setLoadingTheme] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fadeAnim = useState(() => new Animated.Value(1))[0];

  const animateThemeTransition = useCallback(() => {
    if (isLoading) return;

    // Fade out then fade in for smooth transition
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, isLoading]);

  const getThemeLabel = useCallback((themeKey) => {
    const themeLabels = {
      [THEME_NAMES.SYSTEM]: 'System',
      [THEME_NAMES.LIGHT]: 'Light',
      [THEME_NAMES.DARK]: 'Dark',
      [THEME_NAMES.BLACKOUT]: 'Blackout',
    };
    return themeLabels[themeKey] || 'Unknown';
  }, []);

  const showSuccessToast = useCallback((themeKey) => {
    const themeName = getThemeLabel(themeKey);
    setToastMessage(`Switched to ${themeName} theme`);
    setToastVisible(true);
  }, [getThemeLabel]);

  // Clear loading theme when global loading stops and trigger success haptic
  useEffect(() => {
    if (!isLoading && loadingTheme) {
      // Theme change completed - check if it was successful by comparing themes
      if (theme === loadingTheme) {
        // Theme change completed successfully
        triggerSuccessHaptic();
        showSuccessToast(loadingTheme);
      }
      setLoadingTheme(null);
    }
  }, [isLoading, loadingTheme, theme, showSuccessToast]);

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
    // Trigger light haptic feedback on selection
    triggerSelectionHaptic();

    // Trigger theme transition animation
    animateThemeTransition();

    setLoadingTheme(themeKey);
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
    themeOptionDisabled: {
      opacity: 0.5,
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
    <>
      <Animated.View testID="theme-picker" style={[styles.container, { opacity: fadeAnim }]}>
        {themeOptions.map((option) => {
          const isSelected = theme === option.key;
          const isLoadingThisTheme = loadingTheme === option.key;
          const isDisabled = isLoading;

          return (
            <TouchableOpacity
              key={option.key}
              testID={`theme-option-${option.key}`}
              style={[
                styles.themeOption,
                isSelected && styles.themeOptionSelected,
                isDisabled && styles.themeOptionDisabled,
              ]}
              onPress={() => handleThemeSelect(option.key)}
              disabled={isDisabled}
              accessibilityState={{ disabled: isDisabled }}
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
              {isLoadingThisTheme ? (
                <ActivityIndicator
                  testID={`theme-option-${option.key}-loading`}
                  size="small"
                  color={colors.primary}
                  style={styles.checkIcon}
                />
              ) : (
                isSelected && (
                  <Icon
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                    style={styles.checkIcon}
                  />
                )
              )}
            </TouchableOpacity>
          );
        })}
      </Animated.View>
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        duration={2000}
      />
    </>
  );
}

// Add display name for React DevTools
ThemePicker.displayName = 'ThemePicker';

export default memo(ThemePicker);
