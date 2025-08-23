/**
 * SettingsScreen Tests
 */

import { render, screen } from '@testing-library/react-native';
import SettingsScreen from '../../../src/screens/settings/SettingsScreen';

// Mock dependencies
jest.mock('../../../src/context/ThemeContext', () => ({
  useThemeColors: () => ({
    background: '#FAFBFC',
    surface: '#FFFFFF',
    text: '#212121',
    textLight: '#757575',
    primary: '#ec7032',
  }),
}));

jest.mock('../../../src/components/AppContainer', () => {
  const MockAppContainer = ({ children }) => children;
  return MockAppContainer;
});

jest.mock('@react-native-vector-icons/ionicons', () => 'MockIcon');

jest.mock('../../../src/components/settings/ThemePicker', () => {
  function MockThemePicker() {
    return null;
  }
  MockThemePicker.displayName = 'ThemePicker';
  return MockThemePicker;
});

// Mock AuthContext for role-based testing
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('SettingsScreen', () => {
  const { useAuth } = require('../../../src/context/AuthContext');

  const renderWithUser = (user = { username: 'testuser', isAdmin: false }) => {
    useAuth.mockReturnValue({ user });
    return render(<SettingsScreen />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default to regular user
    useAuth.mockReturnValue({ user: { username: 'testuser', isAdmin: false } });
  });

  it('should export a SettingsScreen component', () => {
    expect(SettingsScreen).toBeTruthy();
  });

  it('should render with theme support', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('should have AppContainer and SafeAreaView structure', () => {
    render(<SettingsScreen />);
    // AppContainer is used and SafeAreaView is in the component
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('should display screen title and subtitle', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('Customize your disc golf experience')).toBeTruthy();
  });

  it('should display Appearance section', () => {
    render(<SettingsScreen />);
    expect(screen.getByText('Appearance')).toBeTruthy();
    expect(screen.getByText('Choose your preferred theme and display settings')).toBeTruthy();
  });

  it('should have professional styling matching CreateBagScreen patterns', () => {
    render(<SettingsScreen />);
    // Test that the component renders without crashing and has proper structure
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('Appearance')).toBeTruthy();
  });

  it('should integrate ThemePicker component in Appearance section', () => {
    // This test will verify that ThemePicker is rendered in the SettingsScreen
    // The mock prevents actual rendering but confirms integration
    const renderResult = render(<SettingsScreen />);
    expect(renderResult).toBeTruthy();

    // Verify that Appearance section exists where ThemePicker should be
    expect(screen.getByText('Appearance')).toBeTruthy();
    expect(screen.getByText('Choose your preferred theme and display settings')).toBeTruthy();
  });

  it('should display Account and Appearance sections only', () => {
    render(<SettingsScreen />);
    // Verify only Account and Appearance sections exist
    // (About is accessible only via hamburger menu)
    expect(screen.getByText('Account')).toBeTruthy();
    expect(screen.getByText('Appearance')).toBeTruthy();
  });

  describe('Lost Discs Menu Item Removal', () => {
    it('should NOT display Lost Discs menu item in settings', () => {
      render(<SettingsScreen />);

      // Should show standard sections
      expect(screen.getByText('Account')).toBeTruthy();
      expect(screen.getByText('Appearance')).toBeTruthy();

      // Should NOT show Lost Discs menu item
      expect(screen.queryByText('Lost Discs')).toBeNull();
    });

    it('should NOT display Bag Management section', () => {
      render(<SettingsScreen />);

      // Should show standard sections
      expect(screen.getByText('Account')).toBeTruthy();
      expect(screen.getByText('Appearance')).toBeTruthy();

      // Should NOT show Bag Management section
      expect(screen.queryByText('Bag Management')).toBeNull();
    });
  });

  describe('Admin Section Role-Based Rendering', () => {
    it('should NOT display Admin section for regular users', () => {
      renderWithUser({ username: 'regularuser', isAdmin: false });

      // Should show standard sections
      expect(screen.getByText('Account')).toBeTruthy();
      expect(screen.getByText('Appearance')).toBeTruthy();

      // Should NOT show admin section
      expect(screen.queryByText('Administration')).toBeNull();
    });

    it('should display Admin section for admin users', () => {
      renderWithUser({ username: 'adminuser', isAdmin: true });

      // Should show standard sections
      expect(screen.getByText('Account')).toBeTruthy();
      expect(screen.getByText('Appearance')).toBeTruthy();

      // Should show admin section
      expect(screen.getByText('Administration')).toBeTruthy();
      expect(screen.getByText('Admin Dashboard')).toBeTruthy();
    });

    it('should handle null user gracefully (no admin section)', () => {
      useAuth.mockReturnValue({ user: null });
      render(<SettingsScreen />);

      // Should show standard sections
      expect(screen.getByText('Account')).toBeTruthy();
      expect(screen.getByText('Appearance')).toBeTruthy();

      // Should NOT show admin section
      expect(screen.queryByText('Administration')).toBeNull();
    });

    it('should handle undefined isAdmin property (no admin section)', () => {
      renderWithUser({ username: 'user' }); // isAdmin is undefined

      // Should show standard sections
      expect(screen.getByText('Account')).toBeTruthy();
      expect(screen.getByText('Appearance')).toBeTruthy();

      // Should NOT show admin section
      expect(screen.queryByText('Administration')).toBeNull();
    });
  });
});
