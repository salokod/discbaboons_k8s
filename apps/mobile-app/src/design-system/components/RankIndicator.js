/**
 * RankIndicator Component
 * Displays rank indicators with shape+color accessibility for standings
 */

import { memo, useMemo } from 'react';
import { View, Text } from 'react-native';
import PropTypes from 'prop-types';

function RankIndicator({ rank, totalPlayers, size }) {
  // Calculate performance classification
  const performanceClassification = useMemo(() => {
    if (!rank || !totalPlayers) return 'unknown';

    if (rank === 1) {
      return 'excellent';
    }

    // Top 33% (excluding first place) is good
    const topThirdCutoff = Math.ceil(totalPlayers * 0.33);
    if (rank <= topThirdCutoff) {
      return 'good';
    }

    // Bottom ranks need improvement
    return 'needs-improvement';
  }, [rank, totalPlayers]);

  // Get indicator emoji and description
  const getIndicatorEmoji = () => {
    const indicators = {
      excellent: '🟡', // Yellow circle
      good: '🟢', // Green circle
      'needs-improvement': '🔴', // Red circle
      unknown: '⚪', // White circle
    };
    return indicators[performanceClassification];
  };

  const getShapeColorDescription = () => {
    const descriptions = {
      excellent: 'Yellow circle',
      good: 'Green circle',
      'needs-improvement': 'Red circle',
      unknown: 'White circle',
    };
    return descriptions[performanceClassification];
  };

  // Generate accessibility label
  const getAccessibilityLabel = () => {
    const performanceLabels = {
      excellent: 'Excellent performance',
      good: 'Good performance',
      'needs-improvement': 'Needs improvement',
      unknown: 'Performance unknown',
    };

    return `Rank ${rank} of ${totalPlayers}. ${getShapeColorDescription()} indicator. ${performanceLabels[performanceClassification]}.`;
  };

  // WCAG AA compliant styling
  const getStyles = () => {
    const minTouchTarget = 44; // WCAG AA minimum touch target
    const actualSize = size || 24; // Default size for display

    return {
      container: {
        minWidth: minTouchTarget,
        minHeight: minTouchTarget,
        justifyContent: 'center',
        alignItems: 'center',
      },
      text: {
        fontSize: actualSize,
        lineHeight: actualSize + 4, // Slight padding for better readability
      },
    };
  };

  const styles = getStyles();

  return (
    <View
      testID="rank-indicator"
      accessibilityRole="text"
      accessibilityLabel={getAccessibilityLabel()}
      style={styles.container}
    >
      <Text style={styles.text}>{getIndicatorEmoji()}</Text>
    </View>
  );
}

RankIndicator.propTypes = {
  rank: PropTypes.number,
  totalPlayers: PropTypes.number,
  size: PropTypes.number,
};

RankIndicator.defaultProps = {
  rank: null,
  totalPlayers: null,
  size: 24,
};

// Add display name for React DevTools
RankIndicator.displayName = 'RankIndicator';

export default memo(RankIndicator);
