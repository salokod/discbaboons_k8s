/**
 * EmptyRoundsScreen Component
 */

import { memo } from 'react';
import {
  StyleSheet,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import AppContainer from '../../components/AppContainer';
import StatusBarSafeView from '../../components/StatusBarSafeView';
import EmptyState from '../../design-system/components/EmptyState';

function EmptyRoundsScreen({ navigation, onCreateFirstRound }) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });

  const handleCreateFirstRound = () => {
    navigation?.navigate('CreateRound');
    onCreateFirstRound?.();
  };

  return (
    <StatusBarSafeView testID="empty-rounds-screen" style={styles.container}>
      <AppContainer>
        <EmptyState
          title="No rounds yet"
          subtitle="Start tracking your disc golf rounds, scores, and course progress. Create your first round to get started."
          actionLabel="Create First Round"
          onAction={handleCreateFirstRound}
        />
      </AppContainer>
    </StatusBarSafeView>
  );
}

EmptyRoundsScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }),
  onCreateFirstRound: PropTypes.func,
};

EmptyRoundsScreen.defaultProps = {
  navigation: null,
  onCreateFirstRound: () => {},
};

// Add display name for React DevTools
EmptyRoundsScreen.displayName = 'EmptyRoundsScreen';

export default memo(EmptyRoundsScreen);
