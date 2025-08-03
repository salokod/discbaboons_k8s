/**
 * @format
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import App from '../App';

test('App component renders without crashing', () => {
  render(<App />);
});

test('App displays simple Hello World without template', () => {
  render(<App />);
  // Should have our simple Hello World
  expect(screen.getByText('Hello World')).toBeTruthy();
  // Should NOT have NewAppScreen template content
  expect(() => screen.getByText('Welcome to React Native')).toThrow();
});

test('App container has blue background color', () => {
  const component = render(<App />);
  // Find the View component directly
  const container = component.getByTestId('app-container');
  expect(container.props.style).toMatchObject({
    backgroundColor: 'blue',
  });
});