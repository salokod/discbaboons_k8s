/**
 * BottomTabNavigator
 * Bottom tab navigation component for mobile app
 */

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useThemeColors } from '../context/ThemeContext';
import BagsStackNavigator from './BagsStackNavigator';
import RoundsStackNavigator from './RoundsStackNavigator';
import CommunityStackNavigator from './CommunityStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';

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
    case 'Rounds':
      iconName = focused ? 'golf' : 'golf-outline';
      break;
    case 'Baboons':
      iconName = focused ? 'people' : 'people-outline';
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
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

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
            paddingBottom: Math.max(insets.bottom, 8), // Use dynamic safe area with minimum padding
            paddingTop: 8,
            height: Math.max(insets.bottom + 60, 70), // Dynamic height based on safe area
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
          name="Rounds"
          component={RoundsStackNavigator}
          options={{
            tabBarLabel: 'Rounds',
            tabBarAccessibilityLabel: 'Rounds tab. Track your disc golf rounds and scores.',
            tabBarTestID: 'rounds-tab',
          }}
        />
        <Tab.Screen
          name="Baboons"
          component={CommunityStackNavigator}
          options={{
            tabBarLabel: 'Baboons',
            tabBarAccessibilityLabel: 'Baboons tab. Community features.',
            tabBarTestID: 'baboons-tab',
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileStackNavigator}
          options={{
            tabBarLabel: 'Profile',
            tabBarAccessibilityLabel: 'Profile tab. Settings and account management.',
            tabBarTestID: 'profile-tab',
          }}
        />
      </Tab.Navigator>
    </View>
  );
}
