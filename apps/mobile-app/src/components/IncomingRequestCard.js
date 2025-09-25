/**
 * IncomingRequestCard Component
 * Displays incoming friend request with accept/deny actions
 */

import { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';
import Card from '../design-system/components/Card';
import Avatar from './Avatar';

function IncomingRequestCard({
  request, onAccept, onDeny, isProcessing,
}) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    content: {
      flexDirection: 'row',
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      gap: spacing.md,
    },
    requestInfo: {
      flex: 1,
    },
    username: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    requestText: {
      ...typography.body2,
      color: colors.textLight,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    acceptButton: {
      flex: 1,
      backgroundColor: colors.primary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 8,
      alignItems: 'center',
    },
    denyButton: {
      flex: 1,
      backgroundColor: colors.error,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 8,
      alignItems: 'center',
    },
    buttonText: {
      ...typography.body2,
      fontWeight: '600',
    },
    acceptButtonText: {
      color: colors.surface,
    },
    denyButtonText: {
      color: colors.surface,
    },
  });

  const handleAccept = () => {
    onAccept(request.id);
  };

  const handleDeny = () => {
    onDeny(request.id);
  };

  return (
    <View style={styles.container}>
      <Card>
        <View style={styles.content}>
          <Avatar username={request.requester.username} />

          <View style={styles.requestInfo}>
            <Text style={styles.username}>{request.requester.username}</Text>
            <Text style={styles.requestText}>
              wants to join your troop
            </Text>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                testID="accept-button"
                style={[styles.acceptButton, isProcessing && styles.disabledButton]}
                onPress={handleAccept}
                disabled={isProcessing}
                accessible
                accessibilityLabel={`Approve troop request from ${request.requester.username}`}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={[styles.buttonText, styles.acceptButtonText]}>Approve</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                testID="deny-button"
                style={[styles.denyButton, isProcessing && styles.disabledButton]}
                onPress={handleDeny}
                disabled={isProcessing}
                accessible
                accessibilityLabel={`Decline troop invite from ${request.requester.username}`}
              >
                <Text style={[styles.buttonText, styles.denyButtonText]}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Card>
    </View>
  );
}

IncomingRequestCard.propTypes = {
  request: PropTypes.shape({
    id: PropTypes.number.isRequired,
    requester_id: PropTypes.number.isRequired,
    recipient_id: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    requester: PropTypes.shape({
      id: PropTypes.number.isRequired,
      username: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
    }).isRequired,
    created_at: PropTypes.string.isRequired,
  }).isRequired,
  onAccept: PropTypes.func.isRequired,
  onDeny: PropTypes.func.isRequired,
};

export default memo(IncomingRequestCard);
