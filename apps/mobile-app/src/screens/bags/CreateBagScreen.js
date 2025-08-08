/**
 * CreateBagScreen Component
 */

import { memo, useState, useRef } from 'react';
import {
  SafeAreaView, StyleSheet, Text, View, ScrollView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import Input from '../../components/Input';
import Button from '../../components/Button';

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
  const [bagName, setBagName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('private');

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

  const handleCreateBag = () => {
    const bagData = {
      name: bagName.trim(),
      description: description.trim(),
      privacy,
    };
    onCreateBag?.(bagData);
    // Navigate back to bags list after creation
    navigation?.goBack();
  };

  const isValid = bagName.trim().length > 0;

  return (
    <SafeAreaView testID="create-bag-screen" style={styles.container}>
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
                title="Create Bag"
                onPress={handleCreateBag}
                disabled={!isValid}
                variant="primary"
              />
            </View>
          </ScrollView>
        </AppContainer>
      </TouchableWithoutFeedback>
    </SafeAreaView>
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
