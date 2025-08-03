/**
 * DiscBaboons Mobile App
 * TDD Hello World Tutorial
 *
 * @format
 */

import { StyleSheet, Text, View } from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'blue',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

function App() {
  return (
    <View testID="app-container" style={styles.container}>
      <Text style={styles.text}>Hello World</Text>
    </View>
  );
}

export default App;
