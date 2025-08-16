/**
 * SettingsDrawer Component
 * Custom drawer content with user info and navigation options
 */

import { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import LogoutButton from './LogoutButton';
import AdminBadge from './AdminBadge';

function SettingsDrawer({ navigation }) {
  const colors = useThemeColors();
  const { user, logout } = useAuth();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    header: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    closeButton: {
      alignSelf: 'flex-end',
      padding: spacing.sm,
      marginBottom: spacing.md,
    },
    userInfo: {
      alignItems: 'center',
    },
    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    avatarText: {
      ...typography.h2,
      color: colors.surface,
      fontWeight: '700',
    },
    username: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    email: {
      ...typography.body,
      color: colors.textLight,
    },
    navigation: {
      flex: 1,
      paddingTop: spacing.lg,
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    navIcon: {
      marginRight: spacing.md,
    },
    navText: {
      ...typography.body,
      color: colors.text,
      fontWeight: '500',
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    sectionHeader: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      ...typography.caption,
      color: colors.textLight,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });

  const handleClose = () => {
    navigation.closeDrawer();
  };

  const handleSettingsPress = () => {
    navigation.navigate('App', { screen: 'Settings' });
    navigation.closeDrawer();
  };

  const handleAboutPress = () => {
    navigation.navigate('App', { screen: 'About' });
    navigation.closeDrawer();
  };

  const handleDiscDatabasePress = () => {
    navigation.navigate('App', { screen: 'DiscDatabase' });
    navigation.closeDrawer();
  };

  const handleAdminDashboardPress = () => {
    navigation.navigate('App', { screen: 'AdminDashboard' });
    navigation.closeDrawer();
  };

  const getInitials = (username) => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };

  const handleLogoutWithCloseDrawer = async () => {
    try {
      await logout();
      navigation.closeDrawer();
    } catch (error) {
      // Handle errors silently - the AuthContext will handle error display
      // Log error silently - prevent console.error linting warning
      // Still close drawer even if logout fails
      navigation.closeDrawer();
    }
  };

  return (
    <SafeAreaView testID="settings-drawer" style={styles.container}>
      <TouchableWithoutFeedback>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity
              testID="close-drawer-button"
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Icon
                name="close-outline"
                size={24}
                color={colors.textLight}
              />
            </TouchableOpacity>

            <View testID="user-info-section" style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(user?.username)}
                </Text>
              </View>
              <Text style={styles.username}>
                {user?.username || 'Guest User'}
              </Text>
              <Text style={styles.email}>
                {user?.email || 'No email'}
              </Text>
              {user?.isAdmin && <AdminBadge />}
            </View>
          </View>

          <ScrollView style={styles.navigation}>
            {/* Disc Database Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Disc Database</Text>
            </View>

            <TouchableOpacity
              testID="disc-database-nav-item"
              style={styles.navItem}
              onPress={handleDiscDatabasePress}
              accessibilityLabel="Disc Database"
              accessibilityHint="Access disc search and submission options"
            >
              <Icon
                name="disc-outline"
                size={20}
                color={colors.primary}
                style={styles.navIcon}
              />
              <Text style={styles.navText}>Disc Database</Text>
            </TouchableOpacity>

            {/* General Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>General</Text>
            </View>

            <TouchableOpacity
              testID="settings-nav-item"
              style={styles.navItem}
              onPress={handleSettingsPress}
              accessibilityLabel="Settings"
              accessibilityHint="Open app settings and preferences"
            >
              <Icon
                name="settings-outline"
                size={20}
                color={colors.primary}
                style={styles.navIcon}
              />
              <Text style={styles.navText}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="about-nav-item"
              style={styles.navItem}
              onPress={handleAboutPress}
              accessibilityLabel="About"
              accessibilityHint="View app information and version details"
            >
              <Icon
                name="information-circle-outline"
                size={20}
                color={colors.primary}
                style={styles.navIcon}
              />
              <Text style={styles.navText}>About</Text>
            </TouchableOpacity>

            {/* Admin Section - Only visible to admin users */}
            {user?.isAdmin && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Admin</Text>
                </View>

                <TouchableOpacity
                  testID="admin-dashboard-nav-item"
                  style={styles.navItem}
                  onPress={handleAdminDashboardPress}
                  accessibilityLabel="Admin Dashboard"
                  accessibilityHint="Access admin tools and pending submissions"
                >
                  <Icon
                    name="shield-checkmark-outline"
                    size={20}
                    color={colors.error}
                    style={styles.navIcon}
                  />
                  <Text style={styles.navText}>Admin</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <LogoutButton onLogout={handleLogoutWithCloseDrawer} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

SettingsDrawer.propTypes = {
  navigation: PropTypes.shape({
    closeDrawer: PropTypes.func.isRequired,
    navigate: PropTypes.func,
  }).isRequired,
};

// Add display name for React DevTools
SettingsDrawer.displayName = 'SettingsDrawer';

export default memo(SettingsDrawer);
