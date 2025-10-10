/**
 * RoundActionsMenu Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import RoundActionsMenu from '../RoundActionsMenu';

// Mock dependencies
jest.mock('../../../context/ThemeContext', () => ({
  useThemeColors: () => ({
    surface: '#FFFFFF',
    border: '#E1E1E1',
    text: '#000000',
    textLight: '#666666',
    background: '#F5F5F5',
    primary: '#007AFF',
  }),
}));

describe('RoundActionsMenu', () => {
  const mockOnPause = jest.fn();
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export a component', () => {
    expect(RoundActionsMenu).toBeDefined();
    expect(typeof RoundActionsMenu).toBe('function');
  });

  it('should render action buttons', () => {
    render(<RoundActionsMenu onPause={mockOnPause} onComplete={mockOnComplete} />);

    const menu = screen.getByTestId('round-actions-menu');
    expect(menu).toBeTruthy();
  });

  it('should render pause button', () => {
    render(<RoundActionsMenu onPause={mockOnPause} onComplete={mockOnComplete} />);

    const pauseButton = screen.getByTestId('pause-round-button');
    expect(pauseButton).toBeTruthy();
  });

  it('should render complete button', () => {
    render(<RoundActionsMenu onPause={mockOnPause} onComplete={mockOnComplete} />);

    const completeButton = screen.getByTestId('complete-round-button');
    expect(completeButton).toBeTruthy();
  });

  it('should render delete button as disabled', () => {
    render(<RoundActionsMenu onPause={mockOnPause} onComplete={mockOnComplete} />);

    const deleteButton = screen.getByTestId('delete-round-button');
    expect(deleteButton).toBeTruthy();
    expect(deleteButton).toBeDisabled();
  });

  it('should call onPause when pause button is pressed', () => {
    const onPause = jest.fn();
    const onComplete = jest.fn();
    const { getByTestId } = render(<RoundActionsMenu onPause={onPause} onComplete={onComplete} />);

    const pauseButton = getByTestId('pause-round-button');
    fireEvent.press(pauseButton);

    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it('should call onComplete when complete button is pressed', () => {
    const onPause = jest.fn();
    const onComplete = jest.fn();
    const { getByTestId } = render(<RoundActionsMenu onPause={onPause} onComplete={onComplete} />);

    const completeButton = getByTestId('complete-round-button');
    fireEvent.press(completeButton);

    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
