/**
 * EmptyBagsScreen Component
 */

import { memo } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import AppContainer from '../../components/AppContainer';
import EmptyState from '../../design-system/components/EmptyState';

function EmptyBagsScreen({ navigation, onCreateFirstBag }) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });

  const handleCreateFirstBag = () => {
    navigation?.navigate('CreateBag');
    onCreateFirstBag?.();
  };

  return (
    <SafeAreaView testID="empty-bags-screen" style={styles.container}>
      <AppContainer>
        <EmptyState
          title="Organize Your Disc Golf Collection"
          subtitle="Keep track of all your discs, bags, and home collection. Create bags like 'Home Collection', 'Tournament Bag', or 'Glow Round' to organize your discs however you like."
          actionLabel="Create First Bag"
          onAction={handleCreateFirstBag}
        />
      </AppContainer>
    </SafeAreaView>
  );
}

EmptyBagsScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }),
  onCreateFirstBag: PropTypes.func,
};

EmptyBagsScreen.defaultProps = {
  navigation: null,
  onCreateFirstBag: () => {},
};

// Add display name for React DevTools
EmptyBagsScreen.displayName = 'EmptyBagsScreen';

export default memo(EmptyBagsScreen);
