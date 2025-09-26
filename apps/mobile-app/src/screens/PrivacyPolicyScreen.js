/* eslint-disable max-len */
/**
 * PrivacyPolicyScreen - Privacy Policy Display
 */

import { useMemo } from 'react';
import {
  Platform, StyleSheet, View, Text, ScrollView,
} from 'react-native';
import PropTypes from 'prop-types';
import AppContainer from '../components/AppContainer';
import StatusBarSafeView from '../components/StatusBarSafeView';
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
    marginBottom: spacing.md,
  },
  lastUpdated: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: spacing.lg,
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
  bulletPoint: {
    ...typography.body,
    lineHeight: 20,
    marginBottom: spacing.sm,
    marginLeft: spacing.md,
  },
  contactInfo: {
    ...typography.body,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'transparent',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: spacing.md,
  },
  backButton: {
    marginTop: spacing.lg,
  },
  boldText: {
    fontWeight: '600',
  },
});

function PrivacyPolicyScreen({ navigation }) {
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
    lastUpdated: [
      staticStyles.lastUpdated,
      { color: colors.textLight },
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
    bulletPoint: [
      staticStyles.bulletPoint,
      { color: colors.textLight },
    ],
    contactInfo: [
      staticStyles.contactInfo,
      {
        color: colors.text,
        backgroundColor: `${colors.surface}50`,
        borderColor: colors.border,
      },
    ],
    backButton: staticStyles.backButton,
    boldText: staticStyles.boldText,
  }), [colors]);

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <StatusBarSafeView style={styles.safeArea} testID="privacy-policy-screen">
      <AppContainer>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.lastUpdated}>
            Effective Date: January 1, 2025
            {'\n'}
            Last Updated: January 1, 2025
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">About DiscBaboons</Text>
            <Text style={styles.sectionText}>
              DiscBaboons is a disc golf tracking application operated as a solo development project by
              the developer. This app helps disc golf players track their rounds, scores, disc collections,
              and connect with friends for games and friendly betting.
              {'\n\n'}
              This Privacy Policy applies to users in Canada and the United States only.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Information We Collect</Text>
            <Text style={styles.sectionText}>
              <Text style={styles.boldText}>Information You Provide:</Text>
            </Text>
            <Text style={styles.bulletPoint}>• Email address, username, and encrypted password</Text>
            <Text style={styles.bulletPoint}>• Optional profile details you choose to share</Text>
            <Text style={styles.bulletPoint}>• Disc golf rounds, scores, and game statistics</Text>
            <Text style={styles.bulletPoint}>• Disc collection and lost disc reports</Text>
            <Text style={styles.bulletPoint}>• Friend connections and shared round information</Text>
            <Text style={styles.bulletPoint}>• Recreational betting data (skins games, side bets)</Text>

            <Text style={styles.sectionText}>
              <Text style={styles.boldText}>Information We Don&apos;t Collect:</Text>
            </Text>
            <Text style={styles.bulletPoint}>• Real-time location data</Text>
            <Text style={styles.bulletPoint}>• Third-party analytics</Text>
            <Text style={styles.bulletPoint}>• Advertising data</Text>
            <Text style={styles.bulletPoint}>• Biometric information</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">How We Use Your Information</Text>
            <Text style={styles.sectionText}>
              We use your information solely to provide the disc golf tracking service, authenticate your account securely, enable social features with friends, track game statistics, and maintain app security.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Data Security</Text>
            <Text style={styles.sectionText}>
              All passwords are encrypted using industry-standard bcrypt hashing. Authentication tokens are stored securely using device keychain services. Data transmission uses HTTPS encryption, and database access is restricted and monitored.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Sharing Your Information</Text>
            <Text style={styles.sectionText}>
              <Text style={styles.boldText}>We do not sell, rent, or trade your personal information.</Text>
              {'\n\n'}
              We may share your information only with friends (game scores you choose to share), for legal
              requirements, safety purposes, or in the unlikely event of a business transfer.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Your Rights</Text>
            <Text style={styles.bulletPoint}>• Access and download your account data</Text>
            <Text style={styles.bulletPoint}>• Update incorrect information in your profile</Text>
            <Text style={styles.bulletPoint}>• Delete your account and associated data</Text>
            <Text style={styles.bulletPoint}>• Control what information is shared with friends</Text>
            <Text style={styles.bulletPoint}>• Request data in a portable format</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Solo Operation Notice</Text>
            <Text style={styles.sectionText}>
              DiscBaboons is operated by a single developer. While we maintain professional security standards and follow industry best practices, users should understand this is not a large corporation with extensive resources. We are committed to protecting your privacy within the constraints of a solo operation.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Contact Us</Text>
            <Text style={styles.sectionText}>
              For privacy questions, concerns, or requests:
            </Text>
            <Text style={styles.contactInfo}>
              Email: spiro@discbaboons.com
              {'\n'}
              Subject: Privacy Policy Inquiry
            </Text>
            <Text style={styles.sectionText}>
              We will respond to privacy requests within 30 days.
            </Text>
          </View>

          <View style={styles.backButton}>
            <Button
              title="Back"
              onPress={handleBack}
              variant="secondary"
              accessibilityLabel="Go back to previous screen"
              accessibilityHint="Return to the previous screen"
            />
          </View>
        </ScrollView>
      </AppContainer>
    </StatusBarSafeView>
  );
}

PrivacyPolicyScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

export default PrivacyPolicyScreen;
