/**
 * AppContainer Component
 */

import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '../context/ThemeContext';

function AppContainer({ children }) {
  const colors = useThemeColors();
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });

  return <View testID="app-container" style={styles.container}>{children}</View>;
}

export default AppContainer;
