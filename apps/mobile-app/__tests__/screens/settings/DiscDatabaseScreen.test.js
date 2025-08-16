/**
 * DiscDatabaseScreen Tests
 */

import { render, screen } from '@testing-library/react-native';
import DiscDatabaseScreen from '../../../src/screens/settings/DiscDatabaseScreen';

// Mock dependencies
jest.mock('../../../src/context/ThemeContext', () => ({
  useThemeColors: () => ({
    background: '#FAFBFC',
    surface: '#FFFFFF',
    text: '#212121',
    textLight: '#757575',
    primary: '#ec7032',
    border: '#e0e0e0',
  }),
}));

jest.mock('../../../src/components/AppContainer', () => {
  const MockAppContainer = ({ children }) => children;
  return MockAppContainer;
});

jest.mock('@react-native-vector-icons/ionicons', () => 'MockIcon');

describe('DiscDatabaseScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export a component', () => {
    expect(DiscDatabaseScreen).toBeTruthy();
    expect(typeof DiscDatabaseScreen).toBe('object');
  });

  it('should render with AppContainer and SafeAreaView structure', () => {
    const renderResult = render(<DiscDatabaseScreen navigation={mockNavigation} />);
    expect(renderResult).toBeTruthy();
  });

  it('should display header with title and subtitle', () => {
    render(<DiscDatabaseScreen navigation={mockNavigation} />);
    expect(screen.getByText('Disc Database')).toBeTruthy();
    expect(screen.getByText('Search and submit disc information')).toBeTruthy();
  });

  it('should display Search Discs and Submit New Disc navigation options', () => {
    render(<DiscDatabaseScreen navigation={mockNavigation} />);
    expect(screen.getByText('Search Discs')).toBeTruthy();
    expect(screen.getByText('Submit New Disc')).toBeTruthy();
    expect(screen.getByText('Find discs by brand, model, type, and more')).toBeTruthy();
    expect(screen.getByText('Add a new disc to our community database')).toBeTruthy();
  });

  it('should have proper accessibility labels', () => {
    render(<DiscDatabaseScreen navigation={mockNavigation} />);
    expect(screen.getByLabelText('Search for discs in the database')).toBeTruthy();
    expect(screen.getByLabelText('Submit a new disc to the database')).toBeTruthy();
  });
});
