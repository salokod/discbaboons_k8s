/**
 * DiscBaboons Mobile App
 */

import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';

const AuthStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <View testID="auth-navigator">
      {/* Placeholder for auth screens */}
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
    <View testID="navigation-container" style={{ flex: 1 }}>
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
