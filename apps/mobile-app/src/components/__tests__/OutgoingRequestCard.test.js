/**
 * OutgoingRequestCard Component Tests
 * Tests for displaying outgoing friend request cards with cancel functionality
 */

import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../context/ThemeContext';
import OutgoingRequestCard from '../OutgoingRequestCard';

// Mock react-native-vector-icons
jest.mock('@react-native-vector-icons/ionicons', () => 'Icon');

const mockRequest = {
  id: 789,
  requester_id: 123,
  recipient_id: 456,
  status: 'pending',
  recipient: {
    id: 456,
    username: 'janedoe',
    profile_image: null,
  },
  created_at: '2024-01-15T10:30:00.000Z',
};

const mockOnCancel = jest.fn();

const renderWithTheme = (component) => render(
  <ThemeProvider>
    {component}
  </ThemeProvider>,
);

describe('OutgoingRequestCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export OutgoingRequestCard component', () => {
    expect(OutgoingRequestCard).toBeDefined();
  });

  it('should display recipient username and pending status', () => {
    renderWithTheme(
      <OutgoingRequestCard
        request={mockRequest}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByText('janedoe')).toBeOnTheScreen();
    expect(screen.getByText('Pending')).toBeOnTheScreen();
  });

  it('should display cancel button', () => {
    renderWithTheme(
      <OutgoingRequestCard
        request={mockRequest}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByText('Cancel')).toBeOnTheScreen();
  });

  it('should call onCancel when cancel button is pressed', () => {
    renderWithTheme(
      <OutgoingRequestCard
        request={mockRequest}
        onCancel={mockOnCancel}
      />,
    );

    fireEvent.press(screen.getByTestId('cancel-button'));

    expect(mockOnCancel).toHaveBeenCalledWith(789);
  });
});
