import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../context/ThemeContext';
import { typography } from '../design-system/typography';
import { spacing, borderRadius } from '../design-system/tokens';
import useNetworkStatus from '../hooks/useNetworkStatus';
import { getQueueSize } from '../services/offlineQueue';

export default function OfflineIndicator() {
  const colors = useThemeColors();
  const { isOnline } = useNetworkStatus();
  const [queueSize, setQueueSize] = useState(0);

  // Fetch queue size when offline
  useEffect(() => {
    if (!isOnline) {
      const fetchQueueSize = async () => {
        const size = await getQueueSize();
        setQueueSize(size);
      };

      fetchQueueSize();

      // Poll queue size every 2 seconds when offline
      const interval = setInterval(fetchQueueSize, 2000);

      return () => clearInterval(interval);
    }
    return undefined;
  }, [isOnline]);

  // Don't render anything when online
  if (isOnline) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.error || '#FF5252',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.sm,
    },
    text: {
      ...typography.caption,
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });

  const displayText = queueSize > 0 ? `Offline (${queueSize})` : 'Offline';

  return (
    <View
      testID="offline-indicator"
      style={styles.container}
      accessibilityLabel="Offline mode"
      accessibilityRole="text"
    >
      <Text style={styles.text}>{displayText}</Text>
    </View>
  );
}
