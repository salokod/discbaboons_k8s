/**
 * AboutScreen Component
 * Displays static app information and legal links
 */

import { memo } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';

function AboutScreen({ navigation }) {
  const colors = useThemeColors();

  // Get app version from package.json
  const APP_VERSION = '0.0.1';
  const APP_NAME = 'DiscBaboons';

  const handleLinkPress = (url) => {
    Linking.openURL(url).catch(() => {
      // Graceful degradation - do nothing if link can't be opened
    });
  };

  const aboutItems = [
    {
      icon: 'information-circle-outline',
      title: 'App Version',
      value: APP_VERSION,
      type: 'info',
    },
    {
      icon: 'phone-portrait-outline',
      title: 'Platform',
      value: Platform.OS === 'ios' ? 'iOS' : 'Android',
      type: 'info',
    },
    {
      icon: 'document-text-outline',
      title: 'Terms of Service',
      value: 'View our terms',
      type: 'navigation',
      screen: 'TermsOfService',
    },
    {
      icon: 'shield-outline',
      title: 'Privacy Policy',
      value: 'How we protect your data',
      type: 'navigation',
      screen: 'PrivacyPolicy',
    },
    {
      icon: 'help-circle-outline',
      title: 'Support',
      value: 'Get help and send feedback',
      type: 'navigation',
      screen: 'Support',
    },
  ];

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
    appIcon: {
      width: 80,
      height: 80,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    headerTitle: {
      ...typography.h2,
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
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.md,
    },
    aboutItem: {
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
    aboutItemLink: {
      backgroundColor: colors.surface,
    },
    aboutItemIcon: {
      marginRight: spacing.md,
    },
    aboutItemContent: {
      flex: 1,
    },
    aboutItemTitle: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    aboutItemValue: {
      ...typography.caption,
      color: colors.textLight,
      lineHeight: 16,
    },
    aboutItemValueLink: {
      color: colors.primary,
    },
    chevronIcon: {
      marginLeft: spacing.sm,
    },
    footer: {
      alignItems: 'center',
      marginTop: spacing.xl,
      paddingTop: spacing.xl,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    footerText: {
      ...typography.caption,
      color: colors.textLight,
      textAlign: 'center',
      lineHeight: 18,
    },
    footerLink: {
      ...typography.caption,
      color: colors.primary,
      marginTop: spacing.xs,
    },
  });

  return (
    <AppContainer>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.appIcon}>
              <Icon
                name="disc-outline"
                size={40}
                color={colors.textOnPrimary}
              />
            </View>
            <Text style={styles.headerTitle}>{APP_NAME}</Text>
            <Text style={styles.headerSubtitle}>
              Your ultimate disc golf companion
            </Text>
          </View>

          {/* App Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Information</Text>

            {aboutItems.map((item) => (
              <TouchableOpacity
                key={item.title}
                style={[
                  styles.aboutItem,
                  (item.type === 'link' || item.type === 'action' || item.type === 'navigation') && styles.aboutItemLink,
                ]}
                onPress={() => {
                  if (item.type === 'link' && item.url) {
                    handleLinkPress(item.url);
                  } else if (item.type === 'action' && item.action) {
                    item.action();
                  } else if (item.type === 'navigation' && item.screen) {
                    navigation.navigate(item.screen);
                  }
                }}
                disabled={item.type === 'info'}
              >
                <Icon
                  name={item.icon}
                  size={24}
                  color={(item.type === 'link' || item.type === 'navigation') ? colors.primary : colors.textLight}
                  style={styles.aboutItemIcon}
                />
                <View style={styles.aboutItemContent}>
                  <Text style={styles.aboutItemTitle}>
                    {item.title}
                  </Text>
                  <Text style={[
                    styles.aboutItemValue,
                    (item.type === 'link' || item.type === 'action' || item.type === 'navigation') && styles.aboutItemValueLink,
                  ]}
                  >
                    {item.value}
                  </Text>
                </View>
                {(item.type === 'link' || item.type === 'action' || item.type === 'navigation') && (
                  <Icon
                    name="chevron-forward"
                    size={20}
                    color={colors.textLight}
                    style={styles.chevronIcon}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Made with ❤️ for the disc golf community
            </Text>
            <TouchableOpacity
              onPress={() => handleLinkPress('https://discbaboons.com')}
            >
              <Text style={styles.footerLink}>
                Visit discbaboons.com
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppContainer>
  );
}

export default memo(AboutScreen);
