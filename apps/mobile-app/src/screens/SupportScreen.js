/* eslint-disable max-len */
/**
 * SupportScreen - User Support and Contact Information
 */

import { useMemo } from 'react';
import {
  SafeAreaView, Platform, StyleSheet, View, Text, ScrollView, Linking,
} from 'react-native';
import PropTypes from 'prop-types';
import AppContainer from '../components/AppContainer';
import Button from '../components/Button';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';

const staticStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.select({
      android: 40,
      ios: 0,
    }),
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  sectionText: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  contactContainer: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  contactTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  contactText: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  emailButton: {
    marginBottom: spacing.md,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  versionText: {
    ...typography.caption,
    textAlign: 'center',
  },
  backButton: {
    marginTop: spacing.xl,
  },
  boldText: {
    fontWeight: '600',
  },
});

function SupportScreen({ navigation }) {
  const colors = useThemeColors();

  const styles = useMemo(() => ({
    safeArea: [
      staticStyles.safeArea,
      { backgroundColor: colors.background },
    ],
    scrollView: staticStyles.scrollView,
    content: staticStyles.content,
    title: [
      staticStyles.title,
      { color: colors.text },
    ],
    section: staticStyles.section,
    sectionTitle: [
      staticStyles.sectionTitle,
      { color: colors.text },
    ],
    sectionText: [
      staticStyles.sectionText,
      { color: colors.textLight },
    ],
    contactContainer: [
      staticStyles.contactContainer,
      {
        borderColor: colors.border,
        backgroundColor: `${colors.surface}50`, // 50% opacity
      },
    ],
    contactTitle: [
      staticStyles.contactTitle,
      { color: colors.text },
    ],
    contactText: [
      staticStyles.contactText,
      { color: colors.textLight },
    ],
    emailButton: staticStyles.emailButton,
    versionContainer: [
      staticStyles.versionContainer,
      { borderTopColor: colors.border },
    ],
    versionText: [
      staticStyles.versionText,
      { color: colors.textLight },
    ],
    backButton: staticStyles.backButton,
    boldText: staticStyles.boldText,
  }), [colors]);

  const handleEmailSupport = () => {
    const subject = 'DiscBaboons Support Request';
    const body = `Hi Spiro,

I need help with DiscBaboons. 

Issue Description:
[Please describe your issue here]

Device Information:
- Platform: ${Platform.OS}
- App Version: 0.0.1

Thank you for your time!`;

    const emailUrl = `mailto:spiro@discbaboons.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(emailUrl).catch(() => {
      // Fallback if mail app isn't available
      Linking.openURL('mailto:spiro@discbaboons.com').catch(() => {
        // If even basic mailto fails, we can't do much more
      });
    });
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="support-screen">
      <AppContainer>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Support & Help</Text>

          <View style={styles.contactContainer}>
            <Text style={styles.contactTitle}>Need Help?</Text>
            <Text style={styles.contactText}>
              DiscBaboons is developed and maintained by a single developer who is passionate about disc
              golf and creating great user experiences.
              {'\n\n'}
              While this means you&apos;re getting personal attention for your questions and feedback,
              please allow up to 2-3 business days for a response during busy periods.
            </Text>

            <View style={styles.emailButton}>
              <Button
                title="Email Support"
                onPress={handleEmailSupport}
                accessibilityLabel="Send support email"
                accessibilityHint="Opens your mail app with a pre-filled support request"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Common Questions</Text>
            <Text style={styles.sectionText}>
              <Text style={styles.boldText}>
                Account Issues:
                {' '}
              </Text>
              If you&apos;re having trouble logging in, try the &quot;Forgot Username&quot; or
              &quot;Forgot Password&quot; links on the login screen.
            </Text>
            <Text style={styles.sectionText}>
              <Text style={styles.boldText}>
                App Performance:
                {' '}
              </Text>
              Try restarting the app or your device. If issues persist, please contact support with
              details about your device and the specific problem.
            </Text>
            <Text style={styles.sectionText}>
              <Text style={styles.boldText}>
                Feature Requests:
                {' '}
              </Text>
              Have an idea to make DiscBaboons better? Send it along! User feedback directly shapes
              the development roadmap.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">About DiscBaboons</Text>
            <Text style={styles.sectionText}>
              DiscBaboons is a disc golf tracking app designed by players, for players. Track your rounds,
              manage your bag, connect with friends, and improve your game.
              {'\n\n'}
              Built with care by an independent developer who believes great software should be personal,
              reliable, and focused on what matters most to users.
            </Text>
          </View>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>
              DiscBaboons v0.0.1
              {'\n'}
              © 2025 DiscBaboons
            </Text>
          </View>

          <View style={styles.backButton}>
            <Button
              title="Back to Login"
              onPress={handleBackToLogin}
              variant="secondary"
              accessibilityLabel="Return to login screen"
              accessibilityHint="Go back to the login screen"
            />
          </View>
        </ScrollView>
      </AppContainer>
    </SafeAreaView>
  );
}

SupportScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

export default SupportScreen;
