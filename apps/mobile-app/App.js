/**
 * DiscBaboons Mobile App
 */

import { View, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useThemeColors } from './src/context/ThemeContext';
import { BagRefreshProvider } from './src/context/BagRefreshContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ForgotUsernameScreen from './src/screens/ForgotUsernameScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import SupportScreen from './src/screens/SupportScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import AddDiscToBagScreen from './src/screens/discs/AddDiscToBagScreen';
import EditDiscScreen from './src/screens/discs/EditDiscScreen';
import DiscSearchScreen from './src/screens/discs/DiscSearchScreen';
import SubmitDiscScreen from './src/screens/discs/SubmitDiscScreen';

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

function WrappedEditDiscScreen(props) {
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <EditDiscScreen {...props} />
    </ErrorBoundary>
  );
}

function WrappedDiscSearchScreen(props) {
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <DiscSearchScreen {...props} />
    </ErrorBoundary>
  );
}

function WrappedSubmitDiscScreen(props) {
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <SubmitDiscScreen {...props} />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gestureHandlerRoot: {
    flex: 1,
  },
});

// Theme-aware navigation options for modal screens
function getModalNavigationOptions(title, colors) {
  return {
    presentation: 'modal',
    headerShown: true,
    title,
    headerStyle: {
      backgroundColor: colors.surface,
    },
    headerTitleStyle: {
      color: colors.text,
      fontWeight: '600',
    },
    headerTintColor: colors.text,
  };
}

const AuthStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

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

function MainNavigator() {
  const { isAuthenticated } = useAuth();
  const colors = useThemeColors();

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return (
    <View testID="bottom-tab-navigator" style={styles.container}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen
          name="Main"
          component={BottomTabNavigator}
        />
        <RootStack.Screen
          name="AddDiscToBagScreen"
          component={AddDiscToBagScreen}
          options={getModalNavigationOptions('Add to Bag', colors)}
        />
        <RootStack.Screen
          name="EditDiscScreen"
          component={WrappedEditDiscScreen}
          options={getModalNavigationOptions('Edit Disc', colors)}
        />
        <RootStack.Screen
          name="DiscSearchScreen"
          component={WrappedDiscSearchScreen}
          options={getModalNavigationOptions('Search Discs', colors)}
        />
        <RootStack.Screen
          name="SubmitDiscScreen"
          component={WrappedSubmitDiscScreen}
          options={getModalNavigationOptions('Submit New Disc', colors)}
        />
      </RootStack.Navigator>
    </View>
  );
}

function RootNavigator() {
  return (
    <View testID="navigation-container" style={styles.container}>
      <MainNavigator />
    </View>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={styles.gestureHandlerRoot}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
      />
      <ThemeProvider>
        <AuthProvider>
          <BagRefreshProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </BagRefreshProvider>
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default App;
