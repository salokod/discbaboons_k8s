/**
 * ScreenWrapper Component Tests
 */

import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import ScreenWrapper from '../ScreenWrapper';

// Mock StatusBarSafeView
jest.mock('../StatusBarSafeView', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function StatusBarSafeView({ children, testID }) {
    return React.createElement(
      View,
      { testID: testID || 'status-bar-safe-view' },
      children,
    );
  };
});

describe('ScreenWrapper', () => {
  it('should export a function', () => {
    expect(typeof ScreenWrapper).toBe('function');
  });

  it('should use StatusBarSafeView internally', () => {
    const { getByTestId } = render(
      <ScreenWrapper>
        <Text>Test Content</Text>
      </ScreenWrapper>,
    );

    expect(getByTestId('status-bar-safe-view')).toBeTruthy();
  });
});
