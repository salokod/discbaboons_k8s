/**
 * EmptyBagsScreen Component
 */

import { memo } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import AppContainer from '../../components/AppContainer';
import EmptyState from '../../design-system/components/EmptyState';

function EmptyBagsScreen({ onCreateFirstBag }) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });

  return (
    <SafeAreaView testID="empty-bags-screen" style={styles.container}>
      <AppContainer>
        <EmptyState
          title="Start Your Collection"
          subtitle="Create your first bag to organize your discs by course, skill level, or favorites"
          actionLabel="Create First Bag"
          onAction={onCreateFirstBag}
        />
      </AppContainer>
    </SafeAreaView>
  );
}

EmptyBagsScreen.propTypes = {
  onCreateFirstBag: PropTypes.func,
};

EmptyBagsScreen.defaultProps = {
  onCreateFirstBag: () => {},
};

// Add display name for React DevTools
EmptyBagsScreen.displayName = 'EmptyBagsScreen';

export default memo(EmptyBagsScreen);
