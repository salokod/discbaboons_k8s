/**
 * DiscBaboons Mobile App
 * TDD Hello World Tutorial
 *
 * @format
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function App() {
  return (
    <View testID="app-container" style={styles.container}>
      <Text>Hello World</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'blue',
  },
});

export default App;