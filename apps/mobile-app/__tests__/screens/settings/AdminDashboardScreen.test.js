/**
 * AdminDashboardScreen Tests
 */

import { render, screen } from '@testing-library/react-native';
import AdminDashboardScreen from '../../../src/screens/settings/AdminDashboardScreen';

// Mock dependencies
jest.mock('../../../src/context/ThemeContext', () => ({
  useThemeColors: () => ({
    background: '#FAFBFC',
    surface: '#FFFFFF',
    text: '#212121',
    textLight: '#757575',
    primary: '#ec7032',
    error: '#d32f2f',
    warning: '#f57c00',
    border: '#e0e0e0',
  }),
}));

jest.mock('../../../src/components/AppContainer', () => {
  const MockAppContainer = ({ children }) => children;
  return MockAppContainer;
});

jest.mock('@react-native-vector-icons/ionicons', () => 'MockIcon');

describe('AdminDashboardScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export a component', () => {
    expect(AdminDashboardScreen).toBeTruthy();
    expect(typeof AdminDashboardScreen).toBe('object');
  });

  it('should render with AppContainer and SafeAreaView structure', () => {
    const renderResult = render(<AdminDashboardScreen navigation={mockNavigation} />);
    expect(renderResult).toBeTruthy();
  });

  it('should display admin-focused header with title and subtitle', () => {
    render(<AdminDashboardScreen navigation={mockNavigation} />);
    expect(screen.getByText('Admin Dashboard')).toBeTruthy();
    expect(screen.getByText('Manage disc submissions and community content')).toBeTruthy();
  });

  it('should display Pending Discs navigation option', () => {
    render(<AdminDashboardScreen navigation={mockNavigation} />);
    expect(screen.getByText('Pending Discs')).toBeTruthy();
    expect(screen.getByText('Review and approve community disc submissions')).toBeTruthy();
  });
});
