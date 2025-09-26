/* eslint-disable max-len */
/**
 * TermsOfServiceScreen - Terms of Service Display
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
  warningBox: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  warningText: {
    ...typography.body,
    fontWeight: '600',
    lineHeight: 20,
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

function TermsOfServiceScreen({ navigation }) {
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
    warningBox: [
      staticStyles.warningBox,
      {
        backgroundColor: `${colors.warning}15`,
        borderColor: colors.warning,
      },
    ],
    warningText: [
      staticStyles.warningText,
      { color: colors.warning },
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
    <StatusBarSafeView style={styles.safeArea} testID="terms-of-service-screen">
      <AppContainer>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.lastUpdated}>
            Effective Date: January 1, 2025
            {'\n'}
            Last Updated: January 1, 2025
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Acceptance of Terms</Text>
            <Text style={styles.sectionText}>
              By using the DiscBaboons mobile application, you agree to be bound by these Terms of Service. If you do not agree to these Terms, do not use the App.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">About DiscBaboons</Text>
            <Text style={styles.sectionText}>
              DiscBaboons is a disc golf tracking application operated by the developer as a solo
              development project. The App provides disc golf players with tools to track rounds, scores,
              disc collections, and connect with friends for recreational games and betting.
              {'\n\n'}
              <Text style={styles.boldText}>Important:</Text>
              {' '}
              DiscBaboons is available only to users in Canada and the United States.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Eligibility</Text>
            <Text style={styles.bulletPoint}>• You must be at least 13 years old to use the App</Text>
            <Text style={styles.bulletPoint}>• You must provide accurate registration information</Text>
            <Text style={styles.bulletPoint}>• You are responsible for maintaining account security</Text>
            <Text style={styles.bulletPoint}>• One account per person; sharing accounts is prohibited</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Permitted Use</Text>
            <Text style={styles.bulletPoint}>• Track your disc golf rounds and statistics</Text>
            <Text style={styles.bulletPoint}>• Manage your disc collection and report lost discs</Text>
            <Text style={styles.bulletPoint}>• Connect with friends and share game information</Text>
            <Text style={styles.bulletPoint}>• Participate in recreational betting features</Text>
            <Text style={styles.bulletPoint}>• Access disc golf course information</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Prohibited Activities</Text>
            <Text style={styles.bulletPoint}>• Use the App for commercial gambling or illegal betting</Text>
            <Text style={styles.bulletPoint}>• Share false information or impersonate others</Text>
            <Text style={styles.bulletPoint}>• Attempt to hack, reverse engineer, or compromise the App</Text>
            <Text style={styles.bulletPoint}>• Upload malicious content or spam other users</Text>
            <Text style={styles.bulletPoint}>• Use the App where disc golf betting is illegal</Text>
            <Text style={styles.bulletPoint}>• Create multiple accounts for unfair advantages</Text>
          </View>

          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Recreational Betting Notice
            </Text>
            <Text style={[styles.sectionText, styles.warningText]}>
              All betting features are for recreational purposes among friends only. Users are responsible for compliance with local gambling laws. DiscBaboons does not process money or handle financial transactions.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Solo Operation Limitations</Text>
            <Text style={styles.sectionText}>
              DiscBaboons is operated by a single developer with limited resources. We strive for reliable service but cannot guarantee 100% uptime. Updates and bug fixes may take longer than larger services, and customer support is provided on a best-effort basis.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Disclaimers and Limitations</Text>
            <Text style={styles.sectionText}>
              The App is provided &quot;as is&quot; without warranties of any kind. We do not guarantee accuracy of course information or statistics. To the maximum extent permitted by law, our total liability shall not exceed $50 or the amount you paid to use the App.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Account Termination</Text>
            <Text style={styles.sectionText}>
              You may delete your account at any time through App settings. We may suspend or terminate your account if you violate these Terms, use the App for illegal activities, engage in harassment, or attempt to compromise security.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Geographic Limitations</Text>
            <Text style={styles.sectionText}>
              DiscBaboons is available only in Canada and the United States. Use outside these regions is prohibited and may result in account termination. Users are responsible for compliance with local laws.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Contact Information</Text>
            <Text style={styles.sectionText}>
              For questions about these Terms of Service:
            </Text>
            <Text style={styles.contactInfo}>
              Email: spiro@discbaboons.com
              {'\n'}
              Subject: Terms of Service Inquiry
            </Text>
            <Text style={styles.sectionText}>
              We will respond to inquiries within 7 business days.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionText}>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and DiscBaboons.
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

TermsOfServiceScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

export default TermsOfServiceScreen;
