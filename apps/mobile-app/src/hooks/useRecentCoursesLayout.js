/**
 * Hook to calculate responsive layout values for recent courses cards
 */

import { useWindowDimensions } from 'react-native';
import { spacing } from '../design-system/spacing';

export const useRecentCoursesLayout = () => {
  const { width } = useWindowDimensions();

  // iPhone SE, small Android (<375px)
  if (width < 375) {
    return {
      cardWidth: 96,
      cardHeight: 96,
      gap: spacing.sm, // 8px
      horizontalPadding: spacing.md, // 16px
      badgeSize: 36,
      nameFontSize: 12,
      cityFontSize: 10,
      timeFontSize: 9,
    };
  }

  // iPhone 14, 15 (375-400px)
  if (width < 400) {
    return {
      cardWidth: 104,
      cardHeight: 104,
      gap: 12,
      horizontalPadding: spacing.md,
      badgeSize: 40,
      nameFontSize: 13,
      cityFontSize: 11,
      timeFontSize: 10,
    };
  }

  // iPhone Pro Max, large Android (>400px)
  return {
    cardWidth: 112,
    cardHeight: 112,
    gap: 12,
    horizontalPadding: spacing.md,
    badgeSize: 44,
    nameFontSize: 13,
    cityFontSize: 11,
    timeFontSize: 10,
  };
};
