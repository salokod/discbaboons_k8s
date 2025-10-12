/**
 * SkeletonCard Tests
 */

import { render } from '@testing-library/react-native';
import SkeletonCard from '../SkeletonCard';

// Mock ThemeContext
jest.mock('../../../context/ThemeContext', () => ({
  useThemeColors: jest.fn(() => ({
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#000000',
    primary: '#007AFF',
    border: '#E5E5EA',
  })),
}));

// Mock Card component
jest.mock('../../../design-system/components/Card', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function Card({ children }) {
    return React.createElement(View, { testID: 'card' }, children);
  };
});

// Mock SkeletonLoader component
jest.mock('../../../components/settings/SkeletonLoader', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function SkeletonLoader({ testID, height, width }) {
    return React.createElement(View, {
      testID: testID || 'skeleton-loader',
      'data-height': height,
      'data-width': width,
    });
  };
});

describe('SkeletonCard', () => {
  it('should export SkeletonCard component', () => {
    expect(SkeletonCard).toBeTruthy();
  });

  it('should render Card wrapper', () => {
    const { getByTestId } = render(<SkeletonCard />);
    expect(getByTestId('card')).toBeTruthy();
  });

  it('should render skeleton loaders for title, subtitle, and caption', () => {
    const { getAllByTestId } = render(<SkeletonCard />);

    const skeletonLoaders = getAllByTestId('skeleton-loader');
    // Should have at least 3 skeleton loaders (title, subtitle, caption)
    expect(skeletonLoaders.length).toBeGreaterThanOrEqual(3);
  });

  it('should have testID skeleton-card on container', () => {
    const { getByTestId } = render(<SkeletonCard />);
    expect(getByTestId('skeleton-card')).toBeTruthy();
  });
});
