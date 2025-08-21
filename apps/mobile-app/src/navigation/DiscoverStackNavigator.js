import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DiscSearchScreen from '../screens/discs/DiscSearchScreen';
import SubmitDiscScreen from '../screens/discs/SubmitDiscScreen';
import DiscDatabaseScreen from '../screens/settings/DiscDatabaseScreen';

const Stack = createNativeStackNavigator();

export default function DiscoverStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="DiscSearch"
      screenOptions={{
        headerShown: false, // Will be handled by the tab navigator
      }}
    >
      <Stack.Screen name="DiscSearch" component={DiscSearchScreen} />
      <Stack.Screen name="SubmitDisc" component={SubmitDiscScreen} />
      <Stack.Screen name="DiscDatabase" component={DiscDatabaseScreen} />
    </Stack.Navigator>
  );
}
