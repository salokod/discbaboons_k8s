/**
 * RoundsScreen Component
 * Placeholder screen for rounds functionality
 */

import { memo } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import StatusBarSafeView from '../../components/StatusBarSafeView';

function RoundsScreen() {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    icon: {
      marginBottom: spacing.xl,
    },
    title: {
      ...typography.h2,
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      lineHeight: 22,
    },
  });

  return (
    <AppContainer>
      <StatusBarSafeView testID="rounds-screen" style={styles.container}>
        <View style={styles.content}>
          <Icon
            name="golf-outline"
            size={80}
            color={colors.textLight}
            style={styles.icon}
          />
          <Text style={styles.title}>Rounds Coming Soon</Text>
          <Text style={styles.subtitle}>
            Track your disc golf rounds, scores, and course progress.
            This feature is currently in development.
          </Text>
        </View>
      </StatusBarSafeView>
    </AppContainer>
  );
}

RoundsScreen.displayName = 'RoundsScreen';

export default memo(RoundsScreen);
