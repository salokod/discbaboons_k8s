import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BagsListScreen from '../screens/bags/BagsListScreen';
import CreateBagScreen from '../screens/bags/CreateBagScreen';
import BagDetailScreen from '../screens/bags/BagDetailScreen';
import EditBagScreen from '../screens/bags/EditBagScreen';

const Stack = createNativeStackNavigator();

export default function BagsStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="BagsList"
      screenOptions={{
        headerShown: false, // Will be handled by the tab navigator
      }}
    >
      <Stack.Screen name="BagsList" component={BagsListScreen} />
      <Stack.Screen name="CreateBag" component={CreateBagScreen} />
      <Stack.Screen name="BagDetail" component={BagDetailScreen} />
      <Stack.Screen name="EditBag" component={EditBagScreen} />
    </Stack.Navigator>
  );
}
