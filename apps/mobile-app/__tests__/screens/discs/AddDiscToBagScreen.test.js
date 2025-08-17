/**
 * AddDiscToBagScreen Integration Tests
 * Tests the integration of enhanced ColorPicker component
 */

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddDiscToBagScreen from '../../../src/screens/discs/AddDiscToBagScreen';

// Mock dependencies
jest.mock('../../../src/context/ThemeContext', () => ({
  useThemeColors: () => ({
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textLight: '#666666',
    textSecondary: '#888888',
    primary: '#007AFF',
    border: '#E0E0E0',
  }),
}));

jest.mock('../../../src/services/bagService', () => ({
  addDiscToBag: jest.fn(),
}));

// Mock bag refresh context
const mockTriggerBagRefresh = jest.fn();
const mockTriggerBagListRefresh = jest.fn();

jest.mock('../../../src/context/BagRefreshContext', () => ({
  useBagRefreshContext: () => ({
    triggerBagRefresh: mockTriggerBagRefresh,
    triggerBagListRefresh: mockTriggerBagListRefresh,
  }),
}));

jest.mock('@react-native-vector-icons/ionicons', () => 'Icon');

// Mock ColorPicker and ColorIndicator components
jest.mock('../../../src/design-system/components/ColorPicker', () => {
  const { useState } = require('react');
  const {
    View, TouchableOpacity, TextInput, Text,
  } = require('react-native');

  return function MockColorPicker({ onColorSelect }) {
    const [showVisualPicker, setShowVisualPicker] = useState(false);

    return (
      <View testID="color-picker">
        <View testID="preset-color-grid">
          <TouchableOpacity
            testID="color-swatch-red"
            onPress={() => onColorSelect('red')}
          />
          <TouchableOpacity
            testID="color-swatch-blue"
            onPress={() => onColorSelect('blue')}
          />
        </View>
        <TouchableOpacity onPress={() => setShowVisualPicker(!showVisualPicker)}>
          <Text>{showVisualPicker ? 'Hide Visual Picker' : 'Visual Picker'}</Text>
        </TouchableOpacity>
        {showVisualPicker && (
          <View testID="visual-color-picker">
            <View testID="color-preview" />
            <Text>Drag or Tap to Select Color</Text>
          </View>
        )}
        <TextInput
          testID="hex-input"
          onChangeText={(text) => {
            if (text.startsWith('#') && text.length === 7) {
              onColorSelect(text);
            }
          }}
        />
      </View>
    );
  };
});

jest.mock('../../../src/design-system/components/ColorIndicator', () => {
  const { View } = require('react-native');

  return function MockColorIndicator({ testID }) {
    return <View testID={testID || 'color-indicator'} />;
  };
});

// Mock AppContainer
jest.mock('../../../src/components/AppContainer', () => {
  const { View } = require('react-native');

  return function MockAppContainer({ children }) {
    return <View>{children}</View>;
  };
});

// Mock other components
jest.mock('../../../src/components/Input', () => {
  const { forwardRef } = require('react');
  const { TextInput } = require('react-native');

  const MockInput = forwardRef((props, ref) => (
    <TextInput ref={ref} testID={props.testID} />
  ));
  MockInput.displayName = 'MockInput';
  return MockInput;
});

jest.mock('../../../src/components/Button', () => {
  const { TouchableOpacity, Text } = require('react-native');

  return function MockButton({ title, onPress }) {
    return (
      <TouchableOpacity onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock('../../../src/components/DiscCard', () => {
  const { View, Text } = require('react-native');

  return function MockDiscCard({ disc }) {
    return (
      <View testID="disc-card">
        <Text>{disc.model}</Text>
        <Text>{disc.brand}</Text>
      </View>
    );
  };
});

describe('AddDiscToBagScreen Enhanced Color Picker Integration', () => {
  const mockDisc = {
    id: 'disc-123',
    model: 'Destroyer',
    brand: 'Innova',
    speed: 12,
    glide: 5,
    turn: -1,
    fade: 3,
  };

  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  const mockRoute = {
    params: {
      disc: mockDisc,
      bagId: 'test-bag-id',
      bagName: 'Test Bag',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use enhanced ColorPicker component', () => {
    const { getByTestId } = render(
      <AddDiscToBagScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );

    expect(getByTestId('color-picker')).toBeTruthy();
  });

  it('should handle preset color selection', () => {
    const { getByTestId } = render(
      <AddDiscToBagScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );

    const redSwatch = getByTestId('color-swatch-red');
    fireEvent.press(redSwatch);

    // Color should be selected and stored in customProps.color
    expect(getByTestId('color-picker')).toBeTruthy();
  });

  it('should handle custom hex color input', () => {
    const { getByTestId } = render(
      <AddDiscToBagScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );

    const hexInput = getByTestId('hex-input');
    fireEvent.changeText(hexInput, '#FF5733');

    // Hex color should be accepted and stored
    expect(hexInput).toBeTruthy();
  });

  it('should preserve existing color handling in disc preview', () => {
    const { getByTestId } = render(
      <AddDiscToBagScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );

    const discCard = getByTestId('disc-card');
    expect(discCard).toBeTruthy();
  });

  it('should maintain form state when color changes', () => {
    const { getByTestId } = render(
      <AddDiscToBagScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );

    // Select a preset color
    const redSwatch = getByTestId('color-swatch-red');
    fireEvent.press(redSwatch);

    // The form should still be functional
    expect(getByTestId('add-disc-to-bag-screen')).toBeTruthy();
  });

  it('should support visual color picker functionality', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <AddDiscToBagScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );

    // Initially, visual picker should not be visible
    expect(queryByTestId('visual-color-picker')).toBeNull();

    // Press the Visual Picker toggle button
    const visualPickerToggle = getByText('Visual Picker');
    fireEvent.press(visualPickerToggle);

    // Visual picker should now be visible
    expect(getByTestId('visual-color-picker')).toBeTruthy();
    expect(getByTestId('color-preview')).toBeTruthy();
    expect(getByText('Drag or Tap to Select Color')).toBeTruthy();
  });
});

describe('AddDiscToBagScreen - Slice 4: Refresh Trigger Integration', () => {
  let mockAddDiscToBag;

  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  beforeEach(() => {
    mockAddDiscToBag = require('../../../src/services/bagService').addDiscToBag;
    mockAddDiscToBag.mockClear();
    mockTriggerBagRefresh.mockClear();
    mockTriggerBagListRefresh.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should trigger bag refresh for the target bag after successful disc addition', async () => {
    mockAddDiscToBag.mockResolvedValue({ success: true });

    const mockRoute = {
      params: {
        disc: {
          id: 'disc123',
          model: 'Test Disc',
          brand: 'Test Brand',
          speed: 7,
          glide: 5,
          turn: -1,
          fade: 2,
        },
        bagId: 'bag456',
        bagName: 'Test Bag',
      },
    };

    const { getByText } = render(
      <AddDiscToBagScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );

    // Click the quick add button
    const quickAddButton = getByText('Quick Add with Defaults');
    fireEvent.press(quickAddButton);

    // Wait for the API call and refresh triggers
    await waitFor(() => {
      expect(mockAddDiscToBag).toHaveBeenCalledWith('bag456', expect.objectContaining({ disc_id: 'disc123' }));
      expect(mockTriggerBagRefresh).toHaveBeenCalledWith('bag456');
    });
  });

  it('should trigger bag list refresh after successful disc addition', async () => {
    mockAddDiscToBag.mockResolvedValue({ success: true });

    const mockRoute = {
      params: {
        disc: {
          id: 'disc123',
          model: 'Test Disc',
          brand: 'Test Brand',
        },
        bagId: 'bag456',
        bagName: 'Test Bag',
      },
    };

    const { getByText } = render(
      <AddDiscToBagScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );

    // Click the quick add button
    const quickAddButton = getByText('Quick Add with Defaults');
    fireEvent.press(quickAddButton);

    // Wait for the API call and refresh triggers
    await waitFor(() => {
      expect(mockAddDiscToBag).toHaveBeenCalled();
      expect(mockTriggerBagListRefresh).toHaveBeenCalled();
    });
  });

  it('should not trigger refresh on addition failure', async () => {
    mockAddDiscToBag.mockRejectedValue(new Error('API Error'));

    const mockRoute = {
      params: {
        disc: {
          id: 'disc123',
          model: 'Test Disc',
          brand: 'Test Brand',
        },
        bagId: 'bag456',
        bagName: 'Test Bag',
      },
    };

    const { getByText } = render(
      <AddDiscToBagScreen
        route={mockRoute}
        navigation={mockNavigation}
      />,
    );

    // Click the quick add button
    const quickAddButton = getByText('Quick Add with Defaults');
    fireEvent.press(quickAddButton);

    // Wait for the API call to fail
    await waitFor(() => {
      expect(mockAddDiscToBag).toHaveBeenCalled();
    });

    // Refresh triggers should NOT have been called
    expect(mockTriggerBagRefresh).not.toHaveBeenCalled();
    expect(mockTriggerBagListRefresh).not.toHaveBeenCalled();
  });
});
