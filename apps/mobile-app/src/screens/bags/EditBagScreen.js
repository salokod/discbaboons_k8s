/**
 * EditBagScreen Component
 */

import { memo, useState } from 'react';
import {
  SafeAreaView, StyleSheet, Text, View, ScrollView,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import Input from '../../components/Input';
import Button from '../../components/Button';
import FilterChip from '../../design-system/components/FilterChip';

const PRIVACY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'friends', label: 'Friends' },
  { value: 'public', label: 'Public' },
];

function EditBagScreen({
  navigation, bag, onUpdateBag,
}) {
  const colors = useThemeColors();
  const [bagName, setBagName] = useState(bag?.name || '');
  const [description, setDescription] = useState(bag?.description || '');
  const [privacy, setPrivacy] = useState(bag?.privacy || 'private');

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

  const handleUpdateBag = () => {
    const updatedData = {
      ...bag,
      name: bagName.trim(),
      description: description.trim(),
      privacy,
    };
    onUpdateBag?.(updatedData);
    // Navigate back after update
    navigation?.goBack();
  };

  const isValid = bagName.trim().length > 0;

  return (
    <SafeAreaView testID="edit-bag-screen" style={styles.container}>
      <AppContainer>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.headerTitle}>Edit Bag</Text>

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
              title="Update Bag"
              onPress={handleUpdateBag}
              disabled={!isValid}
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
  bag: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    privacy: PropTypes.oneOf(['private', 'friends', 'public']),
  }),
  onUpdateBag: PropTypes.func,
};

EditBagScreen.defaultProps = {
  navigation: null,
  bag: null,
  onUpdateBag: () => {},
};

// Add display name for React DevTools
EditBagScreen.displayName = 'EditBagScreen';

export default memo(EditBagScreen);
