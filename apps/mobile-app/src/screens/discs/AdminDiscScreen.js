/**
 * AdminDiscScreen Component - Admin Disc Approval Interface
 * Following CreateBagScreen design patterns for consistent UX
 */

import {
  memo, useState, useEffect, useCallback,
} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import EmptyState from '../../design-system/components/EmptyState';
import Button from '../../components/Button';
import { getPendingDiscs, approveDisc } from '../../services/discService';

function AdminDiscScreen({ navigation }) {
  const colors = useThemeColors();
  const [pendingDiscs, setPendingDiscs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [approvingIds, setApprovingIds] = useState(new Set());

  // Load pending discs
  const loadPendingDiscs = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      const response = await getPendingDiscs();
      setPendingDiscs(response.discs || []);
    } catch (error) {
      if (error.message?.includes('Admin access required')) {
        Alert.alert(
          'Access Denied',
          'You need admin privileges to access this feature.',
          [{ text: 'Go Back', onPress: () => navigation?.goBack() }],
        );
      } else {
        Alert.alert('Error', 'Failed to load pending discs. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [navigation]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadPendingDiscs(false);
  }, [loadPendingDiscs]);

  // Handle disc approval with beautiful confirmation
  const handleApproveDisc = useCallback(async (disc) => {
    Alert.alert(
      'Approve Disc Submission',
      `Brand: ${disc.brand}\nModel: ${disc.model}\nFlight: ${disc.speed}|${disc.glide}|${disc.turn}|${disc.fade}\n\nApproving this disc will make it publicly available in the disc database.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          style: 'default',
          onPress: async () => {
            setApprovingIds((prev) => new Set(prev).add(disc.id));
            try {
              await approveDisc(disc.id);

              // Remove from pending list with smooth transition
              setPendingDiscs((prev) => prev.filter((d) => d.id !== disc.id));

              Alert.alert(
                'Disc Approved! ✅',
                `"${disc.brand} ${disc.model}" is now available to all users in the disc database.`,
              );
            } catch (error) {
              Alert.alert('Approval Error', `Failed to approve disc: ${error.message}`);
            } finally {
              setApprovingIds((prev) => {
                const updated = new Set(prev);
                updated.delete(disc.id);
                return updated;
              });
            }
          },
        },
      ],
    );
  }, []);

  useEffect(() => {
    loadPendingDiscs();
  }, [loadPendingDiscs]);

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
    // Header Section - Matching CreateBagScreen
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
      paddingHorizontal: spacing.md,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: spacing.lg,
      gap: spacing.xl,
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      ...typography.h2,
      color: colors.primary,
      fontWeight: '700',
    },
    statLabel: {
      ...typography.caption,
      color: colors.textLight,
      marginTop: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    // Section styling - Matching CreateBagScreen
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
    // Disc items - Following DiscSearchScreen design exactly
    discItem: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingVertical: Platform.select({
        ios: spacing.lg,
        android: spacing.md,
      }),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    discItemApproving: {
      backgroundColor: Platform.select({
        ios: `${colors.primary}10`,
        android: `${colors.primary}15`,
      }),
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    discContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    discInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    discName: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    discBrand: {
      ...typography.body2,
      color: colors.textLight,
      fontWeight: '500',
      fontStyle: 'italic',
      marginBottom: spacing.xs,
    },
    submissionDate: {
      ...typography.caption,
      color: colors.textLight,
      fontSize: 12,
    },
    flightNumbers: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    flightNumber: {
      borderRadius: 8,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      minWidth: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
    },
    speedNumber: {
      backgroundColor: `${colors.success}20`,
      borderColor: colors.success,
    },
    glideNumber: {
      backgroundColor: `${colors.primary}20`,
      borderColor: colors.primary,
    },
    turnNumber: {
      backgroundColor: `${colors.warning}20`,
      borderColor: colors.warning,
    },
    fadeNumber: {
      backgroundColor: `${colors.error}20`,
      borderColor: colors.error,
    },
    flightLabel: {
      ...typography.caption,
      color: colors.textLight,
      fontWeight: '600',
      fontSize: 10,
    },
    flightNumberText: {
      ...typography.body1,
      color: colors.text,
      fontWeight: '700',
      textAlign: 'center',
      fontSize: 16,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    approveButton: {
      flex: 1,
    },
    // Loading states
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xl * 2,
    },
    loadingText: {
      ...typography.body,
      color: colors.textLight,
      marginTop: spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppContainer>
          <View style={styles.loadingContainer}>
            <Icon name="hourglass-outline" size={48} color={colors.textLight} />
            <Text style={styles.loadingText}>Loading pending submissions...</Text>
          </View>
        </AppContainer>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView testID="admin-disc-screen" style={styles.container}>
      <AppContainer>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Header Section - Following CreateBagScreen pattern exactly */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Admin Disc Approval</Text>
            <Text style={styles.headerSubtitle}>
              Review and approve community-submitted disc data for the public database.
              Ensure flight numbers match official manufacturer specifications.
            </Text>

            {/* Stats - Following CreateBagScreen stats pattern */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{pendingDiscs.length}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>
          </View>

          {/* Pending Discs Section - Following CreateBagScreen pattern */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="checkmark-circle-outline" size={20} color={colors.text} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Pending Approvals</Text>
            </View>
            <Text style={styles.sectionDescription}>
              Review each submission for accuracy against official manufacturer specifications.
            </Text>

            {pendingDiscs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <EmptyState
                  title="All caught up! 🎉"
                  subtitle="No discs are currently pending approval. Great work keeping the database clean!"
                  actionLabel="Refresh List"
                  onAction={handleRefresh}
                />
              </View>
            ) : (
              pendingDiscs.map((disc) => {
                const isApproving = approvingIds.has(disc.id);
                return (
                  <View
                    key={disc.id}
                    style={[styles.discItem, isApproving && styles.discItemApproving]}
                  >
                    <View style={styles.discContent}>
                      <View style={styles.discInfo}>
                        <Text style={styles.discName}>{disc.model}</Text>
                        <Text style={styles.discBrand}>{disc.brand}</Text>
                        <Text style={styles.submissionDate}>
                          Submitted
                          {' '}
                          {new Date(disc.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View style={styles.flightNumbers}>
                        <View style={[styles.flightNumber, styles.speedNumber]}>
                          <Text style={styles.flightLabel}>S</Text>
                          <Text style={styles.flightNumberText}>{disc.speed}</Text>
                        </View>
                        <View style={[styles.flightNumber, styles.glideNumber]}>
                          <Text style={styles.flightLabel}>G</Text>
                          <Text style={styles.flightNumberText}>{disc.glide}</Text>
                        </View>
                        <View style={[styles.flightNumber, styles.turnNumber]}>
                          <Text style={styles.flightLabel}>T</Text>
                          <Text style={styles.flightNumberText}>{disc.turn}</Text>
                        </View>
                        <View style={[styles.flightNumber, styles.fadeNumber]}>
                          <Text style={styles.flightLabel}>F</Text>
                          <Text style={styles.flightNumberText}>{disc.fade}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.actionButtons}>
                      <Button
                        title={isApproving ? 'Approving...' : 'Approve & Publish'}
                        onPress={() => handleApproveDisc(disc)}
                        variant="primary"
                        style={styles.approveButton}
                        disabled={isApproving}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </AppContainer>
    </SafeAreaView>
  );
}

AdminDiscScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    goBack: PropTypes.func,
  }),
};

AdminDiscScreen.defaultProps = {
  navigation: null,
};

export default memo(AdminDiscScreen);
