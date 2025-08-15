/**
 * AboutScreen Component Simple Tests
 */

import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AboutScreen from '../../../src/screens/settings/AboutScreen';
import { ThemeProvider } from '../../../src/context/ThemeContext';

// Wrapper component with all necessary providers
function TestWrapper({ children }) {
  return (
    <NavigationContainer>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </NavigationContainer>
  );
}

describe('AboutScreen', () => {
  it('should export a component', () => {
    expect(AboutScreen).toBeDefined();
    expect(typeof AboutScreen).toBe('object'); // memo returns an object
  });

  it('should render app information correctly', () => {
    render(
      <TestWrapper>
        <AboutScreen />
      </TestWrapper>,
    );

    expect(screen.getByText('DiscBaboons')).toBeTruthy();
    expect(screen.getByText('Your ultimate disc golf companion')).toBeTruthy();
    expect(screen.getByText('App Information')).toBeTruthy();
    expect(screen.getByText('0.0.1')).toBeTruthy(); // App version
  });

  it('should display platform information', () => {
    render(
      <TestWrapper>
        <AboutScreen />
      </TestWrapper>,
    );

    expect(screen.getByText('Platform')).toBeTruthy();
    // Platform could be iOS or Android depending on test environment
    expect(screen.getByText(/iOS|Android/)).toBeTruthy();
  });

  it('should render legal and support links', () => {
    render(
      <TestWrapper>
        <AboutScreen />
      </TestWrapper>,
    );

    expect(screen.getByText('Terms of Service')).toBeTruthy();
    expect(screen.getByText('Privacy Policy')).toBeTruthy();
    expect(screen.getByText('Support')).toBeTruthy();
    expect(screen.getByText('Visit discbaboons.com')).toBeTruthy();
  });

  it('should display static information only', () => {
    render(
      <TestWrapper>
        <AboutScreen />
      </TestWrapper>,
    );

    // Should show static app version (not dynamic)
    expect(screen.getByText('App Version')).toBeTruthy();
    expect(screen.getByText('0.0.1')).toBeTruthy();

    // Should show footer text
    expect(screen.getByText('Made with ❤️ for the disc golf community')).toBeTruthy();
  });

  it('should not make any API calls', () => {
    // Spy on fetch to ensure no network requests
    const fetchSpy = jest.spyOn(global, 'fetch');

    render(
      <TestWrapper>
        <AboutScreen />
      </TestWrapper>,
    );

    // AboutScreen should be completely static
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
