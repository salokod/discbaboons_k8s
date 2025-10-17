/**
 * SideBetsCard Component
 * Displays side bets for a round
 */

import {
  View, ActivityIndicator, StyleSheet, Text, TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../design-system/spacing';
import { typography } from '../../design-system/typography';

function SideBetsCard({
  testID, sideBets, loading, onAddBet,
}) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
      marginBottom: spacing.md,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    emptyText: {
      ...typography.body,
      color: colors.textLight,
      marginBottom: spacing.md,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 8,
    },
    addButtonText: {
      ...typography.body,
      color: colors.white,
      fontWeight: '600',
      marginLeft: spacing.sm,
    },
    betItem: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    betHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    betName: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
      flex: 1,
    },
    betAmount: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '700',
      marginLeft: spacing.md,
    },
    betDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    betDetailText: {
      ...typography.caption,
      color: colors.textLight,
    },
    winnerText: {
      ...typography.caption,
      color: colors.success,
      fontWeight: '600',
    },
  });

  return (
    <View testID={testID} style={styles.container}>
      <Text style={styles.sectionTitle}>Side Bets</Text>

      {loading && (
        <View testID="side-bets-loading" style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {!loading && sideBets.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No side bets yet</Text>
          <TouchableOpacity
            testID="add-side-bet-button"
            style={styles.addButton}
            onPress={onAddBet}
          >
            <Icon name="add-outline" size={20} color={colors.white} />
            <Text style={styles.addButtonText}>Add Side Bet</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && sideBets.length > 0 && (
        <View>
          {sideBets.map((bet) => (
            <View key={bet.id} testID={`bet-item-${bet.id}`} style={styles.betItem}>
              <View style={styles.betHeader}>
                <Text style={styles.betName}>{bet.name}</Text>
                <Text style={styles.betAmount}>
                  $
                  {parseFloat(bet.amount).toFixed(2)}
                </Text>
              </View>
              <View style={styles.betDetails}>
                <Text style={styles.betDetailText}>
                  {bet.participants.length}
                  {' '}
                  player
                  {bet.participants.length === 1 ? '' : 's'}
                </Text>
                {bet.winner_id && (
                  <Text style={styles.winnerText}>
                    Won by
                    {' '}
                    {bet.participants.find((p) => p.id === bet.winner_id)?.username || 'Unknown'}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

SideBetsCard.propTypes = {
  testID: PropTypes.string,
  sideBets: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    amount: PropTypes.string,
    bet_type: PropTypes.string,
    hole_number: PropTypes.number,
    participants: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      username: PropTypes.string,
    })),
    winner_id: PropTypes.string,
  })),
  loading: PropTypes.bool,
  onAddBet: PropTypes.func,
};

SideBetsCard.defaultProps = {
  testID: 'side-bets-card',
  sideBets: [],
  loading: false,
  onAddBet: () => {},
};

export default SideBetsCard;
