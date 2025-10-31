import { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import PropTypes from 'prop-types';
import { useThemeColors } from '../../context/ThemeContext';
import { typography } from '../../design-system/typography';
import { spacing, borderRadius } from '../../design-system/tokens';
import { triggerSelectionHaptic } from '../../services/hapticService';

function CollapsibleSection({ title, children }) {
  const colors = useThemeColors();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    triggerSelectionHaptic();
    setIsExpanded((prev) => !prev);
  }, []);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
    },
    title: {
      ...typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    chevron: {
      ...typography.body,
      color: colors.textSecondary,
    },
    content: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      padding: spacing.md,
    },
  }), [colors]);

  return (
    <View testID="collapsible-section" style={styles.container}>
      <TouchableOpacity
        testID="collapsible-header"
        style={styles.header}
        onPress={toggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={`${title} section`}
        accessibilityState={{ expanded: isExpanded }}
        accessibilityHint="Double tap to expand or collapse"
      >
        <Text style={styles.title}>{title}</Text>
        <Text testID="chevron-icon" style={styles.chevron}>
          {isExpanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>
      {isExpanded && <View style={styles.content}>{children}</View>}
    </View>
  );
}

CollapsibleSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default CollapsibleSection;
