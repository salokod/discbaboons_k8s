import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useThemeColors } from '../context/ThemeContext';
import { FriendsProvider } from '../context/FriendsContext';
import FriendsScreen from '../screens/friends/FriendsScreen';
import BaboonSearchScreen from '../screens/friends/BaboonSearchScreen';

const Stack = createNativeStackNavigator();

export default function CommunityStackNavigator() {
  const colors = useThemeColors();

  return (
    <FriendsProvider>
      <Stack.Navigator
        initialRouteName="Friends"
        screenOptions={{
          headerShown: false, // Will be handled by the tab navigator
        }}
      >
        <Stack.Screen name="Friends" component={FriendsScreen} />
        <Stack.Screen
          name="BaboonSearch"
          component={BaboonSearchScreen}
          options={{
            title: 'Find Baboons',
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTitleStyle: {
              color: colors.text,
            },
            headerTintColor: colors.text,
          }}
        />
      </Stack.Navigator>
    </FriendsProvider>
  );
}
