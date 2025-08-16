/**
 * EmptyBagsScreen Component
 */

import { memo } from 'react';
import {
  SafeAreaView, StyleSheet, View, Text, Alert, Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/spacing';
import { typography } from '../../design-system/typography';
import AppContainer from '../../components/AppContainer';
import EmptyState from '../../design-system/components/EmptyState';
import Button from '../../components/Button';
import { getTokens } from '../../services/tokenStorage';

function EmptyBagsScreen({ navigation, onCreateFirstBag }) {
  const colors = useThemeColors();

  // Debug function to check auth status
  const checkAuthAndNavigate = async (screenName) => {
    try {
      const tokens = await getTokens();
      if (!tokens || !tokens.accessToken) {
        Alert.alert('Authentication Error', 'No access token found. Please log in again.');
        return;
      }
      navigation?.navigate(screenName);
    } catch (error) {
      Alert.alert('Authentication Error', `Error checking authentication: ${error.message}`);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    discSection: {
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
      paddingBottom: Platform.select({
        ios: spacing.lg,
        android: spacing.xl, // Extra bottom padding for Android
      }),
    },
    discSectionTitle: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    button: {
      marginBottom: spacing.sm,
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

        <View style={styles.discSection}>
          <Text style={styles.discSectionTitle}>Disc Database</Text>

          <Button
            title="Search Discs"
            onPress={() => checkAuthAndNavigate('DiscSearchScreen')}
            style={styles.button}
            variant="secondary"
          />
        </View>
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
