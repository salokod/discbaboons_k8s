/**
 * StatusBarSafeView Component
 * Provides consistent status bar handling across iOS and Android platforms
 * Enhanced with react-native-safe-area-context for better Android support
 */

import {
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';

function StatusBarSafeView({
  children,
  style,
  edges = ['top'],
  testID,
  accessibilityLabel,
}) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });

  return (
    <SafeAreaView
      style={[styles.safeArea, style]}
      edges={edges}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </SafeAreaView>
  );
}

StatusBarSafeView.propTypes = {
  children: PropTypes.node.isRequired,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  edges: PropTypes.arrayOf(PropTypes.string),
  testID: PropTypes.string,
  accessibilityLabel: PropTypes.string,
};

StatusBarSafeView.defaultProps = {
  style: {},
  edges: ['top'],
  testID: undefined,
  accessibilityLabel: undefined,
};

export default StatusBarSafeView;
