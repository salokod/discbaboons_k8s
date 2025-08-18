/**
 * ProgressIndicator Component
 * Reusable progress display component with accessibility support
 * Follows existing component patterns from the codebase
 */

import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

function ProgressIndicator({
  processedItems,
  totalItems,
  currentItem,
  operationType,
  failedItems,
  style,
}) {
  const colors = useThemeColors();

  // Ensure non-negative values
  const safeProcessedItems = Math.max(0, processedItems || 0);
  const safeTotalItems = Math.max(0, totalItems || 0);
  const safeFailedItems = Math.max(0, failedItems || 0);

  // Calculate progress percentage
  const progressPercentage = safeTotalItems > 0
    ? Math.min(100, (safeProcessedItems / safeTotalItems) * 100)
    : 0;

  // Generate progress text
  const getProgressText = () => {
    let text = '';

    if (operationType) {
      let operationLabel;
      if (operationType === 'move') {
        operationLabel = 'Moving';
      } else if (operationType === 'remove') {
        operationLabel = 'Removing';
      } else {
        operationLabel = `${operationType.charAt(0).toUpperCase() + operationType.slice(1)}ing`;
      }
      text = `${operationLabel} ${safeProcessedItems} of ${safeTotalItems}`;
    } else {
      text = `${safeProcessedItems} of ${safeTotalItems}`;
    }

    if (safeFailedItems > 0) {
      text += ` (${safeFailedItems} failed)`;
    }

    return text;
  };

  // Generate accessibility label
  const getAccessibilityLabel = () => {
    let label = 'Progress: ';

    if (operationType) {
      let operationLabel;
      if (operationType === 'move') {
        operationLabel = 'Moving';
      } else if (operationType === 'remove') {
        operationLabel = 'Removing';
      } else {
        operationLabel = `${operationType.charAt(0).toUpperCase() + operationType.slice(1)}ing`;
      }
      label += `${operationLabel} ${safeProcessedItems} of ${safeTotalItems} items`;
    } else {
      label += `${safeProcessedItems} of ${safeTotalItems} items`;
    }

    label += `, ${Math.round(progressPercentage)}% complete`;

    if (safeFailedItems > 0) {
      label += `, ${safeFailedItems} failed`;
    }

    return label;
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: spacing.sm,
    },
    progressText: {
      ...typography.bodyBold,
      color: colors.text,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    currentItemContainer: {
      marginTop: spacing.xs,
    },
    currentItemText: {
      ...typography.caption,
      color: colors.textLight,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

  return (
    <View
      testID="progress-indicator"
      style={[styles.container, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={getAccessibilityLabel()}
    >
      <Text style={styles.progressText}>
        {getProgressText()}
      </Text>

      <View testID="progress-bar" style={styles.progressBarContainer}>
        <View
          testID="progress-fill"
          style={[
            styles.progressFill,
            { width: `${progressPercentage}%` },
          ]}
        />
      </View>

      {currentItem && (
        <View testID="current-item" style={styles.currentItemContainer}>
          <Text style={styles.currentItemText}>
            {currentItem}
          </Text>
        </View>
      )}
    </View>
  );
}

ProgressIndicator.propTypes = {
  processedItems: PropTypes.number.isRequired,
  totalItems: PropTypes.number.isRequired,
  currentItem: PropTypes.string,
  operationType: PropTypes.oneOf(['move', 'remove']),
  failedItems: PropTypes.number,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

ProgressIndicator.defaultProps = {
  currentItem: null,
  operationType: null,
  failedItems: 0,
  style: null,
};

export default ProgressIndicator;
