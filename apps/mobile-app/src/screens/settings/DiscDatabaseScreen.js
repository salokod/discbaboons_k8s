/**
 * DiscDatabaseScreen Component
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

function DiscDatabaseScreen({ navigation }) {
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
            <Text style={styles.headerTitle}>Disc Database</Text>
            <Text style={styles.headerSubtitle}>
              Search and submit disc information
            </Text>
          </View>

          {/* Database Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon
                name="disc-outline"
                size={24}
                color={colors.text}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Database</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Search and contribute to the disc golf community database
            </Text>
            <View style={{ marginTop: spacing.md }}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => navigation.navigate('DiscSearchScreen')}
                accessibilityLabel="Search for discs in the database"
                accessibilityRole="button"
                accessibilityHint="Navigate to disc search screen"
              >
                <Icon
                  name="search-outline"
                  size={24}
                  color={colors.textLight}
                  style={styles.settingItemIcon}
                />
                <View style={styles.settingItemContent}>
                  <Text style={styles.settingItemTitle}>
                    Search Discs
                  </Text>
                  <Text style={styles.settingItemDescription}>
                    Find discs by brand, model, type, and more
                  </Text>
                </View>
                <Icon
                  name="chevron-forward"
                  size={20}
                  color={colors.textLight}
                  style={styles.chevronIcon}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => navigation.navigate('Discover', { screen: 'SubmitDisc' })}
                accessibilityLabel="Submit a new disc to the database"
                accessibilityRole="button"
                accessibilityHint="Navigate to submit disc screen"
              >
                <Icon
                  name="add-circle-outline"
                  size={24}
                  color={colors.textLight}
                  style={styles.settingItemIcon}
                />
                <View style={styles.settingItemContent}>
                  <Text style={styles.settingItemTitle}>
                    Submit New Disc
                  </Text>
                  <Text style={styles.settingItemDescription}>
                    Add a new disc to our community database
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

export default memo(DiscDatabaseScreen);
