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
  } else if (name === 'play-circle') {
    iconText = '▶️';
  } else if (name === 'checkmark-circle') {
    iconText = '✅';
  } else if (name === 'close-circle') {
    iconText = '❌';
  } else if (name === 'time') {
    iconText = '⏰';
  } else if (name === 'people') {
    iconText = '👥';
  } else if (name === 'cash') {
    iconText = '💰';
  } else if (name === 'close') {
    iconText = '✖️';
  } else if (name === 'lock-closed') {
    iconText = '🔒';
  }

  return (
    <Text
      style={{
        fontSize: size,
        color,
        fontFamily: 'Ionicons',
      }}
      name={name}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
    >
      {iconText}
    </Text>
  );
}

export default Icon;
