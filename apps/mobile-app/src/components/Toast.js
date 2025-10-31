import {
  Text, StyleSheet, Animated,
} from 'react-native';
import PropTypes from 'prop-types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing, borderRadius } from '../design-system/tokens';

export default function Toast({ visible, message, type }) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const opacity = new Animated.Value(visible ? 1 : 0);

  let backgroundColor = colors.primary;
  if (type === 'error') {
    backgroundColor = colors.error;
  } else if (type === 'success') {
    backgroundColor = colors.success;
  }

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: insets.top + spacing.md,
      left: spacing.md,
      right: spacing.md,
      backgroundColor,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 9999,
      opacity,
    },
    text: {
      ...typography.body,
      color: colors.buttonText,
      textAlign: 'center',
      fontWeight: '500',
    },
  });

  if (!visible) {
    return null;
  }

  return (
    <Animated.View testID="toast" style={styles.container}>
      <Text testID="toast-message" style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

Toast.propTypes = {
  visible: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['success', 'error', 'info']).isRequired,
};
