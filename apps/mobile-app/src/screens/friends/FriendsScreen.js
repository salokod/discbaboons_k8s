/**
 * FriendsScreen Component
 * Main screen for displaying friends list and managing friendships
 */

import {
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useThemeColors } from '../../context/ThemeContext';
import AppContainer from '../../components/AppContainer';
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
      <SafeAreaView testID="friends-screen" style={styles.container}>
        <BaboonsTabView navigation={navigation} />
      </SafeAreaView>
    </AppContainer>
  );
}

FriendsScreen.displayName = 'FriendsScreen';

export default FriendsScreen;
