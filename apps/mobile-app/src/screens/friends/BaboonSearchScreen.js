/**
 * BaboonSearchScreen Component
 * Screen for searching and discovering other baboons to add to your troop
 */

import {
  SafeAreaView,
  View,
  TextInput,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import { useThemeColors } from '../../context/ThemeContext';
import AppContainer from '../../components/AppContainer';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import EmptyState from '../../design-system/components/EmptyState';
import { friendService } from '../../services/friendService';

function BaboonSearchScreen() {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();

    if (!query) {
      setSearchResults([]);
      setHasSearched(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const result = await friendService.searchUsers(query);
      setSearchResults(result.users);
    } catch (err) {
      setError('Error searching for baboons. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const handleSubmitEditing = useCallback(() => {
    handleSearch();
  }, [handleSearch]);

  const handleSendInvite = useCallback(async (userId) => {
    try {
      await friendService.sendRequest(userId);
      // You could add a success message or update the UI here
    } catch (err) {
      // Handle error - could show a toast or alert
    }
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchContainer: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    searchInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      ...typography.body,
    },
    searchButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 44,
      minHeight: 44,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultItem: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    userInfo: {
      flex: 1,
    },
    username: {
      ...typography.bodyLarge,
      color: colors.text,
      fontWeight: '600',
    },
    email: {
      ...typography.bodySmall,
      color: colors.textLight,
      marginTop: 2,
    },
    inviteButton: {
      backgroundColor: colors.primary,
      borderRadius: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    inviteButtonText: {
      ...typography.bodySmall,
      color: colors.surface,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.md,
    },
    loadingText: {
      ...typography.body,
      color: colors.textLight,
      marginTop: spacing.sm,
    },
    errorText: {
      ...typography.body,
      color: colors.error,
      textAlign: 'center',
      padding: spacing.md,
    },
    noResultsText: {
      ...typography.body,
      color: colors.textLight,
      textAlign: 'center',
      padding: spacing.md,
    },
  });

  const renderUserItem = ({ item: user }) => (
    <View style={styles.resultItem}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>
      <TouchableOpacity
        style={styles.inviteButton}
        onPress={() => handleSendInvite(user.id)}
      >
        <Text style={styles.inviteButtonText}>Send Invite</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Searching for baboons...</Text>
        </View>
      );
    }

    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    if (hasSearched && searchResults.length === 0) {
      return <Text style={styles.noResultsText}>No baboons found matching your search</Text>;
    }

    if (hasSearched && searchResults.length > 0) {
      return (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    return (
      <View style={styles.centerContent}>
        <EmptyState
          title="Find Baboons for Your Troop"
          subtitle="Search by username or email to discover other baboons and send troop invites!"
        />
      </View>
    );
  };

  return (
    <AppContainer>
      <SafeAreaView style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for baboons to join your troop..."
              placeholderTextColor={colors.textLight}
              testID="search-input"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSubmitEditing}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              testID="search-button"
            >
              <Icon name="search" size={20} color={colors.surface} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {renderContent()}
        </View>
      </SafeAreaView>
    </AppContainer>
  );
}

BaboonSearchScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    goBack: PropTypes.func.isRequired,
  }).isRequired,
};

export default BaboonSearchScreen;
