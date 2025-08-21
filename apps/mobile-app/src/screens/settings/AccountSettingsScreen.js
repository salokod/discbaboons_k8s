/**
 * AccountSettingsScreen Component
 * Manages user profile settings using existing APIs
 */

import { useState, useEffect, memo } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import NavigationHeader from '../../components/NavigationHeader';
import { getProfile, updateProfile } from '../../services/profile';
import AccountSettingsSkeleton from '../../components/settings/AccountSettingsSkeleton';

function AccountSettingsScreen({ navigation }) {
  const colors = useThemeColors();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    country: '',
    state_province: '',
    city: '',
    isnamepublic: true,
    isbiopublic: false,
    islocationpublic: true,
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      if (data.success && data.profile) {
        setProfile(data.profile);
      } else {
        // Show actual API error message
        Alert.alert('Error', data.message || 'Failed to load profile information');
      }
    } catch (error) {
      // Handle network or other unexpected errors
      Alert.alert('Error', 'Unable to connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = await updateProfile(profile);
      if (data.success) {
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        // Show actual API error message
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      // Handle network or other unexpected errors
      Alert.alert('Error', 'Unable to connect to the server. Please check your internet connection.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  };

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
    inputGroup: {
      marginBottom: spacing.md,
    },
    label: {
      ...typography.caption,
      color: colors.text,
      marginBottom: spacing.xs,
      fontWeight: '600',
    },
    input: {
      ...typography.body,
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 12,
        android: 8,
      }),
      padding: spacing.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    privacyToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    privacyLabel: {
      ...typography.body,
      color: colors.text,
      flex: 1,
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
    },
    toggleButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    toggleText: {
      ...typography.caption,
      marginLeft: spacing.xs,
      fontWeight: '600',
    },
    toggleTextActive: {
      color: colors.textOnPrimary,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: Platform.select({
        ios: 12,
        android: 8,
      }),
      padding: spacing.md,
      marginTop: spacing.lg,
    },
    actionButtonText: {
      ...typography.body,
      color: colors.textOnPrimary,
      fontWeight: '600',
      marginLeft: spacing.sm,
    },
  });

  if (loading) {
    return <AccountSettingsSkeleton />;
  }

  return (
    <AppContainer>
      <SafeAreaView style={styles.container}>
        <NavigationHeader
          title="Account Settings"
          onBack={handleBack}
          backAccessibilityLabel="Return to settings"
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerSubtitle}>
              Manage your profile information and privacy settings
            </Text>
          </View>

          {/* Profile Information Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon
                name="person-outline"
                size={24}
                color={colors.text}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Profile Information</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={profile.name || ''}
                onChangeText={(text) => updateField('name', text)}
                placeholder="Enter your display name"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={profile.bio || ''}
                onChangeText={(text) => updateField('bio', text)}
                placeholder="Tell others about your disc golf journey"
                placeholderTextColor={colors.textLight}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={profile.city || ''}
                onChangeText={(text) => updateField('city', text)}
                placeholder="Enter your city"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>State/Province</Text>
              <TextInput
                style={styles.input}
                value={profile.state_province || ''}
                onChangeText={(text) => updateField('state_province', text)}
                placeholder="Enter your state or province"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                value={profile.country || ''}
                onChangeText={(text) => updateField('country', text)}
                placeholder="Enter your country"
                placeholderTextColor={colors.textLight}
              />
            </View>
          </View>

          {/* Privacy Settings Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon
                name="shield-outline"
                size={24}
                color={colors.text}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionTitle}>Privacy Settings</Text>
            </View>

            <View style={styles.privacyToggle}>
              <Text style={styles.privacyLabel}>Show name in search results</Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  profile.isnamepublic && styles.toggleButtonActive,
                  { borderColor: profile.isnamepublic ? colors.primary : colors.border },
                ]}
                onPress={() => updateField('isnamepublic', !profile.isnamepublic)}
              >
                <Icon
                  name={profile.isnamepublic ? 'eye-outline' : 'eye-off-outline'}
                  size={16}
                  color={profile.isnamepublic ? colors.textOnPrimary : colors.textLight}
                />
                <Text style={[
                  styles.toggleText,
                  { color: profile.isnamepublic ? colors.textOnPrimary : colors.textLight },
                  profile.isnamepublic && styles.toggleTextActive,
                ]}
                >
                  {profile.isnamepublic ? 'Public' : 'Private'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.privacyToggle}>
              <Text style={styles.privacyLabel}>Show bio in search results</Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  profile.isbiopublic && styles.toggleButtonActive,
                  { borderColor: profile.isbiopublic ? colors.primary : colors.border },
                ]}
                onPress={() => updateField('isbiopublic', !profile.isbiopublic)}
              >
                <Icon
                  name={profile.isbiopublic ? 'eye-outline' : 'eye-off-outline'}
                  size={16}
                  color={profile.isbiopublic ? colors.textOnPrimary : colors.textLight}
                />
                <Text style={[
                  styles.toggleText,
                  { color: profile.isbiopublic ? colors.textOnPrimary : colors.textLight },
                  profile.isbiopublic && styles.toggleTextActive,
                ]}
                >
                  {profile.isbiopublic ? 'Public' : 'Private'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.privacyToggle}>
              <Text style={styles.privacyLabel}>Show location in search results</Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  profile.islocationpublic && styles.toggleButtonActive,
                  { borderColor: profile.islocationpublic ? colors.primary : colors.border },
                ]}
                onPress={() => updateField('islocationpublic', !profile.islocationpublic)}
              >
                <Icon
                  name={profile.islocationpublic ? 'eye-outline' : 'eye-off-outline'}
                  size={16}
                  color={profile.islocationpublic ? colors.textOnPrimary : colors.textLight}
                />
                <Text style={[
                  styles.toggleText,
                  { color: profile.islocationpublic ? colors.textOnPrimary : colors.textLight },
                  profile.islocationpublic && styles.toggleTextActive,
                ]}
                >
                  {profile.islocationpublic ? 'Public' : 'Private'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Icon name="save-outline" size={20} color={colors.textOnPrimary} />
            )}
            <Text style={styles.actionButtonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </AppContainer>
  );
}

AccountSettingsScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
  }),
};

AccountSettingsScreen.defaultProps = {
  navigation: null,
};

export default memo(AccountSettingsScreen);
