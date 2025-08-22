/**
 * EmptyState Component
 */

import { View, Text, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../spacing';
import { typography } from '../typography';
import Button from '../../components/Button';

function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryActionText,
  onSecondaryActionPress,
  children,
}) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    title: {
      ...typography.h2,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    actionButton: {
      marginTop: spacing.md,
    },
    secondaryActionButton: {
      marginTop: spacing.sm,
    },
    children: {
      marginTop: spacing.md,
    },
  });

  return (
    <View testID="empty-state" style={styles.container}>
      {title && (
        <Text testID="empty-state-title" style={styles.title}>
          {title}
        </Text>
      )}
      {subtitle && (
        <Text testID="empty-state-subtitle" style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <View testID="empty-state-action" style={styles.actionButton}>
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
          />
        </View>
      )}
      {secondaryActionText && onSecondaryActionPress && (
        <View testID="empty-state-secondary-action" style={styles.secondaryActionButton}>
          <Button
            title={secondaryActionText}
            onPress={onSecondaryActionPress}
            variant="outline"
          />
        </View>
      )}
      {children && (
        <View style={styles.children}>
          {children}
        </View>
      )}
    </View>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  secondaryActionText: PropTypes.string,
  onSecondaryActionPress: PropTypes.func,
  children: PropTypes.node,
};

EmptyState.defaultProps = {
  title: undefined,
  subtitle: undefined,
  actionLabel: undefined,
  onAction: undefined,
  secondaryActionText: undefined,
  onSecondaryActionPress: undefined,
  children: undefined,
};

// Add display name for React DevTools
EmptyState.displayName = 'EmptyState';

export default EmptyState;
