/**
 * RoundStatusBadge Component
 * Displays a color-coded badge for round status
 */

import { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/spacing';
import { typography } from '../../design-system/typography';

// Status color mapping per UX specification
const STATUS_COLORS = {
  pending: '#FFC107', // Yellow
  confirmed: '#4CAF50', // Green
  in_progress: '#2196F3', // Blue
  completed: '#9E9E9E', // Gray
  cancelled: '#F44336', // Red
};

// Status label mapping per UX specification
const STATUS_LABELS = {
  pending: 'PENDING CONFIRMATION',
  confirmed: 'READY TO PLAY',
  in_progress: 'ROUND IN PROGRESS',
  completed: 'ROUND COMPLETE',
  cancelled: 'CANCELLED',
};

// Get status label text
function getStatusLabel(status) {
  if (!status) return 'Unknown';

  // Return predefined label or format unknown status
  return STATUS_LABELS[status] || status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function RoundStatusBadge({ status }) {
  const colors = useThemeColors();

  const backgroundColor = STATUS_COLORS[status] || '#9E9E9E';
  const statusText = getStatusLabel(status);

  const styles = StyleSheet.create({
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: Platform.select({
        ios: 8,
        android: 6,
      }),
      backgroundColor,
      ...Platform.select({
        android: {
          elevation: 1,
        },
        ios: {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 1,
        },
      }),
    },
    text: {
      ...typography.caption,
      fontWeight: Platform.select({
        ios: 'bold',
        android: '700',
      }),
      fontSize: 11,
      color: colors.white,
      letterSpacing: 0.5,
    },
  });

  return (
    <View
      testID="round-status-badge"
      style={styles.badge}
      accessibilityLabel={`Round status: ${statusText}`}
      accessibilityHint={`This round is ${statusText.toLowerCase()}`}
    >
      <Text style={styles.text}>{statusText}</Text>
    </View>
  );
}

RoundStatusBadge.propTypes = {
  status: PropTypes.oneOf([
    'pending',
    'confirmed',
    'in_progress',
    'completed',
    'cancelled',
  ]),
};

RoundStatusBadge.defaultProps = {
  status: null,
};

// Add display name for React DevTools
RoundStatusBadge.displayName = 'RoundStatusBadge';

export default memo(RoundStatusBadge);
