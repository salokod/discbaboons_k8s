/**
 * FlightNumberSection Component Tests
 * Testing the extracted flight number editing section
 */

import { render, fireEvent } from '@testing-library/react-native';
import FlightNumberSection from '../../../src/components/shared/FlightNumberSection';

// Mock theme context
const mockColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#000000',
  textLight: '#666666',
  primary: '#007AFF',
  border: '#E0E0E0',
};

jest.mock('../../../src/context/ThemeContext', () => ({
  useThemeColors: () => mockColors,
}));

// Mock react-native-vector-icons
jest.mock('@react-native-vector-icons/ionicons', () => 'Icon');

describe('FlightNumberSection', () => {
  const defaultProps = {
    flightNumbers: {
      speed: '12',
      glide: '5',
      turn: '-1',
      fade: '2',
    },
    onFlightNumberChange: jest.fn(),
    masterFlightNumbers: {
      speed: 12,
      glide: 5,
      turn: -1,
      fade: 2,
    },
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Export', () => {
    it('should export a function or memoized component', () => {
      // Component is wrapped with React.memo, so it's an object with $$typeof property
      expect(typeof FlightNumberSection === 'function' || typeof FlightNumberSection === 'object').toBe(true);
      expect(FlightNumberSection).toBeDefined();
    });
  });

  describe('Basic Rendering', () => {
    it('should render flight number inputs with labels (speed, glide, turn, fade)', () => {
      const { getByText } = render(
        <FlightNumberSection
          flightNumbers={defaultProps.flightNumbers}
          onFlightNumberChange={defaultProps.onFlightNumberChange}
          masterFlightNumbers={defaultProps.masterFlightNumbers}
          disabled={defaultProps.disabled}
        />,
      );

      // Check that all flight number labels are present
      expect(getByText('Speed (1-15)')).toBeTruthy();
      expect(getByText('Glide (1-7)')).toBeTruthy();
      expect(getByText('Turn (-5 to 2)')).toBeTruthy();
      expect(getByText('Fade (0-5)')).toBeTruthy();
    });
  });

  describe('Increment/Decrement Functionality', () => {
    it('should call onFlightNumberChange when increment button is pressed', () => {
      const mockOnChange = jest.fn();
      const props = {
        ...defaultProps,
        onFlightNumberChange: mockOnChange,
        flightNumbers: {
          speed: '12',
          glide: '5',
          turn: '-1',
          fade: '2',
        },
      };

      const { getAllByTestId } = render(
        <FlightNumberSection
          flightNumbers={props.flightNumbers}
          onFlightNumberChange={props.onFlightNumberChange}
          masterFlightNumbers={props.masterFlightNumbers}
          disabled={props.disabled}
        />,
      );

      // Find the speed increment button (add button for speed)
      const addButtons = getAllByTestId('flight-number-add-button');
      const speedAddButton = addButtons[0]; // First add button should be for speed

      // Press the increment button
      fireEvent.press(speedAddButton);

      // Verify onFlightNumberChange was called with incremented value
      expect(mockOnChange).toHaveBeenCalledWith('speed', '13');
    });

    it('should call onFlightNumberChange when decrement button is pressed', () => {
      const mockOnChange = jest.fn();
      const props = {
        ...defaultProps,
        onFlightNumberChange: mockOnChange,
        flightNumbers: {
          speed: '12',
          glide: '5',
          turn: '-1',
          fade: '2',
        },
      };

      const { getAllByTestId } = render(
        <FlightNumberSection
          flightNumbers={props.flightNumbers}
          onFlightNumberChange={props.onFlightNumberChange}
          masterFlightNumbers={props.masterFlightNumbers}
          disabled={props.disabled}
        />,
      );

      // Find the speed decrement button (remove button for speed)
      const removeButtons = getAllByTestId('flight-number-remove-button');
      const speedRemoveButton = removeButtons[0]; // First remove button should be for speed

      // Press the decrement button
      fireEvent.press(speedRemoveButton);

      // Verify onFlightNumberChange was called with decremented value
      expect(mockOnChange).toHaveBeenCalledWith('speed', '11');
    });
  });

  describe('Validation Boundaries', () => {
    it('should disable increment button when at max boundary (speed 15)', () => {
      const mockOnChange = jest.fn();
      const props = {
        ...defaultProps,
        onFlightNumberChange: mockOnChange,
        flightNumbers: {
          speed: '15', // At max
          glide: '5',
          turn: '-1',
          fade: '2',
        },
      };

      const { getAllByTestId } = render(
        <FlightNumberSection
          flightNumbers={props.flightNumbers}
          onFlightNumberChange={props.onFlightNumberChange}
          masterFlightNumbers={props.masterFlightNumbers}
          disabled={props.disabled}
        />,
      );

      // Speed add button should be disabled when at max
      const addButtons = getAllByTestId('flight-number-add-button');
      const speedAddButton = addButtons[0];

      // Check disabled state through accessibility state
      expect(speedAddButton.props.accessibilityState.disabled).toBe(true);

      // Try to press disabled button - should not call onChange
      fireEvent.press(speedAddButton);
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should disable increment button when at max boundary (glide 7)', () => {
      const mockOnChange = jest.fn();
      const props = {
        ...defaultProps,
        onFlightNumberChange: mockOnChange,
        flightNumbers: {
          speed: '12',
          glide: '7', // At max
          turn: '-1',
          fade: '2',
        },
      };

      const { getAllByTestId } = render(
        <FlightNumberSection
          flightNumbers={props.flightNumbers}
          onFlightNumberChange={props.onFlightNumberChange}
          masterFlightNumbers={props.masterFlightNumbers}
          disabled={props.disabled}
        />,
      );

      // Glide add button should be disabled when at max
      const addButtons = getAllByTestId('flight-number-add-button');
      const glideAddButton = addButtons[1];

      expect(glideAddButton.props.accessibilityState.disabled).toBe(true);

      // Try to press disabled button - should not call onChange
      fireEvent.press(glideAddButton);
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should disable decrement button when at min boundary (turn -5)', () => {
      const mockOnChange = jest.fn();
      const props = {
        ...defaultProps,
        onFlightNumberChange: mockOnChange,
        flightNumbers: {
          speed: '12',
          glide: '5',
          turn: '-5', // At min
          fade: '2',
        },
      };

      const { getAllByTestId } = render(
        <FlightNumberSection
          flightNumbers={props.flightNumbers}
          onFlightNumberChange={props.onFlightNumberChange}
          masterFlightNumbers={props.masterFlightNumbers}
          disabled={props.disabled}
        />,
      );

      // Turn remove button should be disabled when at min
      const removeButtons = getAllByTestId('flight-number-remove-button');
      const turnRemoveButton = removeButtons[2];

      expect(turnRemoveButton.props.accessibilityState.disabled).toBe(true);

      // Try to press disabled button - should not call onChange
      fireEvent.press(turnRemoveButton);
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should disable decrement button when at min boundary (fade 0)', () => {
      const mockOnChange = jest.fn();
      const props = {
        ...defaultProps,
        onFlightNumberChange: mockOnChange,
        flightNumbers: {
          speed: '12',
          glide: '5',
          turn: '-1',
          fade: '0', // At min
        },
      };

      const { getAllByTestId } = render(
        <FlightNumberSection
          flightNumbers={props.flightNumbers}
          onFlightNumberChange={props.onFlightNumberChange}
          masterFlightNumbers={props.masterFlightNumbers}
          disabled={props.disabled}
        />,
      );

      // Fade remove button should be disabled when at min
      const removeButtons = getAllByTestId('flight-number-remove-button');
      const fadeRemoveButton = removeButtons[3];

      expect(fadeRemoveButton.props.accessibilityState.disabled).toBe(true);

      // Try to press disabled button - should not call onChange
      fireEvent.press(fadeRemoveButton);
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });
});
