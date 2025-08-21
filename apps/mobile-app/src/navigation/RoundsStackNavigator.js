import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RoundsScreen from '../screens/rounds/RoundsScreen';

const Stack = createNativeStackNavigator();

export default function RoundsStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="RoundsList"
      screenOptions={{
        headerShown: false, // Will be handled by the tab navigator
      }}
    >
      <Stack.Screen name="RoundsList" component={RoundsScreen} />
    </Stack.Navigator>
  );
}
