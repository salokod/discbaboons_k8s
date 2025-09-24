/**
 * FriendsScreen Component
 * Main screen for displaying friends list and managing friendships
 */

import {
  StyleSheet,
} from 'react-native';
import { useThemeColors } from '../../context/ThemeContext';
import AppContainer from '../../components/AppContainer';
import StatusBarSafeView from '../../components/StatusBarSafeView';
import BaboonsTabView from '../../components/BaboonsTabView';

function FriendsScreen({ navigation }) {
  const colors = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });

  return (
    <AppContainer>
      <StatusBarSafeView testID="friends-screen" style={styles.container}>
        <BaboonsTabView navigation={navigation} />
      </StatusBarSafeView>
    </AppContainer>
  );
}

FriendsScreen.displayName = 'FriendsScreen';

export default FriendsScreen;
