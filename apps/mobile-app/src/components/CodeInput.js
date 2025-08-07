/**
 * CodeInput - 6-digit verification code input with auto-advance
 */

import {
  useState, useRef, useEffect, memo,
} from 'react';
import {
  View, TextInput, StyleSheet, Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';

const CODE_LENGTH = 6;

function CodeInput({
  value, onChangeText, onComplete, autoFocus = false, accessibilityLabel,
}) {
  const colors = useThemeColors();
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const inputRefs = useRef(Array(CODE_LENGTH).fill(null));

  // Update local state when value prop changes
  useEffect(() => {
    const newDigits = Array(CODE_LENGTH).fill('');
    const safeValue = value || '';
    for (let i = 0; i < Math.min(safeValue.length, CODE_LENGTH); i += 1) {
      newDigits[i] = safeValue[i] || '';
    }
    setDigits(newDigits);
  }, [value]);

  // Auto-focus first input
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleDigitChange = (text, index) => {
    // Clean input - only alphanumeric (A-F, 0-9 for hexadecimal codes)
    const cleanText = text.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();

    // Check if this is a paste operation (multiple characters)
    if (cleanText.length > 1) {
      // Handle paste - distribute characters across inputs
      const newDigits = [...digits];
      const pasteChars = cleanText.substring(0, CODE_LENGTH - index);

      for (let i = 0; i < pasteChars.length && (index + i) < CODE_LENGTH; i += 1) {
        newDigits[index + i] = pasteChars[i];
      }

      setDigits(newDigits);
      const newCode = newDigits.join('');
      onChangeText(newCode);

      // Focus next empty input or last input
      const nextEmptyIndex = newDigits.findIndex((digit, i) => i > index && !digit);
      const targetIndex = nextEmptyIndex !== -1
        ? nextEmptyIndex
        : Math.min(index + pasteChars.length, CODE_LENGTH - 1);
      inputRefs.current[targetIndex]?.focus();

      // Call onComplete when all digits are filled
      if (newCode.length === CODE_LENGTH && onComplete) {
        onComplete(newCode);
      }
      return;
    }

    // Handle single character input
    const digit = cleanText.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Update parent component
    const newCode = newDigits.join('');
    onChangeText(newCode);

    // Auto-advance to next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete when all digits are filled
    if (newCode.length === CODE_LENGTH && onComplete) {
      onComplete(newCode);
    }
  };

  const handleKeyPress = (event, index) => {
    const { key } = event.nativeEvent;

    // Handle backspace
    if (key === 'Backspace') {
      const newDigits = [...digits];

      if (digits[index]) {
        // Clear current digit
        newDigits[index] = '';
        setDigits(newDigits);
        onChangeText(newDigits.join(''));
      } else if (index > 0) {
        // Move to previous input and clear it
        newDigits[index - 1] = '';
        setDigits(newDigits);
        onChangeText(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleInputFocus = (index) => {
    // Select all text when focusing
    if (inputRefs.current[index]) {
      inputRefs.current[index].setSelection(0, digits[index].length);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    digitInput: {
      width: 48,
      height: 56,
      borderRadius: Platform.select({
        ios: 8,
        android: 12,
      }),
      borderWidth: Platform.select({
        ios: 1,
        android: 2,
      }),
      borderColor: colors.border,
      backgroundColor: colors.surface,
      textAlign: 'center',
      ...typography.h2,
      color: colors.text,
    },
    digitInputFocused: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    digitInputFilled: {
      backgroundColor: `${colors.primary}10`,
      borderColor: colors.primary,
    },
  });

  return (
    <View style={styles.container}>
      {Array(CODE_LENGTH).fill(null).map((_, index) => (
        <TextInput
          // eslint-disable-next-line react/no-array-index-key
          key={`digit-${index}`}
          ref={(ref) => { inputRefs.current[index] = ref; }}
          style={[
            styles.digitInput,
            digits[index] && styles.digitInputFilled,
          ]}
          value={digits[index]}
          onChangeText={(text) => handleDigitChange(text, index)}
          onKeyPress={(event) => handleKeyPress(event, index)}
          onFocus={() => handleInputFocus(index)}
          keyboardType="default"
          autoCapitalize="characters"
          selectTextOnFocus
          accessibilityLabel={accessibilityLabel || `Verification code digit ${index + 1} of ${CODE_LENGTH}`}
          accessibilityHint={`Enter digit ${index + 1} of your ${CODE_LENGTH}-digit verification code. Only numbers and letters A through F are allowed.`}
          accessibilityRole="text"
          testID={`code-input-${index}`}
        />
      ))}
    </View>
  );
}

CodeInput.propTypes = {
  value: PropTypes.string,
  onChangeText: PropTypes.func,
  onComplete: PropTypes.func,
  autoFocus: PropTypes.bool,
  accessibilityLabel: PropTypes.string,
};

CodeInput.defaultProps = {
  value: '',
  onChangeText: () => {},
  onComplete: null,
  autoFocus: false,
  accessibilityLabel: undefined,
};

// Add display name for React DevTools
CodeInput.displayName = 'CodeInput';

export default memo(CodeInput);
