/**
 * AppContainer Component
 */

import { View } from 'react-native';

function AppContainer({ children }) {
  return <View testID="app-container">{children}</View>;
}

export default AppContainer;
