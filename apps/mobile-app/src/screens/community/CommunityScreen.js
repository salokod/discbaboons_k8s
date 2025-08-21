/**
 * CommunityScreen Component
 * Placeholder screen for community functionality
 */

import { memo } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';

function CommunityScreen() {
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
      <SafeAreaView testID="community-screen" style={styles.container}>
        <View style={styles.content}>
          <Icon
            name="people-outline"
            size={80}
            color={colors.textLight}
            style={styles.icon}
          />
          <Text style={styles.title}>Community Coming Soon</Text>
          <Text style={styles.subtitle}>
            Connect with fellow disc golfers, share tips, and join the baboons community.
            This feature is currently in development.
          </Text>
        </View>
      </SafeAreaView>
    </AppContainer>
  );
}

CommunityScreen.displayName = 'CommunityScreen';

export default memo(CommunityScreen);
