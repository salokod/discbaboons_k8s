/**
 * PlayerSelectionModal Component
 * Modal for selecting players (friends, search users, guests) to add to a round
 * Follows design system patterns with multi-select functionality
 */

import {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import { friendService } from '../../services/friendService';

function PlayerSelectionModal({
  visible,
  onClose,
  onConfirm,
  existingPlayers,
}) {
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [guests, setGuests] = useState([]);
  const [guestInput, setGuestInput] = useState('');
  const searchTimeoutRef = useRef(null);

  const loadFriends = useCallback(async () => {
    try {
      setLoadingFriends(true);
      setError(null);

      const result = await friendService.getFriends({ limit: 100, offset: 0 });
      setFriends(result.friends || []);
    } catch (err) {
      setError(err.message || 'Failed to load friends');
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  // Load friends when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadFriends();
    }
  }, [visible, loadFriends]);

  // Handle search with debouncing
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return undefined;
    }

    setIsSearching(true);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search API call by 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await friendService.searchUsers(searchQuery.trim());
        setSearchResults(result.users || []);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Clean up timeout on unmount
  useEffect(() => () => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  const isUserSelected = (userId) => selectedUsers.some((u) => u.id === userId);

  const isUserDisabled = (userId) => existingPlayers.some((p) => p.userId === userId);

  const toggleUserSelection = (user) => {
    if (isUserDisabled(user.id)) {
      return;
    }

    if (isUserSelected(user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const addGuest = () => {
    const trimmedName = guestInput.trim();
    if (trimmedName === '') {
      return;
    }

    setGuests([...guests, trimmedName]);
    setGuestInput('');
  };

  const removeGuest = (index) => {
    setGuests(guests.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    const players = [
      ...selectedUsers.map((user) => ({ userId: user.id })),
      ...guests.map((guestName) => ({ guestName })),
    ];
    onConfirm(players);
    onClose();
  };

  const totalSelected = selectedUsers.length + guests.length;

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: Platform.select({ ios: 16, android: 20 }),
      margin: spacing.md,
      height: '80%',
      width: '95%',
      maxWidth: 450,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '700',
      flex: 1,
    },
    closeButton: {
      padding: spacing.xs,
      borderRadius: 20,
    },
    tabContainer: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      ...typography.body,
      color: colors.textLight,
      fontWeight: '500',
    },
    activeTabText: {
      color: colors.primary,
      fontWeight: '600',
    },
    contentContainer: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    loadingText: {
      ...typography.body,
      color: colors.textLight,
      marginTop: spacing.md,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    errorTitle: {
      ...typography.h4,
      color: colors.error,
      fontWeight: '600',
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    errorText: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 8,
    },
    retryButtonText: {
      ...typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    emptyTitle: {
      ...typography.h4,
      color: colors.text,
      fontWeight: '600',
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    emptyText: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
    },
    friendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: spacing.sm,
    },
    friendItemSelected: {
      backgroundColor: `${colors.primary}15`,
    },
    friendItemDisabled: {
      opacity: 0.5,
    },
    checkbox: {
      marginRight: spacing.md,
    },
    friendInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    friendName: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    friendUsername: {
      ...typography.caption,
      color: colors.textLight,
      marginTop: spacing.xs,
    },
    searchContainer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchInput: {
      ...typography.body,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.text,
    },
    guestInputContainer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    guestInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    guestTextInput: {
      ...typography.body,
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.text,
    },
    addGuestButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      minWidth: 80,
      alignItems: 'center',
    },
    addGuestButtonDisabled: {
      backgroundColor: colors.border,
      opacity: 0.5,
    },
    addGuestButtonText: {
      ...typography.body,
      color: colors.white,
      fontWeight: '600',
    },
    guestItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: `${colors.secondary}15`,
      borderRadius: 8,
      marginBottom: spacing.sm,
    },
    guestBadge: {
      backgroundColor: colors.secondary,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 4,
      marginLeft: spacing.sm,
    },
    guestBadgeText: {
      ...typography.caption,
      color: colors.white,
      fontWeight: '600',
      fontSize: 10,
    },
    removeGuestButton: {
      marginLeft: 'auto',
      padding: spacing.xs,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    selectionCounter: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    doneButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      minWidth: 100,
      alignItems: 'center',
    },
    doneButtonDisabled: {
      backgroundColor: colors.border,
      opacity: 0.5,
    },
    doneButtonText: {
      ...typography.body,
      color: colors.white,
      fontWeight: '600',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Players</Text>
            <TouchableOpacity
              testID="modal-close-button"
              style={styles.closeButton}
              onPress={onClose}
            >
              <Icon name="close" size={24} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              testID="tab-friends"
              style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
              onPress={() => setActiveTab('friends')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'friends' }}
              accessibilityLabel="Friends tab"
            >
              <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
                Friends
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="tab-search"
              style={[styles.tab, activeTab === 'search' && styles.activeTab]}
              onPress={() => setActiveTab('search')}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === 'search' }}
              accessibilityLabel="Search tab"
            >
              <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
                Search
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            {activeTab === 'friends' && (
              <>
                {loadingFriends && (
                  <View testID="friends-loading" style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading friends...</Text>
                  </View>
                )}

                {!loadingFriends && error && (
                  <View style={styles.errorContainer}>
                    <Icon name="alert-circle-outline" size={48} color={colors.error} />
                    <Text style={styles.errorTitle}>Error loading friends</Text>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={loadFriends}
                    >
                      <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {!loadingFriends && !error && friends.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Icon name="people-outline" size={48} color={colors.textLight} />
                    <Text style={styles.emptyTitle}>No friends yet</Text>
                    <Text style={styles.emptyText}>
                      Add friends to quickly select them for rounds
                    </Text>
                  </View>
                )}

                {!loadingFriends && !error && (friends.length > 0 || guests.length > 0) && (
                  <>
                    <FlatList
                      data={[
                        ...friends,
                        ...guests.map((g, idx) => ({ isGuest: true, name: g, idx })),
                      ]}
                      keyExtractor={(item) => (
                        item.isGuest ? `guest-${item.idx}` : item.id.toString()
                      )}
                      contentContainerStyle={styles.listContent}
                      renderItem={({ item }) => {
                        if (item.isGuest) {
                          return (
                            <View style={styles.guestItem}>
                              <Icon name="person-outline" size={40} color={colors.secondary} />
                              <View style={styles.friendInfo}>
                                <Text style={styles.friendName}>{item.name}</Text>
                                <View style={styles.guestBadge}>
                                  <Text style={styles.guestBadgeText}>GUEST</Text>
                                </View>
                              </View>
                              <TouchableOpacity
                                testID={`remove-guest-${item.idx}`}
                                style={styles.removeGuestButton}
                                onPress={() => removeGuest(item.idx)}
                                accessibilityLabel={`Remove guest ${item.name}`}
                              >
                                <Icon name="close-circle" size={24} color={colors.error} />
                              </TouchableOpacity>
                            </View>
                          );
                        }

                        const isSelected = isUserSelected(item.id);
                        const isDisabled = isUserDisabled(item.id);

                        return (
                          <TouchableOpacity
                            testID={`friend-row-${item.id}`}
                            style={[
                              styles.friendItem,
                              isSelected && styles.friendItemSelected,
                              isDisabled && styles.friendItemDisabled,
                            ]}
                            onPress={() => toggleUserSelection(item)}
                            disabled={isDisabled}
                            accessibilityRole="checkbox"
                            accessibilityLabel={`Select ${item.full_name}`}
                            accessibilityState={{
                              checked: isSelected,
                              disabled: isDisabled,
                            }}
                          >
                            <Icon
                              testID={`checkbox-${item.id}`}
                              name={isSelected ? 'checkbox' : 'square-outline'}
                              size={24}
                              color={isSelected ? colors.primary : colors.border}
                              style={styles.checkbox}
                            />
                            <Icon name="person-circle-outline" size={40} color={colors.primary} />
                            <View style={styles.friendInfo}>
                              <Text style={styles.friendName}>{item.full_name}</Text>
                              <Text style={styles.friendUsername}>
                                @
                                {item.username}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      }}
                    />

                    {/* Guest Input */}
                    <View style={styles.guestInputContainer}>
                      <View style={styles.guestInputRow}>
                        <TextInput
                          style={styles.guestTextInput}
                          placeholder="Guest name..."
                          placeholderTextColor={colors.textLight}
                          value={guestInput}
                          onChangeText={setGuestInput}
                          autoCapitalize="words"
                        />
                        <TouchableOpacity
                          testID="add-guest-button"
                          style={[
                            styles.addGuestButton,
                            guestInput.trim() === '' && styles.addGuestButtonDisabled,
                          ]}
                          onPress={addGuest}
                          disabled={guestInput.trim() === ''}
                          accessibilityLabel="Add guest player"
                          accessibilityState={{ disabled: guestInput.trim() === '' }}
                        >
                          <Text style={styles.addGuestButtonText}>Add Guest</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}

                {!loadingFriends && !error && friends.length === 0 && guests.length === 0 && (
                  <>
                    <View style={styles.emptyContainer}>
                      <Icon name="people-outline" size={48} color={colors.textLight} />
                      <Text style={styles.emptyTitle}>No friends yet</Text>
                      <Text style={styles.emptyText}>
                        Add friends to quickly select them for rounds
                      </Text>
                    </View>

                    {/* Guest Input for empty state */}
                    <View style={styles.guestInputContainer}>
                      <View style={styles.guestInputRow}>
                        <TextInput
                          style={styles.guestTextInput}
                          placeholder="Guest name..."
                          placeholderTextColor={colors.textLight}
                          value={guestInput}
                          onChangeText={setGuestInput}
                          autoCapitalize="words"
                        />
                        <TouchableOpacity
                          testID="add-guest-button"
                          style={[
                            styles.addGuestButton,
                            guestInput.trim() === '' && styles.addGuestButtonDisabled,
                          ]}
                          onPress={addGuest}
                          disabled={guestInput.trim() === ''}
                          accessibilityLabel="Add guest player"
                          accessibilityState={{ disabled: guestInput.trim() === '' }}
                        >
                          <Text style={styles.addGuestButtonText}>Add Guest</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                )}
              </>
            )}

            {activeTab === 'search' && (
              <>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by username..."
                    placeholderTextColor={colors.textLight}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {isSearching && (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Searching...</Text>
                  </View>
                )}

                {!isSearching && searchQuery.trim() === '' && (
                  <View style={styles.emptyContainer}>
                    <Icon name="search-outline" size={48} color={colors.textLight} />
                    <Text style={styles.emptyTitle}>Start typing to search</Text>
                    <Text style={styles.emptyText}>
                      Search for users by their username
                    </Text>
                  </View>
                )}

                {!isSearching && searchQuery.trim() !== '' && searchResults.length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Icon name="alert-circle-outline" size={48} color={colors.textLight} />
                    <Text style={styles.emptyTitle}>No users found</Text>
                    <Text style={styles.emptyText}>
                      No users match your search. Try a different username.
                    </Text>
                  </View>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                      const isSelected = isUserSelected(item.id);
                      const isDisabled = isUserDisabled(item.id);

                      return (
                        <TouchableOpacity
                          testID={`friend-row-${item.id}`}
                          style={[
                            styles.friendItem,
                            isSelected && styles.friendItemSelected,
                            isDisabled && styles.friendItemDisabled,
                          ]}
                          onPress={() => toggleUserSelection(item)}
                          disabled={isDisabled}
                          accessibilityRole="checkbox"
                          accessibilityLabel={`Select ${item.full_name}`}
                          accessibilityState={{
                            checked: isSelected,
                            disabled: isDisabled,
                          }}
                        >
                          <Icon
                            testID={`checkbox-${item.id}`}
                            name={isSelected ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={isSelected ? colors.primary : colors.border}
                            style={styles.checkbox}
                          />
                          <Icon name="person-circle-outline" size={40} color={colors.primary} />
                          <View style={styles.friendInfo}>
                            <Text style={styles.friendName}>{item.full_name}</Text>
                            <Text style={styles.friendUsername}>
                              @
                              {item.username}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}
              </>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text
              testID="selection-counter"
              style={styles.selectionCounter}
              accessibilityLiveRegion="polite"
              accessibilityLabel={`${totalSelected} ${totalSelected === 1 ? 'player' : 'players'} selected`}
            >
              {totalSelected}
              {' '}
              selected
            </Text>
            <TouchableOpacity
              testID="done-button"
              style={[
                styles.doneButton,
                totalSelected === 0 && styles.doneButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={totalSelected === 0}
              accessibilityRole="button"
              accessibilityLabel={`Add ${totalSelected} selected ${totalSelected === 1 ? 'player' : 'players'}`}
              accessibilityHint="Confirm and add selected players to the round"
              accessibilityState={{ disabled: totalSelected === 0 }}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

PlayerSelectionModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  existingPlayers: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.number,
      guestName: PropTypes.string,
    }),
  ).isRequired,
};

export default PlayerSelectionModal;
