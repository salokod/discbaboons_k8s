/**
 * IncomingRequestCard Component Tests
 * Tests for displaying incoming friend request cards with action buttons
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../context/ThemeContext';
import IncomingRequestCard from '../IncomingRequestCard';

// Mock react-native-vector-icons
jest.mock('@react-native-vector-icons/ionicons', () => 'Icon');

const mockRequest = {
  id: 456,
  requester_id: 789,
  recipient_id: 123,
  status: 'pending',
  requester: {
    id: 789,
    username: 'johndoe',
    email: 'johndoe@example.com',
  },
  created_at: '2024-01-15T10:30:00.000Z',
};

const mockOnAccept = jest.fn();
const mockOnDeny = jest.fn();

const renderWithTheme = (component) => render(
  <ThemeProvider>
    {component}
  </ThemeProvider>,
);

describe('IncomingRequestCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export IncomingRequestCard component', () => {
    expect(IncomingRequestCard).toBeDefined();
  });

  it('should display sender context and username with baboon terminology', () => {
    renderWithTheme(
      <IncomingRequestCard
        request={mockRequest}
        onAccept={mockOnAccept}
        onDeny={mockOnDeny}
      />,
    );

    expect(screen.getByText('johndoe')).toBeOnTheScreen();
    expect(screen.getByText(/wants to join your troop/i)).toBeOnTheScreen();
  });

  it('should display welcome and decline buttons with baboon terminology', () => {
    renderWithTheme(
      <IncomingRequestCard
        request={mockRequest}
        onAccept={mockOnAccept}
        onDeny={mockOnDeny}
      />,
    );

    expect(screen.getByText('Welcome')).toBeOnTheScreen();
    expect(screen.getByText('Decline')).toBeOnTheScreen();
  });

  it('should call onAccept when welcome button is pressed', () => {
    renderWithTheme(
      <IncomingRequestCard
        request={mockRequest}
        onAccept={mockOnAccept}
        onDeny={mockOnDeny}
      />,
    );

    fireEvent.press(screen.getByTestId('accept-button'));

    expect(mockOnAccept).toHaveBeenCalledWith(456);
  });

  it('should call onDeny when decline button is pressed', () => {
    renderWithTheme(
      <IncomingRequestCard
        request={mockRequest}
        onAccept={mockOnAccept}
        onDeny={mockOnDeny}
      />,
    );

    fireEvent.press(screen.getByTestId('deny-button'));

    expect(mockOnDeny).toHaveBeenCalledWith(456);
  });
});
