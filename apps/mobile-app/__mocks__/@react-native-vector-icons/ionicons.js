/**
 * Mock for @react-native-vector-icons/ionicons
 */

import { Text } from 'react-native';

function Icon({
  name, size, color, ...otherProps
}) {
  let iconText = '?';
  if (name === 'eye-outline') {
    iconText = '👁';
  } else if (name === 'eye-off-outline') {
    iconText = '🙈';
  }

  return (
    <Text
      style={{
        fontSize: size,
        color,
        fontFamily: 'Ionicons',
      }}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
    >
      {iconText}
    </Text>
  );
}

export default Icon;
