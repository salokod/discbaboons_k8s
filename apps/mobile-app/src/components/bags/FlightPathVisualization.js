/**
 * FlightPathVisualization Component
 * Shows a visual representation of disc flight based on flight numbers
 * For RHBH (Right Hand Back Hand): Turn negative = right, Fade positive = left
 */

import { memo } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/spacing';

function FlightPathVisualization({
  turn, fade, width = 80, height = 100,
}) {
  const colors = useThemeColors();

  // Calculate flight path for RHBH throw (bottom to top)
  // Start position (bottom center)
  const startX = width * 0.5; // Center horizontally
  const startY = height * 0.9; // 90% from top (near bottom)

  // Turn phase (negative turn = right curve for RHBH)
  // The disc flies up and curves based on turn
  const turnDistance = height * 0.5; // Middle of flight
  const turnX = startX + (-turn * 5); // Negative turn moves right
  const turnY = startY - turnDistance; // Move up

  // End position (fade phase - positive fade = left curve for RHBH)
  const endDistance = height * 0.8; // Near top
  const endX = turnX - (fade * 5); // Positive fade moves left
  const endY = startY - endDistance; // Near top

  // Constrain X positions within bounds
  const constrainX = (x) => Math.max(spacing.xs, Math.min(width - spacing.xs, x));

  const finalTurnX = constrainX(turnX);
  const finalEndX = constrainX(endX);

  const styles = StyleSheet.create({
    container: {
      width,
      height,
      position: 'relative',
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    // Flight path segments
    launchPoint: {
      position: 'absolute',
      left: startX - 3,
      top: startY - 3,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      borderWidth: 1,
      borderColor: colors.surface,
      zIndex: 3,
    },
    throwerPosition: {
      position: 'absolute',
      left: width * 0.5 - 4,
      top: height * 0.95 - 4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.textLight,
      opacity: 0.5,
      zIndex: 2,
    },
    turnPoint: {
      position: 'absolute',
      left: finalTurnX - 3,
      top: turnY - 3,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.warning,
      zIndex: 2,
    },
    landingPoint: {
      position: 'absolute',
      left: finalEndX - 3,
      top: endY - 3,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.error,
      borderWidth: 1,
      borderColor: colors.surface,
      zIndex: 3,
    },
    // Path curves - using vertical paths
    pathLine: {
      position: 'absolute',
      backgroundColor: colors.primary,
      opacity: 0.7,
      borderRadius: 1,
    },
    pathLineSegment: {
      position: 'absolute',
      height: 2.5,
      transformOrigin: '0 50%',
      backgroundColor: colors.primary,
      opacity: 0.7,
      borderRadius: 1,
    },
    // Reference line (center vertical) - shows straight throw path
    centerLine: {
      position: 'absolute',
      left: width * 0.5 - 0.5,
      top: height * 0.1,
      width: 1,
      height: height * 0.8,
      backgroundColor: colors.textLight,
      opacity: 0.3,
    },
    // Dotted appearance for reference line
    centerLineDot: {
      position: 'absolute',
      left: width * 0.5 - 0.5,
      width: 1,
      height: 4,
      backgroundColor: colors.textLight,
      opacity: 0.4,
    },
  });

  // Create multiple segments for a smooth curved path effect
  const segments = [];
  const numSegments = 30; // More segments for smoother curve

  for (let i = 0; i < numSegments; i += 1) {
    const t = i / (numSegments - 1);

    // Create smooth curve through the three key points
    let x; let
      y;

    if (t <= 0.5) {
      // First half - launch to turn point
      // Use quadratic bezier for smooth curve
      const localT = t * 2;
      const smoothT = localT * localT * (3 - 2 * localT); // Smooth step function

      x = startX + (finalTurnX - startX) * smoothT;
      y = startY - (startY - turnY) * localT;
    } else {
      // Second half - turn point to landing
      const localT = (t - 0.5) * 2;
      const smoothT = localT * localT * (3 - 2 * localT); // Smooth step function

      x = finalTurnX + (finalEndX - finalTurnX) * smoothT;
      y = turnY - (turnY - endY) * localT;
    }

    segments.push({ x, y });
  }

  // Create dotted reference line
  const dotCount = 8;
  const dots = [];
  for (let i = 0; i < dotCount; i += 1) {
    dots.push({
      top: height * 0.1 + ((i * height * 0.8) / dotCount),
    });
  }

  return (
    <View style={styles.container}>
      {/* Center reference line - dotted to show straight throw path */}
      {dots.map((dot) => (
        <View
          key={`dot-${dot.top}`}
          style={[
            styles.centerLineDot,
            { top: dot.top },
          ]}
        />
      ))}

      {/* Flight path - draw as connected segments */}
      {segments.map((segment, index) => {
        if (index === 0) return null;
        const prevSegment = segments[index - 1];

        const segmentLength = Math.sqrt(
          (segment.x - prevSegment.x) ** 2
          + (segment.y - prevSegment.y) ** 2,
        );

        const angle = Math.atan2(
          segment.y - prevSegment.y,
          segment.x - prevSegment.x,
        );

        return (
          <View
            key={`segment-${prevSegment.x}-${prevSegment.y}-${segment.x}-${segment.y}`}
            style={[
              styles.pathLineSegment,
              {
                left: prevSegment.x,
                top: prevSegment.y - 1,
                width: segmentLength + 1,
                transform: [
                  { rotateZ: `${angle}rad` },
                ],
              },
            ]}
          />
        );
      })}

      {/* Flight points */}
      <View style={styles.throwerPosition} />
      <View style={styles.landingPoint} />
    </View>
  );
}

FlightPathVisualization.propTypes = {
  turn: PropTypes.number.isRequired,
  fade: PropTypes.number.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
};

FlightPathVisualization.defaultProps = {
  width: 80,
  height: 100,
};

FlightPathVisualization.displayName = 'FlightPathVisualization';

export default memo(FlightPathVisualization);
