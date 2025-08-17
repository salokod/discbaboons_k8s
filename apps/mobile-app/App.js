/**
 * DiscBaboons Mobile App
 */

import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { BagRefreshProvider } from './src/context/BagRefreshContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ForgotUsernameScreen from './src/screens/ForgotUsernameScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import SupportScreen from './src/screens/SupportScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import DrawerNavigator from './src/navigation/DrawerNavigator';

// Wrapped screen components to avoid inline definitions
function WrappedForgotPasswordScreen(props) {
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <ForgotPasswordScreen {...props} />
    </ErrorBoundary>
  );
}

function WrappedForgotUsernameScreen(props) {
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <ForgotUsernameScreen {...props} />
    </ErrorBoundary>
  );
}

function WrappedResetPasswordScreen(props) {
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <ResetPasswordScreen {...props} />
    </ErrorBoundary>
  );
}

function WrappedSupportScreen(props) {
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <SupportScreen {...props} />
    </ErrorBoundary>
  );
}

function WrappedPrivacyPolicyScreen(props) {
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <PrivacyPolicyScreen {...props} />
    </ErrorBoundary>
  );
}

function WrappedTermsOfServiceScreen(props) {
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <TermsOfServiceScreen {...props} />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const AuthStack = createNativeStackNavigator();

function LoginScreenWithNavigation({ navigation, route }) {
  return (
    <ErrorBoundary>
      <LoginScreen
        navigation={navigation}
        route={route}
        onForgotPassword={() => navigation.navigate('ForgotPassword')}
        onForgotUsername={() => navigation.navigate('ForgotUsername')}
        onPrivacyPolicy={() => navigation.navigate('PrivacyPolicy')}
        onTermsOfService={() => navigation.navigate('TermsOfService')}
        onSupport={() => navigation.navigate('Support')}
      />
    </ErrorBoundary>
  );
}

function AuthNavigator() {
  return (
    <View testID="auth-navigator" style={styles.container}>
      <ErrorBoundary>
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreenWithNavigation} />
          <AuthStack.Screen
            name="ForgotPassword"
            component={WrappedForgotPasswordScreen}
          />
          <AuthStack.Screen
            name="ForgotUsername"
            component={WrappedForgotUsernameScreen}
          />
          <AuthStack.Screen
            name="ResetPassword"
            component={WrappedResetPasswordScreen}
          />
          <AuthStack.Screen
            name="Support"
            component={WrappedSupportScreen}
          />
          <AuthStack.Screen
            name="PrivacyPolicy"
            component={WrappedPrivacyPolicyScreen}
          />
          <AuthStack.Screen
            name="TermsOfService"
            component={WrappedTermsOfServiceScreen}
          />
        </AuthStack.Navigator>
      </ErrorBoundary>
    </View>
  );
}

function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <View testID="navigation-container" style={styles.container}>
      {isAuthenticated ? <DrawerNavigator /> : <AuthNavigator />}
    </View>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BagRefreshProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </BagRefreshProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
