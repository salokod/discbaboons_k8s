/**
 * EditBagScreen Component
 */

import { memo, useState, useCallback } from 'react';
import {
  SafeAreaView, StyleSheet, Text, View, ScrollView, Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import Input from '../../components/Input';
import Button from '../../components/Button';
import FilterChip from '../../design-system/components/FilterChip';
import { updateBag } from '../../services/bagService';
import { useBagRefreshContext } from '../../context/BagRefreshContext';

const PRIVACY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'friends', label: 'Friends' },
  { value: 'public', label: 'Public' },
];

// Convert API response format to privacy type
const getPrivacyFromBag = (bagData) => {
  if (bagData?.is_public) return 'public';
  if (bagData?.is_friends_visible) return 'friends';
  return 'private';
};

function EditBagScreen({ navigation, route }) {
  const colors = useThemeColors();
  const { bag } = route?.params || {};
  const { triggerBagListRefresh } = useBagRefreshContext();

  const [bagName, setBagName] = useState(bag?.name || '');
  const [description, setDescription] = useState(bag?.description || '');
  const [privacy, setPrivacy] = useState(getPrivacyFromBag(bag));
  const [isLoading, setIsLoading] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: spacing.xl,
    },
    headerTitle: {
      ...typography.h2,
      color: colors.text,
      marginBottom: spacing.lg,
    },
    section: {
      marginBottom: spacing.lg,
    },
    label: {
      ...typography.body,
      color: colors.text,
      marginBottom: spacing.sm,
      fontWeight: '600',
    },
    privacyChips: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    buttonContainer: {
      paddingTop: spacing.md,
    },
  });

  const handleUpdateBag = useCallback(async () => {
    if (!bag) return;

    setIsLoading(true);
    try {
      // Only send changed fields
      const updates = {};
      if (bagName.trim() !== bag.name) {
        updates.name = bagName.trim();
      }
      if (description.trim() !== (bag.description || '')) {
        updates.description = description.trim();
      }
      if (privacy !== getPrivacyFromBag(bag)) {
        updates.privacy = privacy;
      }

      // Only make API call if there are changes
      if (Object.keys(updates).length > 0) {
        await updateBag(bag.id, updates);
        // Trigger bag list refresh after successful update
        triggerBagListRefresh();
      }

      // Navigate back after update
      navigation?.goBack();
    } catch (error) {
      // Handle errors
      if (error.message?.includes('already have a bag with this name') || error.message?.includes('duplicate')) {
        Alert.alert('Update Failed', 'You already have a bag with this name. Please choose a different name.');
      } else if (error.message?.includes('internet') || error.message?.includes('connection') || error.message?.includes('connect')) {
        Alert.alert('Update Failed', 'Unable to update bag. Please check your connection and try again.');
      } else {
        Alert.alert('Update Failed', error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [bag, bagName, description, privacy, navigation, triggerBagListRefresh]);

  const isValid = bagName.trim().length > 0;

  return (
    <SafeAreaView testID="edit-bag-screen" style={styles.container}>
      <AppContainer>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.headerTitle}>
            Edit
            {bag?.name || 'Bag'}
          </Text>

          <View style={styles.section}>
            <Text style={styles.label}>Bag Name</Text>
            <Input
              placeholder="Bag name"
              value={bagName}
              onChangeText={setBagName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Description</Text>
            <Input
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Privacy</Text>
            <View style={styles.privacyChips}>
              {PRIVACY_OPTIONS.map((option) => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  selected={privacy === option.value}
                  onPress={() => setPrivacy(option.value)}
                />
              ))}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={isLoading ? 'Updating...' : 'Update Bag'}
              onPress={handleUpdateBag}
              disabled={!isValid || isLoading}
              variant="primary"
            />
          </View>
        </ScrollView>
      </AppContainer>
    </SafeAreaView>
  );
}

EditBagScreen.propTypes = {
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
  }),
  route: PropTypes.shape({
    params: PropTypes.shape({
      bag: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        description: PropTypes.string,
        is_public: PropTypes.bool,
        is_friends_visible: PropTypes.bool,
      }),
    }),
  }),
};

EditBagScreen.defaultProps = {
  navigation: null,
  route: null,
};

// Add display name for React DevTools
EditBagScreen.displayName = 'EditBagScreen';

export default memo(EditBagScreen);
