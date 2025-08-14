/**
 * Mock for reanimated-color-picker library
 * Provides mock implementations for testing
 */

import { View } from 'react-native';

// Mock ColorPicker component
function ColorPicker({
  children, testID, style,
}) {
  return (
    <View testID={testID} style={style}>
      {children}
    </View>
  );
}

// Mock Preview component
function Preview({ testID = 'color-preview' }) {
  return <View testID={testID} />;
}

// Mock BrightnessSlider component
function BrightnessSlider({ testID = 'brightness-slider' }) {
  return <View testID={testID} />;
}

export default ColorPicker;
export { Preview, BrightnessSlider };
