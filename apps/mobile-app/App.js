/**
 * DiscBaboons Mobile App
 */

import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useThemeColors } from './src/context/ThemeContext';
import ErrorBoundary from './src/components/ErrorBoundary';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ForgotUsernameScreen from './src/screens/ForgotUsernameScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import SupportScreen from './src/screens/SupportScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import TermsOfServiceScreen from './src/screens/TermsOfServiceScreen';
import BagsListScreen from './src/screens/bags/BagsListScreen';
import CreateBagScreen from './src/screens/bags/CreateBagScreen';
import BagDetailScreen from './src/screens/bags/BagDetailScreen';
import DiscSearchScreen from './src/screens/discs/DiscSearchScreen';
import SubmitDiscScreen from './src/screens/discs/SubmitDiscScreen';
import AdminDiscScreen from './src/screens/discs/AdminDiscScreen';
import AddDiscToBagScreen from './src/screens/discs/AddDiscToBagScreen';

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

const AppStack = createNativeStackNavigator();

function WrappedBagsListScreen(props) {
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <BagsListScreen {...props} />
    </ErrorBoundary>
  );
}

function WrappedCreateBagScreen(props) {
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <CreateBagScreen {...props} />
    </ErrorBoundary>
  );
}

function WrappedBagDetailScreen(props) {
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <BagDetailScreen {...props} />
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

function WrappedAdminDiscScreen(props) {
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <AdminDiscScreen {...props} />
    </ErrorBoundary>
  );
}

function WrappedAddDiscToBagScreen(props) {
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <AddDiscToBagScreen {...props} />
    </ErrorBoundary>
  );
}

function AppNavigator() {
  const colors = useThemeColors();

  return (
    <View testID="app-navigator" style={styles.container}>
      <ErrorBoundary>
        <AppStack.Navigator
          screenOptions={{
            headerShown: false,
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '600',
              color: colors.text,
            },
            headerBackTitleStyle: {
              fontSize: 16,
              color: colors.primary,
            },
            headerTintColor: colors.primary,
          }}
        >
          <AppStack.Screen
            name="BagsList"
            component={WrappedBagsListScreen}
            options={{
              title: 'My Bags',
            }}
          />
          <AppStack.Screen
            name="CreateBag"
            component={WrappedCreateBagScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Create Bag',
            }}
          />
          <AppStack.Screen
            name="BagDetail"
            component={WrappedBagDetailScreen}
            options={{
              headerShown: true,
              title: 'Bag Details',
            }}
          />
          <AppStack.Screen
            name="DiscSearchScreen"
            component={WrappedDiscSearchScreen}
            options={{
              headerShown: true,
              title: 'Disc Search',
              headerBackTitle: 'Back',
            }}
          />
          <AppStack.Screen
            name="SubmitDiscScreen"
            component={WrappedSubmitDiscScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Submit New Disc',
            }}
          />
          <AppStack.Screen
            name="AdminDiscScreen"
            component={WrappedAdminDiscScreen}
            options={{
              headerShown: true,
              title: 'Admin - Pending Discs',
              headerBackTitle: 'Back',
            }}
          />
          <AppStack.Screen
            name="AddDiscToBagScreen"
            component={WrappedAddDiscToBagScreen}
            options={{
              headerShown: true,
              title: 'Add to Bag',
              headerBackTitle: 'Back',
            }}
          />
        </AppStack.Navigator>
      </ErrorBoundary>
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
