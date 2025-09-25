/**
 * OutgoingRequestCard Component
 * Displays outgoing friend request with cancel functionality
 */

import { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing } from '../design-system/spacing';
import Card from '../design-system/components/Card';
import Avatar from './Avatar';

function OutgoingRequestCard({ request, onCancel }) {
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
    statusText: {
      ...typography.body2,
      color: colors.textLight,
    },
    cancelButton: {
      backgroundColor: colors.border,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 8,
      marginTop: spacing.md,
      alignItems: 'center',
    },
    cancelButtonText: {
      ...typography.body2,
      fontWeight: '600',
      color: colors.text,
    },
  });

  const handleCancel = () => {
    onCancel(request.id);
  };

  // Backend now guarantees recipient data is populated
  const recipientUsername = request.recipient.username;

  return (
    <View style={styles.container}>
      <Card>
        <View style={styles.content}>
          <Avatar username={recipientUsername} />

          <View style={styles.requestInfo}>
            <Text style={styles.username}>{recipientUsername}</Text>
            <Text style={styles.statusText}>
              Pending
            </Text>

            <TouchableOpacity
              testID="cancel-button"
              style={styles.cancelButton}
              onPress={handleCancel}
              accessible
              accessibilityLabel={`Cancel friend request to ${recipientUsername}`}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </View>
  );
}

OutgoingRequestCard.propTypes = {
  request: PropTypes.shape({
    id: PropTypes.number.isRequired,
    requester_id: PropTypes.number.isRequired,
    recipient_id: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    recipient: PropTypes.shape({
      id: PropTypes.number.isRequired,
      username: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
    }).isRequired,
    created_at: PropTypes.string.isRequired,
  }).isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default memo(OutgoingRequestCard);
