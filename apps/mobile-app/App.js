/**
 * DiscBaboons Mobile App
 */

import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const AuthStack = createNativeStackNavigator();

function LoginScreenWithNavigation({ navigation, route }) {
  return <LoginScreen navigation={navigation} route={route} onForgotPassword={() => navigation.navigate('ForgotPassword')} />;
}

function AuthNavigator() {
  return (
    <View testID="auth-navigator" style={styles.container}>
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreenWithNavigation} />
        <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </AuthStack.Navigator>
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
