/**
 * AdminDashboardScreen Component
 */

import { memo, useMemo } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';

function AdminDashboardScreen({ navigation }) {
  const colors = useThemeColors();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: Platform.select({
        ios: spacing.xl,
        android: spacing.lg,
      }),
      paddingBottom: spacing.xl * 2,
    },
    header: {
      marginBottom: spacing.xl * 1.5,
      alignItems: 'center',
    },
    headerTitle: {
      ...typography.h1,
      color: colors.error, // Admin red color for distinction
      marginBottom: spacing.sm,
      textAlign: 'center',
      fontWeight: '700', // Bolder for admin emphasis
    },
    headerSubtitle: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      lineHeight: 22,
    },
    adminBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.error,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 20,
      marginBottom: spacing.md,
    },
    adminBadgeText: {
      ...typography.caption,
      color: '#FFFFFF',
      fontWeight: '600',
      marginLeft: spacing.xs,
    },
    section: {
      marginBottom: spacing.xl * 1.5,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionIcon: {
      marginRight: spacing.sm,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
    },
    sectionDescription: {
      ...typography.caption,
      color: colors.textLight,
      marginTop: spacing.xs,
      lineHeight: 18,
    },
    adminItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 12,
        android: 8,
      }),
      padding: spacing.md,
      marginBottom: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.error, // Admin accent color
    },
    adminItemIcon: {
      marginRight: spacing.md,
    },
    adminItemContent: {
      flex: 1,
    },
    adminItemTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    adminItemDescription: {
      ...typography.caption,
      color: colors.textLight,
      lineHeight: 16,
    },
    chevronIcon: {
      marginLeft: spacing.sm,
    },
  }), [colors]);

  return (
    <AppContainer>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.adminBadge}>
              <Icon name="shield-checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.adminBadgeText}>ADMIN ACCESS</Text>
            </View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              Manage disc submissions and community content
            </Text>
          </View>

          {/* Administration Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon
                name="checkmark-circle-outline"
                size={24}
                color={colors.error}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Administration</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Review and manage community submissions and content
            </Text>
            <View style={{ marginTop: spacing.md }}>
              <TouchableOpacity
                style={styles.adminItem}
                onPress={() => navigation.navigate('AdminDisc')}
                accessibilityLabel="Review pending disc submissions"
                accessibilityRole="button"
                accessibilityHint="Navigate to pending discs screen"
              >
                <Icon
                  name="time-outline"
                  size={24}
                  color={colors.warning}
                  style={styles.adminItemIcon}
                />
                <View style={styles.adminItemContent}>
                  <Text style={styles.adminItemTitle}>
                    Pending Discs
                  </Text>
                  <Text style={styles.adminItemDescription}>
                    Review and approve community disc submissions
                  </Text>
                </View>
                <Icon
                  name="chevron-forward"
                  size={20}
                  color={colors.textLight}
                  style={styles.chevronIcon}
                />
              </TouchableOpacity>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </AppContainer>
  );
}

export default memo(AdminDashboardScreen);
