/**
 * DiscBaboons Mobile App
 */

import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

function AuthNavigator() {
  return (
    <View testID="auth-navigator" style={styles.container}>
      <LoginScreen />
    </View>
  );
}

function AppNavigator() {
  return (
    <View testID="app-navigator">
      {/* Placeholder for authenticated app screens */}
    </View>
  );
}

function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <View testID="navigation-container" style={styles.container}>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </View>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
