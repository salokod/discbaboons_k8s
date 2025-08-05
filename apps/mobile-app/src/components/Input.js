/**
 * Input Component
 */

import {
  TextInput, StyleSheet, Platform, View, TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../context/ThemeContext';
import { spacing } from '../design-system/spacing';
import { typography } from '../design-system/typography';

function Input({
  placeholder, value, onChangeText, secureTextEntry = false, accessibilityLabel, accessibilityHint,
  autoCapitalize = 'sentences', autoCorrect = true, spellCheck = true, textContentType,
  showPasswordToggle = false,
}) {
  const colors = useThemeColors();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Determine if password should be hidden
  const shouldHidePassword = secureTextEntry && !isPasswordVisible;

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const styles = StyleSheet.create({
    container: {
      position: 'relative',
    },
    input: {
      ...typography.body,
      paddingVertical: Platform.select({
        ios: spacing.md,
        android: spacing.lg,
      }),
      paddingHorizontal: spacing.md,
      paddingRight: showPasswordToggle ? spacing.xl * 2 : spacing.md, // Extra space for eye icon
      borderWidth: Platform.select({
        ios: 1,
        android: 0,
      }),
      borderColor: colors.border,
      borderRadius: Platform.select({
        ios: 8,
        android: 12,
      }),
      backgroundColor: colors.surface,
      color: colors.text,
      fontSize: Platform.select({
        ios: typography.body.fontSize,
        android: typography.body.fontSize + 1,
      }),
      ...Platform.select({
        android: {
          elevation: 1,
        },
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
        },
      }),
    },
    eyeButton: {
      position: 'absolute',
      right: spacing.md,
      top: '50%',
      transform: [{ translateY: -12 }], // Center the 24px icon
      padding: spacing.xs,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 24,
      minHeight: 24,
    },
  });

  const inputComponent = (
    <TextInput
      testID="input"
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={colors.textLight}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={shouldHidePassword}
      accessibilityLabel={accessibilityLabel || placeholder}
      accessibilityHint={accessibilityHint || (secureTextEntry ? 'Password input field' : 'Text input field')}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      spellCheck={spellCheck}
      textContentType={textContentType}
    />
  );

  if (showPasswordToggle && secureTextEntry) {
    return (
      <View style={styles.container}>
        {inputComponent}
        <TouchableOpacity
          testID="password-toggle"
          style={styles.eyeButton}
          onPress={togglePasswordVisibility}
          accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
          accessibilityHint={isPasswordVisible ? 'Tap to hide password' : 'Tap to show password'}
          accessibilityRole="button"
        >
          <Icon
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.textLight}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return inputComponent;
}

Input.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChangeText: PropTypes.func.isRequired,
  secureTextEntry: PropTypes.bool,
  accessibilityLabel: PropTypes.string,
  accessibilityHint: PropTypes.string,
  autoCapitalize: PropTypes.oneOf(['none', 'sentences', 'words', 'characters']),
  autoCorrect: PropTypes.bool,
  spellCheck: PropTypes.bool,
  textContentType: PropTypes.string,
  showPasswordToggle: PropTypes.bool,
};

Input.defaultProps = {
  placeholder: '',
  value: '',
  secureTextEntry: false,
  accessibilityLabel: undefined,
  accessibilityHint: undefined,
  autoCapitalize: 'sentences',
  autoCorrect: true,
  spellCheck: true,
  textContentType: undefined,
  showPasswordToggle: false,
};

export default Input;
