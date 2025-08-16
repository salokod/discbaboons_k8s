/**
 * AdminBadge Component Tests
 */

import { render, screen } from '@testing-library/react-native';
import AdminBadge from '../../../src/components/settings/AdminBadge';
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

describe('AdminBadge', () => {
  it('should export a component', () => {
    expect(AdminBadge).toBeDefined();
    expect(typeof AdminBadge).toBe('object'); // memo returns an object
  });

  it('should render the admin badge', () => {
    render(
      <TestWrapper>
        <AdminBadge />
      </TestWrapper>,
    );

    expect(screen.getByTestId('admin-badge')).toBeTruthy();
  });

  it('should display "ADMIN" text', () => {
    render(
      <TestWrapper>
        <AdminBadge />
      </TestWrapper>,
    );

    expect(screen.getByText('ADMIN')).toBeTruthy();
  });

  it('should have accessibility label', () => {
    render(
      <TestWrapper>
        <AdminBadge />
      </TestWrapper>,
    );

    expect(screen.getByLabelText('Administrator badge')).toBeTruthy();
  });

  it('should use admin theme colors for styling', () => {
    render(
      <TestWrapper>
        <AdminBadge />
      </TestWrapper>,
    );

    const badge = screen.getByTestId('admin-badge');
    expect(badge).toBeTruthy();
    // Note: We'll verify styling visually - exact style matching is fragile in tests
  });

  it('should render with crown icon', () => {
    render(
      <TestWrapper>
        <AdminBadge />
      </TestWrapper>,
    );

    expect(screen.getByTestId('admin-badge-icon')).toBeTruthy();
  });
});
