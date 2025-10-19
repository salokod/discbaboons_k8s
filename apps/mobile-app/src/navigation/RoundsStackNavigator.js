import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RoundsListScreen from '../screens/rounds/RoundsListScreen';
import CreateRoundScreen from '../screens/rounds/CreateRoundScreen';
import RoundDetailScreen from '../screens/rounds/RoundDetailScreen';
import ScorecardScreen from '../screens/rounds/ScorecardScreen';
import ScorecardRedesignScreen from '../screens/rounds/ScorecardRedesignScreen';
// RoundSummaryScreen removed in Phase 2 Slice 9 - all rounds now navigate to RoundDetail

const Stack = createNativeStackNavigator();

export default function RoundsStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="RoundsList"
      screenOptions={{
        headerShown: false, // Will be handled by the tab navigator
      }}
    >
      <Stack.Screen name="RoundsList" component={RoundsListScreen} />
      <Stack.Screen name="CreateRound" component={CreateRoundScreen} />
      <Stack.Screen name="RoundDetail" component={RoundDetailScreen} />
      <Stack.Screen name="Scorecard" component={ScorecardScreen} />
      <Stack.Screen name="ScorecardRedesign" component={ScorecardRedesignScreen} />
      {/* RoundSummary screen removed in Phase 2 Slice 9 - all rounds navigate to RoundDetail */}
    </Stack.Navigator>
  );
}
