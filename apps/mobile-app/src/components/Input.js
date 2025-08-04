/**
 * Input Component
 */

import { TextInput } from 'react-native';

function Input({ placeholder, value, onChangeText }) {
  return (
    <TextInput 
      testID="input" 
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
    />
  );
}

export default Input;