/**
 * DiscBaboons Mobile App
 * TDD Hello World Tutorial
 *
 * @format
 */

import {
  StyleSheet, Text, View,
} from 'react-native';

import { useState } from 'react';
import CustomButton from './CustomButton';

const styles = StyleSheet.create({
  container: {
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
  const [count, setCount] = useState(0);

  const containerStyle = {
    ...styles.container,
    backgroundColor: count > 0 ? 'green' : 'blue',
  };

  return (
    <View testID="app-container" style={containerStyle}>
      <Text style={styles.text}>Hello World</Text>
      <Text style={styles.text}>{`Count: ${count}`}</Text>
      <CustomButton title="Tap me!" onPress={() => { setCount(count + 1); }} />
    </View>
  );
}

export default App;
