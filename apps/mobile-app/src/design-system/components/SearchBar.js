/**
 * SearchBar Component
 */

import { memo } from 'react';
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
  value = '',
  onChangeText,
  onClear,
  disabled = false,
}) {
  const colors = useThemeColors();

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
    if (onChangeText) {
      onChangeText('');
    }
  };

  const styles = StyleSheet.create({
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
  });

  return (
    <View testID="search-bar" style={styles.container}>
      <Icon
        name="search-outline"
        size={20}
        color={colors.textLight}
        style={styles.searchIcon}
      />
      <TextInput
        testID="search-input"
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        value={value}
        onChangeText={onChangeText}
        editable={!disabled}
        accessibilityLabel={`Search input: ${placeholder}`}
        accessibilityHint="Type to search"
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        returnKeyType="search"
      />
      {value && value.length > 0 && (
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
  disabled: PropTypes.bool,
};

SearchBar.defaultProps = {
  placeholder: 'Search...',
  value: '',
  onChangeText: () => {},
  onClear: undefined,
  disabled: false,
};

// Add display name for React DevTools
SearchBar.displayName = 'SearchBar';

export default memo(SearchBar);
