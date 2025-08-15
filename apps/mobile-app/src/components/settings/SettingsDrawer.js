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
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';

function SettingsDrawer({ navigation }) {
  const colors = useThemeColors();
  const { user } = useAuth();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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

  const getInitials = (username) => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };

  return (
    <SafeAreaView testID="settings-drawer" style={styles.container}>
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
        </View>
      </View>

      <ScrollView style={styles.navigation}>
        <TouchableOpacity
          testID="settings-nav-item"
          style={styles.navItem}
          onPress={handleSettingsPress}
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
        >
          <Icon
            name="information-circle-outline"
            size={20}
            color={colors.primary}
            style={styles.navIcon}
          />
          <Text style={styles.navText}>About</Text>
        </TouchableOpacity>
      </ScrollView>
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
