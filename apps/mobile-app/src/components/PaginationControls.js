/**
 * PaginationControls Component
 * Provides arrow-based navigation with page indicator
 */

import {
  View, TouchableOpacity, Text, StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { spacing } from '../design-system/spacing';
import { typography } from '../design-system/typography';

function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
  testID = 'pagination-controls',
}) {
  const colors = useThemeColors();

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const handlePreviousPage = () => {
    if (!isLoading && currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (!isLoading && currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Accessibility helpers
  const getLeftArrowAccessibilityHint = () => {
    if (isLoading) return 'Loading, please wait';
    if (isFirstPage) return 'Already on first page';
    return `Navigate to page ${currentPage - 1}`;
  };

  const getRightArrowAccessibilityHint = () => {
    if (isLoading) return 'Loading, please wait';
    if (isLastPage) return 'Already on last page';
    return `Navigate to page ${currentPage + 1}`;
  };

  const getPageIndicatorAccessibilityLabel = () => {
    if (isLoading) return 'Loading pagination information';
    return `Currently on page ${currentPage} of ${totalPages}`;
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      position: 'absolute',
      bottom: spacing.xl,
      left: spacing.lg,
      right: spacing.lg,
      borderRadius: 8,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    arrowButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    arrowButtonDisabled: {
      backgroundColor: colors.textLight,
      opacity: 0.3,
    },
    arrowText: {
      fontSize: 18,
      color: colors.surface,
      fontWeight: '600',
    },
    arrowTextDisabled: {
      color: colors.textLight,
    },
    pageIndicator: {
      ...typography.body,
      color: colors.text,
      marginHorizontal: spacing.lg,
      fontWeight: '500',
    },
    liveRegion: {
      position: 'absolute',
      left: -10000,
    },
  });

  return (
    <View testID={testID} style={styles.container}>
      <TouchableOpacity
        testID="pagination-left-arrow"
        style={[
          styles.arrowButton,
          (isLoading || isFirstPage) && styles.arrowButtonDisabled,
        ]}
        onPress={handlePreviousPage}
        disabled={isLoading || isFirstPage}
        accessibilityRole="button"
        accessibilityLabel="Go to previous page"
        accessibilityHint={getLeftArrowAccessibilityHint()}
        accessibilityState={{ disabled: isLoading || isFirstPage }}
      >
        <Text
          style={[
            styles.arrowText,
            (isLoading || isFirstPage) && styles.arrowTextDisabled,
          ]}
        >
          ←
        </Text>
      </TouchableOpacity>

      <Text
        testID="pagination-page-indicator"
        style={styles.pageIndicator}
        accessibilityLabel={getPageIndicatorAccessibilityLabel()}
        accessibilityRole="text"
      >
        {isLoading ? 'Loading...' : (
          <>
            Page
            {' '}
            {currentPage}
            {' '}
            of
            {' '}
            {totalPages}
          </>
        )}
      </Text>

      <TouchableOpacity
        testID="pagination-right-arrow"
        style={[
          styles.arrowButton,
          (isLoading || isLastPage) && styles.arrowButtonDisabled,
        ]}
        onPress={handleNextPage}
        disabled={isLoading || isLastPage}
        accessibilityRole="button"
        accessibilityLabel="Go to next page"
        accessibilityHint={getRightArrowAccessibilityHint()}
        accessibilityState={{ disabled: isLoading || isLastPage }}
      >
        <Text
          style={[
            styles.arrowText,
            (isLoading || isLastPage) && styles.arrowTextDisabled,
          ]}
        >
          →
        </Text>
      </TouchableOpacity>

      <Text
        testID="pagination-live-region"
        style={styles.liveRegion}
        accessibilityLiveRegion="polite"
      >
        {isLoading ? 'Loading page...' : `Page ${currentPage} of ${totalPages}`}
      </Text>
    </View>
  );
}

PaginationControls.propTypes = {
  currentPage: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  testID: PropTypes.string,
};

PaginationControls.defaultProps = {
  isLoading: false,
  testID: 'pagination-controls',
};

export default PaginationControls;
