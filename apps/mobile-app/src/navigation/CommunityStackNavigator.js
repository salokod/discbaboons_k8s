import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CommunityScreen from '../screens/community/CommunityScreen';

const Stack = createNativeStackNavigator();

export default function CommunityStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Community"
      screenOptions={{
        headerShown: false, // Will be handled by the tab navigator
      }}
    >
      <Stack.Screen name="Community" component={CommunityScreen} />
    </Stack.Navigator>
  );
}
