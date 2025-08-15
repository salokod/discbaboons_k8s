/**
 * DrawerNavigator Component
 * Wraps the existing AppNavigator with drawer navigation
 */

import { View, StyleSheet, Dimensions } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useThemeColors } from '../context/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';

// Import all the screen components
import BagsListScreen from '../screens/bags/BagsListScreen';
import CreateBagScreen from '../screens/bags/CreateBagScreen';
import BagDetailScreen from '../screens/bags/BagDetailScreen';
import DiscSearchScreen from '../screens/discs/DiscSearchScreen';
import SubmitDiscScreen from '../screens/discs/SubmitDiscScreen';
import AdminDiscScreen from '../screens/discs/AdminDiscScreen';
import AddDiscToBagScreen from '../screens/discs/AddDiscToBagScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SettingsDrawer from '../components/settings/SettingsDrawer';

const Drawer = createDrawerNavigator();
const AppStack = createNativeStackNavigator();

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// Wrapped screen components to avoid inline definitions
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

function WrappedSettingsScreen(props) {
  return (
    <ErrorBoundary>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <SettingsScreen {...props} />
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
          <AppStack.Screen
            name="Settings"
            component={WrappedSettingsScreen}
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Settings',
              headerBackTitle: 'Back',
            }}
          />
        </AppStack.Navigator>
      </ErrorBoundary>
    </View>
  );
}

// Wrapped settings drawer to avoid inline component
function WrappedSettingsDrawer({ navigation, state, descriptors }) {
  return (
    <ErrorBoundary>
      <SettingsDrawer
        navigation={navigation}
        state={state}
        descriptors={descriptors}
      />
    </ErrorBoundary>
  );
}

function DrawerNavigator() {
  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = Math.min(screenWidth * 0.85, 320);

  return (
    <View testID="drawer-navigator" style={styles.container}>
      <ErrorBoundary>
        <Drawer.Navigator
          drawerContent={WrappedSettingsDrawer}
          screenOptions={{
            headerShown: false,
            drawerType: 'slide',
            drawerStyle: {
              width: drawerWidth,
            },
            swipeEnabled: true,
            swipeEdgeWidth: 50,
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            drawerHideStatusBarOnOpen: false,
            drawerStatusBarAnimation: 'fade',
            gestureHandlerProps: {
              minPointers: 1,
              activeOffsetX: 10,
              failOffsetY: [-5, 5],
            },
            sceneContainerStyle: {
              backgroundColor: 'transparent',
            },
          }}
        >
          <Drawer.Screen
            name="App"
            component={AppNavigator}
            options={{
              drawerLabel: 'Home',
            }}
          />
        </Drawer.Navigator>
      </ErrorBoundary>
    </View>
  );
}

export default DrawerNavigator;
