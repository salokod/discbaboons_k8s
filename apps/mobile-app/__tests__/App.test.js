/**
 * @format
 */

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

test('Hello World text has white color', () => {
  render(<App />);
  const helloText = screen.getByText('Hello World');
  expect(helloText.props.style).toMatchObject({
    color: 'white',
  });
});

test('Hello World text has fontSize of 24', () => {
  render(<App />);
  const helloText = screen.getByText('Hello World');
  expect(helloText.props.style).toMatchObject({
    fontSize: 24,
  });
});

test('Hello World text has bold font weight', () => {
  render(<App />);
  const helloText = screen.getByText('Hello World');
  expect(helloText.props.style).toMatchObject({
    fontWeight: 'bold',
  });
});

test('App container has flex: 1 to take full screen', () => {
  const component = render(<App />);
  const container = component.getByTestId('app-container');
  expect(container.props.style).toMatchObject({
    flex: 1,
  });
});

test('App container centers content vertically with justifyContent', () => {
  const component = render(<App />);
  const container = component.getByTestId('app-container');
  expect(container.props.style).toMatchObject({
    justifyContent: 'center',
  });
});

test('App container centers content horizontally with alignItems', () => {
  const component = render(<App />);
  const container = component.getByTestId('app-container');
  expect(container.props.style).toMatchObject({
    alignItems: 'center',
  });
});
