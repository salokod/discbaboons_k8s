/**
 * BottomTabNavigator
 * Bottom tab navigation component for mobile app
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, StyleSheet } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useAuth } from '../context/AuthContext';
import { useThemeColors } from '../context/ThemeContext';
import BagsStackNavigator from './BagsStackNavigator';
import DiscoverStackNavigator from './DiscoverStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';
import AdminStackNavigator from './AdminStackNavigator';

const Tab = createBottomTabNavigator();

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

// Icon configuration function
const getTabBarIcon = (route, focused, color) => {
  let iconName;
  const iconSize = 24;

  switch (route.name) {
    case 'Bags':
      iconName = focused ? 'bag' : 'bag-outline';
      break;
    case 'Discover':
      iconName = focused ? 'compass' : 'compass-outline';
      break;
    case 'Admin':
      iconName = focused ? 'settings' : 'settings-outline';
      break;
    case 'Profile':
      iconName = focused ? 'person' : 'person-outline';
      break;
    default:
      iconName = 'ellipse-outline';
  }

  return <Icon name={iconName} size={iconSize} color={color} />;
};

export default function BottomTabNavigator() {
  const { user } = useAuth();
  const colors = useThemeColors();

  return (
    <View testID="bottom-tab-navigator" style={styles.container}>
      <Tab.Navigator
        initialRouteName="Bags"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingBottom: Platform.select({
              ios: 20, // Account for home indicator on iOS
              android: 10,
            }),
            paddingTop: 8,
            height: Platform.select({
              ios: 85, // Proper height for iOS with safe area
              android: 70,
            }),
            shadowColor: colors.text,
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 8, // Android shadow
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textLight,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarIcon: ({ focused, color }) => getTabBarIcon(route, focused, color),
        })}
      >
        <Tab.Screen
          name="Bags"
          component={BagsStackNavigator}
          options={{
            tabBarLabel: 'Bags',
            tabBarAccessibilityLabel: 'Bags tab. Manage your disc golf bags and equipment.',
            tabBarTestID: 'bags-tab',
          }}
        />
        <Tab.Screen
          name="Discover"
          component={DiscoverStackNavigator}
          options={{
            tabBarLabel: 'Discover',
            tabBarAccessibilityLabel: 'Discover tab. Search and explore disc golf discs.',
            tabBarTestID: 'discover-tab',
          }}
        />
        {user?.isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminStackNavigator}
          options={{
            tabBarLabel: 'Admin',
            tabBarAccessibilityLabel: 'Admin tab. Access administrative features and controls.',
            tabBarTestID: 'admin-tab',
          }}
        />
        )}
        <Tab.Screen
          name="Profile"
          component={ProfileStackNavigator}
          options={{
            tabBarLabel: 'Profile',
            tabBarAccessibilityLabel: 'Profile tab. View and manage your account settings.',
            tabBarTestID: 'profile-tab',
          }}
        />
      </Tab.Navigator>
    </View>
  );
}
