/**
 * BaboonBagBreakdownModal Component
 * Modal that displays detailed bag statistics and breakdown
 */

import { memo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import PropTypes from 'prop-types';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing } from '../../design-system/spacing';
import BaboonBagBreakdown from '../BaboonBagBreakdown';

function BaboonBagBreakdownModal({ bag }) {
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: Platform.select({
        ios: spacing.xl * 2,
        android: spacing.xl,
      }),
      paddingBottom: spacing.md,
    },
    modalTitle: {
      ...typography.h1,
      color: colors.text,
      fontWeight: '700',
      fontSize: 24,
    },
    closeButton: {
      padding: spacing.sm,
      borderRadius: Platform.select({
        ios: 20,
        android: 24,
      }),
      backgroundColor: colors.primary,
    },
    modalContent: {
      flex: 1,
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.md,
      paddingTop: spacing.xs,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'flex-start',
    },
    triggerButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: Platform.select({
        ios: 8,
        android: 10,
      }),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.xs,
    },
    triggerText: {
      ...typography.caption,
      color: colors.text,
      fontWeight: '600',
      fontSize: 11,
    },
  });

  const openModal = () => setVisible(true);
  const closeModal = () => setVisible(false);

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity style={styles.triggerButton} onPress={openModal}>
        <Icon name="analytics-outline" size={14} color={colors.primary} />
        <Text style={styles.triggerText}>Baboon Breakdown</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={visible}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Baboon Breakdown</Text>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Icon name="close" size={24} color={colors.surface} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContainer}
            >
              <BaboonBagBreakdown bag={bag} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

BaboonBagBreakdownModal.propTypes = {
  bag: PropTypes.shape({
    bag_contents: PropTypes.arrayOf(
      PropTypes.shape({
        speed: PropTypes.number,
        glide: PropTypes.number,
        turn: PropTypes.number,
        fade: PropTypes.number,
        disc_master: PropTypes.shape({
          speed: PropTypes.number,
          glide: PropTypes.number,
          turn: PropTypes.number,
          fade: PropTypes.number,
        }),
      }),
    ),
  }),
};

BaboonBagBreakdownModal.defaultProps = {
  bag: { bag_contents: [] },
};

export default memo(BaboonBagBreakdownModal);
