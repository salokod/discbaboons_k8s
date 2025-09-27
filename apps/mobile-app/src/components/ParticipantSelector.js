/**
 * ParticipantSelector Component
 * Allows selection of friends and addition of guests for rounds
 */

import {
  memo, useEffect, useState, useCallback,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';
import { friendService } from '../services/friendService';

function ParticipantSelector({
  selectedFriends,
  guests,
  onFriendsChange,
  onGuestsChange,
}) {
  const colors = useThemeColors();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);

  const styles = StyleSheet.create({
    container: {
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
      flex: 1,
    },
    countBadge: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    countText: {
      ...typography.caption,
      color: colors.surface,
      fontWeight: '600',
      fontSize: 12,
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      minHeight: 56,
    },
    toggleText: {
      ...typography.body,
      color: colors.textLight,
    },
    expandedContent: {
      marginTop: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.md,
    },
    sectionLabel: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    friendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.xs,
      backgroundColor: colors.background,
      borderRadius: 8,
      minHeight: 48,
    },
    friendItemSelected: {
      backgroundColor: colors.primaryLight || `${colors.primary}20`,
    },
    checkbox: {
      marginRight: spacing.md,
      width: 20,
      alignItems: 'center',
    },
    friendName: {
      ...typography.body,
      color: colors.text,
      flex: 1,
    },
    guestInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
      minHeight: 44,
      ...typography.body,
      color: colors.text,
    },
    guestRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    guestInputFlex: {
      flex: 1,
      marginRight: spacing.sm,
    },
    removeButton: {
      padding: spacing.xs,
      backgroundColor: colors.error,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      width: 32,
      height: 32,
    },
    addGuestButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight || `${colors.primary}20`,
      borderRadius: 8,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginTop: spacing.sm,
      minHeight: 44,
    },
    addGuestText: {
      ...typography.body,
      color: colors.primary,
      marginLeft: spacing.xs,
    },
    loadingContainer: {
      paddingVertical: spacing.lg,
      alignItems: 'center',
    },
    errorText: {
      ...typography.body,
      color: colors.error,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
    emptyText: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      fontStyle: 'italic',
      paddingVertical: spacing.lg,
    },
  });

  const loadFriends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await friendService.getFriends({ limit: 20, offset: 0 });
      setFriends(result.friends || []);
    } catch (err) {
      setError('Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load friends when expanded
  useEffect(() => {
    if (expanded && friends.length === 0 && !loading) {
      loadFriends();
    }
  }, [expanded, friends.length, loading, loadFriends]);

  const toggleFriendSelection = useCallback((friend) => {
    const isSelected = selectedFriends.some((f) => f.id === friend.id);
    if (isSelected) {
      onFriendsChange(selectedFriends.filter((f) => f.id !== friend.id));
    } else {
      onFriendsChange([...selectedFriends, friend]);
    }
  }, [selectedFriends, onFriendsChange]);

  const addGuest = useCallback(() => {
    const newGuest = { id: Date.now(), name: '' };
    onGuestsChange([...guests, newGuest]);
  }, [guests, onGuestsChange]);

  const removeGuest = useCallback((guestId) => {
    onGuestsChange(guests.filter((guest) => guest.id !== guestId));
  }, [guests, onGuestsChange]);

  const updateGuest = useCallback((guestId, value) => {
    const newGuests = guests.map((guest) => (
      guest.id === guestId ? { ...guest, name: value } : guest
    ));
    onGuestsChange(newGuests);
  }, [guests, onGuestsChange]);

  const totalParticipants = selectedFriends.length + guests.filter(
    (g) => g.name && g.name.trim(),
  ).length;

  const renderFriendItem = ({ item }) => {
    const isSelected = selectedFriends.some((f) => f.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.friendItemSelected]}
        onPress={() => toggleFriendSelection(item)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
        accessibilityLabel={`${item.display_name || item.username}${isSelected ? ', selected' : ', not selected'}`}
      >
        <View style={styles.checkbox}>
          <Icon
            name={isSelected ? 'checkbox' : 'checkbox-outline'}
            size={20}
            color={isSelected ? colors.primary : colors.textLight}
          />
        </View>
        <Text style={styles.friendName}>
          {item.display_name || item.username}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View testID="participant-selector" style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Icon
          name="people-outline"
          size={20}
          color={colors.primary}
          style={styles.sectionIcon}
        />
        <Text style={styles.sectionTitle}>Participants</Text>
        {totalParticipants > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{totalParticipants}</Text>
          </View>
        )}
      </View>

      {/* Toggle Button */}
      <TouchableOpacity
        testID="expand-participants"
        style={styles.toggleButton}
        onPress={() => setExpanded(!expanded)}
        accessibilityLabel="Add participants"
        accessibilityHint="Tap to add friends or guests to your round"
      >
        <Text style={styles.toggleText}>
          {totalParticipants === 0
            ? 'Add players (optional)'
            : `${totalParticipants} player${totalParticipants === 1 ? '' : 's'} added`}
        </Text>
        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textLight}
        />
      </TouchableOpacity>

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Friends Section */}
          <View>
            <Text style={styles.sectionLabel}>Invite Friends</Text>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={colors.primary} />
                <Text style={styles.loadingText}>Loading friends...</Text>
              </View>
            )}
            {!loading && error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
            {!loading && !error && friends.length === 0 && (
              <Text style={styles.emptyText}>No friends found</Text>
            )}
            {!loading && !error && friends.length > 0 && (
              <FlatList
                data={friends}
                renderItem={renderFriendItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          {/* Guests Section */}
          <View style={{ marginTop: spacing.lg }}>
            <Text style={styles.sectionLabel}>Add Guests</Text>
            {guests.map((guest) => (
              <View key={guest.id} style={styles.guestRow}>
                <View style={styles.guestInputFlex}>
                  <TextInput
                    style={styles.guestInput}
                    placeholder="Guest name"
                    value={guest.name}
                    onChangeText={(value) => updateGuest(guest.id, value)}
                    accessibilityLabel="Guest name"
                    autoCapitalize="words"
                  />
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeGuest(guest.id)}
                  accessibilityLabel="Remove guest"
                >
                  <Icon name="close" size={16} color={colors.surface} />
                </TouchableOpacity>
              </View>
            ))}

            {guests.length < 10 && (
              <TouchableOpacity
                style={styles.addGuestButton}
                onPress={addGuest}
                accessibilityLabel="Add guest player"
              >
                <Icon name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.addGuestText}>Add Guest Player</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

ParticipantSelector.propTypes = {
  selectedFriends: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    display_name: PropTypes.string,
  })).isRequired,
  guests: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  })).isRequired,
  onFriendsChange: PropTypes.func.isRequired,
  onGuestsChange: PropTypes.func.isRequired,
};

ParticipantSelector.displayName = 'ParticipantSelector';

export default memo(ParticipantSelector);
