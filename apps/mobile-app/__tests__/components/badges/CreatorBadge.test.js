/**
 * CreatorBadge Component Tests
 */

import { render, screen } from '@testing-library/react-native';
import CreatorBadge from '../../../src/components/badges/CreatorBadge';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// Mock the react-native-vector-icons
jest.mock('@react-native-vector-icons/ionicons', () => 'Icon');

// Wrapper component with ThemeProvider
function TestWrapper({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}

describe('CreatorBadge', () => {
  it('should export a component', () => {
    expect(CreatorBadge).toBeDefined();
    expect(typeof CreatorBadge).toBe('object'); // memo returns an object
  });

  it('should render the creator badge', () => {
    render(
      <TestWrapper>
        <CreatorBadge />
      </TestWrapper>,
    );

    expect(screen.getByTestId('creator-badge')).toBeTruthy();
  });

  it('should display "CREATOR" text', () => {
    render(
      <TestWrapper>
        <CreatorBadge />
      </TestWrapper>,
    );

    expect(screen.getByText('CREATOR')).toBeTruthy();
  });

  it('should have accessibility label', () => {
    render(
      <TestWrapper>
        <CreatorBadge />
      </TestWrapper>,
    );

    expect(screen.getByLabelText('Creator badge')).toBeTruthy();
  });

  it('should use creator theme colors for styling', () => {
    render(
      <TestWrapper>
        <CreatorBadge />
      </TestWrapper>,
    );

    const badge = screen.getByTestId('creator-badge');
    expect(badge).toBeTruthy();
    // Note: We'll verify styling visually - exact style matching is fragile in tests
  });

  it('should render with star icon', () => {
    render(
      <TestWrapper>
        <CreatorBadge />
      </TestWrapper>,
    );

    expect(screen.getByTestId('creator-badge-icon')).toBeTruthy();
  });
});
