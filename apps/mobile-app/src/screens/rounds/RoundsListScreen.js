/**
 * RoundsListScreen Component
 */

import {
  memo, useState, useEffect, useCallback,
} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/spacing';
import EmptyRoundsScreen from './EmptyRoundsScreen';

function RoundsListScreen({ navigation }) {
  const colors = useThemeColors();
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulate loading for now - will be replaced with actual API call later
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setRounds([]); // Empty for now - will be populated with actual data later
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Navigate to create round
  const handleCreateFirstRound = useCallback(() => {
    navigation?.navigate('CreateRound');
  }, [navigation]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    createButton: {
      position: 'absolute',
      bottom: spacing.xl,
      right: spacing.lg,
      backgroundColor: colors.primary,
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    createButtonText: {
      fontSize: 24,
      color: colors.surface,
    },
  });

  // Show loading state on first load
  if (loading && rounds.length === 0) {
    return (
      <SafeAreaView testID="rounds-list-screen" style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[{ color: colors.textLight, marginTop: spacing.md }]}>
            Loading rounds...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state if no rounds
  if (!loading && rounds.length === 0) {
    return (
      <>
        <EmptyRoundsScreen
          navigation={navigation}
          onCreateFirstRound={handleCreateFirstRound}
        />
        <TouchableOpacity
          testID="rounds-fab-button"
          style={styles.createButton}
          onPress={() => navigation?.navigate('CreateRound')}
        >
          <Text style={styles.createButtonText}>+</Text>
        </TouchableOpacity>
      </>
    );
  }

  // Will add the actual rounds list here in later slices
  return (
    <SafeAreaView testID="rounds-list-screen" style={styles.container}>
      <View style={styles.loadingContainer}>
        <Text style={[{ color: colors.text }]}>Rounds list will go here</Text>
      </View>

      <TouchableOpacity
        testID="rounds-fab-button"
        style={styles.createButton}
        onPress={() => navigation?.navigate('CreateRound')}
      >
        <Text style={styles.createButtonText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

RoundsListScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
  }),
};

RoundsListScreen.defaultProps = {
  navigation: null,
};

// Add display name for React DevTools
RoundsListScreen.displayName = 'RoundsListScreen';

export default memo(RoundsListScreen);
