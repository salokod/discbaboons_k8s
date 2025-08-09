/**
 * SearchBar Component
 */

import {
  memo, useMemo, useRef, useState,
} from 'react';
import {
  View, TextInput, StyleSheet, Platform, TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../spacing';
import { typography } from '../typography';

function SearchBar({
  placeholder = 'Search...',
  value,
  onChangeText,
  onClear,
  onSubmitEditing,
  disabled = false,
}) {
  const colors = useThemeColors();
  const inputRef = useRef(null);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState('');

  const handleTextChange = (text) => {
    if (!isControlled) {
      setInternalValue(text);
    }
    if (onChangeText) {
      onChangeText(text);
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
    if (onChangeText) {
      onChangeText('');
    }
    // For uncontrolled mode, clear the input and internal state
    if (!isControlled) {
      setInternalValue('');
      if (inputRef.current) {
        inputRef.current.clear();
      }
    }
  };

  const displayValue = isControlled ? value : internalValue;

  // Memoize styles to prevent component recreation
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 10,
        android: 12,
      }),
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: Platform.select({
        ios: spacing.sm,
        android: spacing.md,
      }),
      opacity: disabled ? 0.6 : 1,
    },
    searchIcon: {
      marginRight: spacing.sm,
    },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.text,
      paddingVertical: 0, // Remove default TextInput padding
      paddingHorizontal: 0,
    },
    clearButton: {
      marginLeft: spacing.sm,
      padding: spacing.xs,
    },
  }), [colors, disabled]);

  return (
    <View testID="search-bar" style={styles.container}>
      <Icon
        name="search-outline"
        size={20}
        color={colors.textLight}
        style={styles.searchIcon}
      />
      <TextInput
        ref={inputRef}
        testID="search-input"
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        value={isControlled ? value : internalValue}
        onChangeText={handleTextChange}
        onSubmitEditing={onSubmitEditing}
        editable={!disabled}
        accessibilityLabel={`Search input: ${placeholder}`}
        accessibilityHint="Type to search or press enter"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        returnKeyType="search"
      />
      {displayValue && displayValue.length > 0 && (
        <TouchableOpacity
          testID="search-clear-button"
          style={styles.clearButton}
          onPress={handleClear}
          accessibilityLabel="Clear search"
          accessibilityHint="Tap to clear search text"
          accessibilityRole="button"
        >
          <Icon
            name="close-circle-outline"
            size={18}
            color={colors.textLight}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

SearchBar.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChangeText: PropTypes.func,
  onClear: PropTypes.func,
  onSubmitEditing: PropTypes.func,
  disabled: PropTypes.bool,
};

SearchBar.defaultProps = {
  placeholder: 'Search...',
  value: '',
  onChangeText: () => {},
  onClear: undefined,
  onSubmitEditing: undefined,
  disabled: false,
};

// Add display name for React DevTools
SearchBar.displayName = 'SearchBar';

export default memo(SearchBar);
