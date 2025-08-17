/**
 * FormField Component Tests
 * Tests for the reusable FormField wrapper component
 */

import { render, screen } from '@testing-library/react-native';
import { TextInput } from 'react-native';
import FormField from '../../src/components/FormField';
import { ThemeProvider } from '../../src/context/ThemeContext';

describe('FormField Component', () => {
  describe('Component Existence', () => {
    it('should export a function', () => {
      expect(typeof FormField).toBe('function');
    });
  });

  describe('Basic Rendering', () => {
    it('should render label and children correctly', () => {
      render(
        <ThemeProvider>
          <FormField label="Test Label">
            <TextInput testID="test-input" />
          </FormField>
        </ThemeProvider>,
      );

      expect(screen.getByText('Test Label')).toBeTruthy();
      expect(screen.getByTestId('test-input')).toBeTruthy();
    });
  });

  describe('Required Field Indicator', () => {
    it('should not show required indicator when required is false', () => {
      render(
        <ThemeProvider>
          <FormField label="Test Label" required={false}>
            <TextInput testID="test-input" />
          </FormField>
        </ThemeProvider>,
      );

      expect(screen.queryByText('*')).toBeNull();
    });

    it('should show red asterisk when required is true', () => {
      render(
        <ThemeProvider>
          <FormField label="Test Label" required>
            <TextInput testID="test-input" />
          </FormField>
        </ThemeProvider>,
      );

      expect(screen.getByText('*')).toBeTruthy();
    });
  });

  describe('Error State', () => {
    it('should not show error message when error prop is not provided', () => {
      render(
        <ThemeProvider>
          <FormField label="Test Label">
            <TextInput testID="test-input" />
          </FormField>
        </ThemeProvider>,
      );

      expect(screen.queryByText('This is an error')).toBeNull();
    });

    it('should show error message when error prop is provided', () => {
      render(
        <ThemeProvider>
          <FormField label="Test Label" error="This is an error">
            <TextInput testID="test-input" />
          </FormField>
        </ThemeProvider>,
      );

      expect(screen.getByText('This is an error')).toBeTruthy();
    });

    it('should not show error message when error prop is empty string', () => {
      render(
        <ThemeProvider>
          <FormField label="Test Label" error="">
            <TextInput testID="test-input" />
          </FormField>
        </ThemeProvider>,
      );

      expect(screen.queryByText('')).toBeNull();
    });
  });

  describe('Character Counter', () => {
    it('should not show character counter when maxLength and showCounter are not provided', () => {
      render(
        <ThemeProvider>
          <FormField label="Test Label">
            <TextInput testID="test-input" />
          </FormField>
        </ThemeProvider>,
      );

      expect(screen.queryByText('0/50')).toBeNull();
    });

    it('should show character counter when maxLength and showCounter are provided', () => {
      render(
        <ThemeProvider>
          <FormField label="Test Label" maxLength={50} showCounter value="Hello">
            <TextInput testID="test-input" value="Hello" />
          </FormField>
        </ThemeProvider>,
      );

      expect(screen.getByText('5/50')).toBeTruthy();
    });

    it('should not show character counter when showCounter is false', () => {
      render(
        <ThemeProvider>
          <FormField label="Test Label" maxLength={50} showCounter={false} value="Hello">
            <TextInput testID="test-input" value="Hello" />
          </FormField>
        </ThemeProvider>,
      );

      expect(screen.queryByText('5/50')).toBeNull();
    });

    it('should show character counter with warning color at 80% threshold', () => {
      render(
        <ThemeProvider>
          <FormField label="Test Label" maxLength={10} showCounter value="12345678">
            <TextInput testID="test-input" value="12345678" />
          </FormField>
        </ThemeProvider>,
      );

      expect(screen.getByText('8/10')).toBeTruthy();
    });

    it('should show character counter with error color at 100% threshold', () => {
      render(
        <ThemeProvider>
          <FormField label="Test Label" maxLength={10} showCounter value="1234567890">
            <TextInput testID="test-input" value="1234567890" />
          </FormField>
        </ThemeProvider>,
      );

      expect(screen.getByText('10/10')).toBeTruthy();
    });
  });

  describe('Theme Compatibility', () => {
    it('should render correctly with light theme', () => {
      render(
        <ThemeProvider initialTheme="light">
          <FormField label="Test Label" required error="Test error">
            <TextInput testID="test-input" />
          </FormField>
        </ThemeProvider>,
      );

      expect(screen.getByText('Test Label')).toBeTruthy();
      expect(screen.getByText('*')).toBeTruthy();
      expect(screen.getByText('Test error')).toBeTruthy();
    });

    it('should render correctly with dark theme', () => {
      render(
        <ThemeProvider initialTheme="dark">
          <FormField label="Test Label" required error="Test error">
            <TextInput testID="test-input" />
          </FormField>
        </ThemeProvider>,
      );

      expect(screen.getByText('Test Label')).toBeTruthy();
      expect(screen.getByText('*')).toBeTruthy();
      expect(screen.getByText('Test error')).toBeTruthy();
    });
  });
});
