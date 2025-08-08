/**
 * BagsListScreen Component
 */

import { memo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import AppContainer from '../../components/AppContainer';
import EmptyBagsScreen from './EmptyBagsScreen';

function BagsListScreen() {
  const colors = useThemeColors();
  const [bags] = useState([]); // Empty for now, will be loaded from API

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerTitle: {
      ...typography.h2,
      color: colors.text,
    },
  });

  const handleCreateFirstBag = () => {
    // TODO: Navigate to CreateBagScreen
  };

  // Show empty state if no bags
  if (bags.length === 0) {
    return <EmptyBagsScreen onCreateFirstBag={handleCreateFirstBag} />;
  }

  return (
    <SafeAreaView testID="bags-list-screen" style={styles.container}>
      <AppContainer>
        <Text style={styles.headerTitle}>Your Bags</Text>
        {/* TODO: Add SearchBar, bag cards, FAB */}
      </AppContainer>
    </SafeAreaView>
  );
}

// Add display name for React DevTools
BagsListScreen.displayName = 'BagsListScreen';

export default memo(BagsListScreen);
