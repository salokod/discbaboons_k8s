/**
 * AccountSettingsSkeleton Component
 * Skeleton loading screen for AccountSettingsScreen
 */

import { memo } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../AppContainer';
import SkeletonLoader from './SkeletonLoader';

function AccountSettingsSkeleton() {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
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
      marginBottom: spacing.xl,
      alignItems: 'center',
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    sectionIcon: {
      marginRight: spacing.sm,
    },
    inputGroup: {
      marginBottom: spacing.md,
    },
    label: {
      marginBottom: spacing.xs,
    },
    textArea: {
      height: 80,
    },
    privacyToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    toggleButton: {
      width: 80,
      height: 32,
      borderRadius: 20,
    },
    actionButton: {
      marginTop: spacing.lg,
      height: 48,
      borderRadius: Platform.select({
        ios: 12,
        android: 8,
      }),
    },
  });

  return (
    <AppContainer>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Skeleton */}
          <View style={styles.header} testID="skeleton-header">
            <SkeletonLoader width="60%" height={32} borderRadius={8} />
            <View style={{ height: spacing.sm }} />
            <SkeletonLoader width="80%" height={20} borderRadius={4} />
          </View>

          {/* Profile Information Section Skeleton */}
          <View style={styles.section} testID="skeleton-profile-section">
            <View style={styles.sectionHeader}>
              <SkeletonLoader
                width={24}
                height={24}
                borderRadius={12}
                style={styles.sectionIcon}
              />
              <SkeletonLoader width="40%" height={24} borderRadius={4} />
            </View>

            {/* Input Fields Skeleton */}
            {/* Display Name */}
            <View style={styles.inputGroup}>
              <View style={styles.label}>
                <SkeletonLoader width="30%" height={14} borderRadius={2} />
              </View>
              <SkeletonLoader height={48} borderRadius={8} testID="skeleton-input" />
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <View style={styles.label}>
                <SkeletonLoader width="20%" height={14} borderRadius={2} />
              </View>
              <SkeletonLoader
                height={80}
                borderRadius={8}
                style={styles.textArea}
                testID="skeleton-input"
              />
            </View>

            {/* City */}
            <View style={styles.inputGroup}>
              <View style={styles.label}>
                <SkeletonLoader width="25%" height={14} borderRadius={2} />
              </View>
              <SkeletonLoader height={48} borderRadius={8} testID="skeleton-input" />
            </View>

            {/* State/Province */}
            <View style={styles.inputGroup}>
              <View style={styles.label}>
                <SkeletonLoader width="35%" height={14} borderRadius={2} />
              </View>
              <SkeletonLoader height={48} borderRadius={8} testID="skeleton-input" />
            </View>

            {/* Country */}
            <View style={styles.inputGroup}>
              <View style={styles.label}>
                <SkeletonLoader width="30%" height={14} borderRadius={2} />
              </View>
              <SkeletonLoader height={48} borderRadius={8} testID="skeleton-input" />
            </View>
          </View>

          {/* Privacy Settings Section Skeleton */}
          <View style={styles.section} testID="skeleton-privacy-section">
            <View style={styles.sectionHeader}>
              <SkeletonLoader
                width={24}
                height={24}
                borderRadius={12}
                style={styles.sectionIcon}
              />
              <SkeletonLoader width="45%" height={24} borderRadius={4} />
            </View>

            {/* Privacy Toggles */}
            {/* Name privacy */}
            <View style={styles.privacyToggle}>
              <SkeletonLoader width="60%" height={16} borderRadius={2} />
              <SkeletonLoader
                width={80}
                height={32}
                borderRadius={20}
                style={styles.toggleButton}
                testID="skeleton-toggle"
              />
            </View>

            {/* Bio privacy */}
            <View style={styles.privacyToggle}>
              <SkeletonLoader width="55%" height={16} borderRadius={2} />
              <SkeletonLoader
                width={80}
                height={32}
                borderRadius={20}
                style={styles.toggleButton}
                testID="skeleton-toggle"
              />
            </View>

            {/* Location privacy */}
            <View style={styles.privacyToggle}>
              <SkeletonLoader width="65%" height={16} borderRadius={2} />
              <SkeletonLoader
                width={80}
                height={32}
                borderRadius={20}
                style={styles.toggleButton}
                testID="skeleton-toggle"
              />
            </View>
          </View>

          {/* Action Button Skeleton */}
          <SkeletonLoader
            height={48}
            borderRadius={Platform.select({ ios: 12, android: 8 })}
            style={styles.actionButton}
            testID="skeleton-save-button"
          />

        </ScrollView>
      </SafeAreaView>
    </AppContainer>
  );
}

// Add display name for React DevTools
AccountSettingsSkeleton.displayName = 'AccountSettingsSkeleton';

export default memo(AccountSettingsSkeleton);
