/**
 * Button Component
 */

import { TouchableOpacity, Text } from 'react-native';

function Button({ title, onPress }) {
  return (
    <TouchableOpacity testID="button" onPress={onPress}>
      <Text>{title}</Text>
    </TouchableOpacity>
  );
}

export default Button;
