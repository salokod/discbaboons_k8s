import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminDashboardScreen from '../screens/settings/AdminDashboardScreen';
import AdminDiscScreen from '../screens/discs/AdminDiscScreen';
import DiscSearchScreen from '../screens/discs/DiscSearchScreen';
import SubmitDiscScreen from '../screens/discs/SubmitDiscScreen';

const Stack = createNativeStackNavigator();

export default function AdminStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="AdminDashboard"
      screenOptions={{
        headerShown: false, // Will be handled by the tab navigator
      }}
    >
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminDisc" component={AdminDiscScreen} />
      <Stack.Screen name="DiscSearch" component={DiscSearchScreen} />
      <Stack.Screen name="SubmitDisc" component={SubmitDiscScreen} />
    </Stack.Navigator>
  );
}
