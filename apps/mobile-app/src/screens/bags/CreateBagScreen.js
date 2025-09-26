/**
 * CreateBagScreen Component
 */

import { memo, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { useBagRefreshContext } from '../../context/BagRefreshContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import StatusBarSafeView from '../../components/StatusBarSafeView';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { createBag } from '../../services/bagService';

const PRIVACY_OPTIONS = [
  {
    value: 'private', label: 'Private', icon: 'lock-closed-outline', description: 'Only you can see this bag',
  },
  {
    value: 'friends', label: 'Friends', icon: 'people-outline', description: 'Your friends can see this bag',
  },
  {
    value: 'public', label: 'Public', icon: 'globe-outline', description: 'Everyone can see this bag',
  },
];

function CreateBagScreen({ navigation, onCreateBag }) {
  const colors = useThemeColors();
  const { triggerBagListRefresh } = useBagRefreshContext();
  const [bagName, setBagName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('private');
  const [isCreating, setIsCreating] = useState(false);

  // Refs for auto-focus flow
  const bagNameInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  const styles = StyleSheet.create({
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
    privacyOptions: {
      gap: spacing.md,
      marginTop: spacing.md,
    },
    privacyOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 12,
        android: 16,
      }),
      borderWidth: 2,
      borderColor: 'transparent',
    },
    privacyOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: Platform.select({
        ios: `${colors.primary}10`,
        android: `${colors.primary}15`,
      }),
    },
    privacyOptionIcon: {
      marginRight: spacing.md,
    },
    privacyOptionContent: {
      flex: 1,
    },
    privacyOptionLabel: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    privacyOptionDescription: {
      ...typography.caption,
      color: colors.textLight,
      lineHeight: 16,
    },
    buttonContainer: {
      marginTop: spacing.xl,
      paddingTop: spacing.lg,
    },
  });

  const handleCreateBag = async () => {
    if (isCreating) return; // Prevent double submissions

    const bagData = {
      name: bagName.trim(),
      description: description.trim(),
      privacy,
    };

    setIsCreating(true);

    try {
      // Call the API service to create the bag
      const createdBag = await createBag(bagData);

      // Call the optional callback prop with the created bag data
      onCreateBag?.(createdBag);

      // Trigger bag list refresh to show the new bag
      triggerBagListRefresh();

      // Navigate to bag detail after successful creation
      navigation?.replace('BagDetail', { bagId: createdBag.id });
    } catch (error) {
      // Show user-friendly error message
      Alert.alert(
        'Unable to Create Bag',
        error.message || 'Something went wrong. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsCreating(false);
    }
  };

  const isValid = bagName.trim().length > 0;

  return (
    <StatusBarSafeView testID="create-bag-screen" style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={styles.dismissKeyboard}>
        <AppContainer>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Create New Bag</Text>
              <Text style={styles.headerSubtitle}>
                Organize your disc collection with a custom bag that fits your playing style
              </Text>
            </View>

            {/* Bag Name Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="bag-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>Bag Name</Text>
              </View>
              <Input
                ref={bagNameInputRef}
                placeholder="Enter a name for your bag"
                value={bagName}
                onChangeText={setBagName}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => descriptionInputRef.current?.focus()}
              />
            </View>

            {/* Description Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="document-text-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>Description</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Add a description to help you remember what this bag is for
              </Text>
              <Input
                ref={descriptionInputRef}
                placeholder="e.g., My go-to discs for wooded courses"
                value={description}
                onChangeText={setDescription}
                autoCapitalize="sentences"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </View>

            {/* Privacy Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon
                  name="shield-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionTitle}>Privacy</Text>
              </View>
              <Text style={styles.sectionDescription}>
                Choose who can see your bag and its contents
              </Text>

              <View style={styles.privacyOptions}>
                {PRIVACY_OPTIONS.map((option) => (
                  <TouchableWithoutFeedback
                    key={option.value}
                    onPress={() => setPrivacy(option.value)}
                  >
                    <View style={[
                      styles.privacyOption,
                      privacy === option.value && styles.privacyOptionSelected,
                    ]}
                    >
                      <Icon
                        name={option.icon}
                        size={24}
                        color={privacy === option.value ? colors.primary : colors.textLight}
                        style={styles.privacyOptionIcon}
                      />
                      <View style={styles.privacyOptionContent}>
                        <Text style={styles.privacyOptionLabel}>
                          {option.label}
                        </Text>
                        <Text style={styles.privacyOptionDescription}>
                          {option.description}
                        </Text>
                      </View>
                    </View>
                  </TouchableWithoutFeedback>
                ))}
              </View>
            </View>

            {/* Create Button */}
            <View style={styles.buttonContainer}>
              <Button
                title={isCreating ? 'Creating...' : 'Create Bag'}
                onPress={handleCreateBag}
                disabled={!isValid || isCreating}
                variant="primary"
                loading={isCreating}
              />
            </View>
          </ScrollView>
        </AppContainer>
      </TouchableWithoutFeedback>
    </StatusBarSafeView>
  );
}

CreateBagScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
  }),
  onCreateBag: PropTypes.func,
};

CreateBagScreen.defaultProps = {
  navigation: null,
  onCreateBag: () => {},
};

// Add display name for React DevTools
CreateBagScreen.displayName = 'CreateBagScreen';

export default memo(CreateBagScreen);
