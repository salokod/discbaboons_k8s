import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FriendsProvider } from '../context/FriendsContext';
import FriendsScreen from '../screens/friends/FriendsScreen';

const Stack = createNativeStackNavigator();

export default function CommunityStackNavigator() {
  return (
    <FriendsProvider>
      <Stack.Navigator
        initialRouteName="Friends"
        screenOptions={{
          headerShown: false, // Will be handled by the tab navigator
        }}
      >
        <Stack.Screen name="Friends" component={FriendsScreen} />
      </Stack.Navigator>
    </FriendsProvider>
  );
}
