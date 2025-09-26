/**
 * RoundDetailScreen Component
 * Shows detailed view of a round with course information and players
 */

import { memo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import AppContainer from '../../components/AppContainer';
import NavigationHeader from '../../components/NavigationHeader';
import StatusBarSafeView from '../../components/StatusBarSafeView';

function RoundDetailScreen({ route, navigation }) {
  const colors = useThemeColors();
  const { round } = route?.params || {};

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
    },
    roundCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    roundName: {
      ...typography.h2,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    courseInfo: {
      marginBottom: spacing.md,
    },
    courseName: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    courseDetails: {
      ...typography.body,
      color: colors.textLight,
      marginBottom: spacing.sm,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    statusIcon: {
      marginRight: spacing.xs,
    },
    statusText: {
      ...typography.body,
      color: colors.success,
      fontWeight: '500',
    },
    dateText: {
      ...typography.caption,
      color: colors.textLight,
    },
    playersSection: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.md,
    },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    playerIcon: {
      marginRight: spacing.sm,
    },
    playerName: {
      ...typography.body,
      color: colors.text,
    },
  });

  const handleBack = useCallback(() => {
    if (navigation?.goBack) {
      navigation.goBack();
    }
  }, [navigation]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Unknown date';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid date';
    }
  }, []);

  const formatStatus = useCallback((status) => {
    if (!status) return 'Unknown';

    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  return (
    <StatusBarSafeView testID="round-detail-screen" style={styles.container}>
      <AppContainer>
        <NavigationHeader
          testID="round-detail-header"
          title={round?.name || 'Round Details'}
          onBack={handleBack}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {round && (
            <>
              {/* Round Information Card */}
              <View style={styles.roundCard}>
                <Text style={styles.roundName}>{round.name}</Text>

                {round.course && (
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseName}>{round.course.name}</Text>
                    <Text style={styles.courseDetails}>
                      {round.course.location}
                      {' '}
                      •
                      {round.course.holes}
                      {' '}
                      holes
                    </Text>
                  </View>
                )}

                <View style={styles.statusContainer}>
                  <Icon
                    name="checkmark-circle-outline"
                    size={16}
                    color={colors.success}
                    style={styles.statusIcon}
                  />
                  <Text style={styles.statusText}>
                    {formatStatus(round.status)}
                  </Text>
                </View>

                <Text testID="round-date" style={styles.dateText}>
                  Started
                  {' '}
                  {formatDate(round.start_time)}
                </Text>
              </View>

              {/* Players Section */}
              <View testID="players-section" style={styles.playersSection}>
                <Text style={styles.sectionTitle}>Players</Text>

                {round.players && round.players.length > 0 ? (
                  round.players.map((player, index) => (
                    <View key={player.id || index} style={styles.playerRow}>
                      <Icon
                        name="person-outline"
                        size={20}
                        color={colors.primary}
                        style={styles.playerIcon}
                      />
                      <Text style={styles.playerName}>
                        {player.display_name || player.username}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.dateText}>No players yet</Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </AppContainer>
    </StatusBarSafeView>
  );
}

RoundDetailScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      roundId: PropTypes.string,
      round: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        status: PropTypes.string,
        start_time: PropTypes.string,
        course: PropTypes.shape({
          name: PropTypes.string,
          location: PropTypes.string,
          holes: PropTypes.number,
        }),
        players: PropTypes.arrayOf(PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
        })),
      }),
    }),
  }),
  navigation: PropTypes.shape({
    goBack: PropTypes.func,
    navigate: PropTypes.func,
  }),
};

RoundDetailScreen.defaultProps = {
  route: null,
  navigation: null,
};

// Add display name for React DevTools
RoundDetailScreen.displayName = 'RoundDetailScreen';

export default memo(RoundDetailScreen);
