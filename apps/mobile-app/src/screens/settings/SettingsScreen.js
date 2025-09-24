/**
 * SettingsScreen Component
 */

import { memo, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import StatusBarSafeView from '../../components/StatusBarSafeView';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import ThemePicker from '../../components/settings/ThemePicker';

function SettingsScreen({ navigation }) {
  const colors = useThemeColors();
  const { user } = useAuth();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    dismissKeyboard: {
      flex: 1,
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
      color: colors.text,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    headerSubtitle: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      lineHeight: 22,
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
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 12,
        android: 8,
      }),
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    settingItemIcon: {
      marginRight: spacing.md,
    },
    settingItemContent: {
      flex: 1,
    },
    settingItemTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    settingItemDescription: {
      ...typography.caption,
      color: colors.textLight,
      lineHeight: 16,
    },
    chevronIcon: {
      marginLeft: spacing.sm,
    },
    adminSection: {
      marginBottom: spacing.xl * 1.5,
    },
    adminSectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    adminSectionIcon: {
      marginRight: spacing.sm,
    },
    adminSectionTitle: {
      ...typography.h3,
      color: '#DC2626', // Red accent color for admin
      fontWeight: '600',
    },
    adminSectionDescription: {
      ...typography.caption,
      color: colors.textLight,
      marginTop: spacing.xs,
      lineHeight: 18,
    },
    adminSettingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 12,
        android: 8,
      }),
      padding: spacing.md,
      marginBottom: spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: '#DC2626', // Red accent border
    },
  }), [colors]);

  return (
    <AppContainer>
      <StatusBarSafeView style={styles.container}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.dismissKeyboard}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
                <Text style={styles.headerSubtitle}>
                  Customize your disc golf experience
                </Text>
              </View>

              {/* Account Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon
                    name="person-outline"
                    size={24}
                    color={colors.text}
                    style={styles.sectionIcon}
                  />
                  <Text style={styles.sectionTitle}>Account</Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Manage your profile and account settings
                </Text>
                <View style={{ marginTop: spacing.md }}>
                  <TouchableOpacity
                    style={styles.settingItem}
                    onPress={() => navigation.navigate('AccountSettings')}
                  >
                    <Icon
                      name="settings-outline"
                      size={24}
                      color={colors.textLight}
                      style={styles.settingItemIcon}
                    />
                    <View style={styles.settingItemContent}>
                      <Text style={styles.settingItemTitle}>
                        Account Settings
                      </Text>
                      <Text style={styles.settingItemDescription}>
                        Update your profile, privacy settings, and password
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

              {/* Appearance Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon
                    name="color-palette-outline"
                    size={24}
                    color={colors.text}
                    style={styles.sectionIcon}
                  />
                  <Text style={styles.sectionTitle}>Appearance</Text>
                </View>
                <Text style={styles.sectionDescription}>
                  Choose your preferred theme and display settings
                </Text>
                <View style={{ marginTop: spacing.md }}>
                  <ThemePicker />
                </View>
              </View>

              {/* Admin Section - Only visible to admin users */}
              {user?.isAdmin && (
                <View style={styles.adminSection}>
                  <View style={styles.adminSectionHeader}>
                    <Icon
                      name="shield-outline"
                      size={24}
                      color="#DC2626"
                      style={styles.adminSectionIcon}
                    />
                    <Text style={styles.adminSectionTitle}>Administration</Text>
                  </View>
                  <Text style={styles.adminSectionDescription}>
                    Administrative tools and disc database management
                  </Text>
                  <View style={{ marginTop: spacing.md }}>
                    <TouchableOpacity
                      style={styles.adminSettingItem}
                      onPress={() => navigation.navigate('AdminDashboard')}
                    >
                      <Icon
                        name="analytics-outline"
                        size={24}
                        color="#DC2626"
                        style={styles.settingItemIcon}
                      />
                      <View style={styles.settingItemContent}>
                        <Text style={styles.settingItemTitle}>
                          Admin Dashboard
                        </Text>
                        <Text style={styles.settingItemDescription}>
                          Moderate disc submissions and manage database
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
              )}

            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </StatusBarSafeView>
    </AppContainer>
  );
}

export default memo(SettingsScreen);
