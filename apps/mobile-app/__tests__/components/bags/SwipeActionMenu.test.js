/**
 * Tests for SwipeActionMenu Component
 * Following TDD methodology
 */

import { render } from '@testing-library/react-native';
import SwipeActionMenu from '../../../src/components/bags/SwipeActionMenu';

const renderComponent = (component) => render(component);

describe('SwipeActionMenu', () => {
  it('should export a function', () => {
    expect(typeof SwipeActionMenu).toBe('function');
  });

  it('should accept actions prop', () => {
    const mockActions = [
      { id: 'edit', label: 'Edit', color: '#007AFF' },
      { id: 'delete', label: 'Delete', color: '#FF3B30' },
    ];

    expect(() => {
      renderComponent(
        <SwipeActionMenu actions={mockActions} />,
      );
    }).not.toThrow();
  });

  it('should render action buttons', () => {
    const mockActions = [
      { id: 'edit', label: 'Edit', color: '#007AFF' },
      { id: 'delete', label: 'Delete', color: '#FF3B30' },
    ];

    const { getByText } = renderComponent(
      <SwipeActionMenu actions={mockActions} />,
    );

    expect(getByText('Edit')).toBeTruthy();
    expect(getByText('Delete')).toBeTruthy();
  });

  it('should accept progress prop for opacity', () => {
    const mockActions = [
      { id: 'edit', label: 'Edit', color: '#007AFF' },
    ];

    expect(() => {
      renderComponent(
        <SwipeActionMenu actions={mockActions} progress={0.5} />,
      );
    }).not.toThrow();
  });

  it('should accept animation progress prop', () => {
    const mockActions = [
      { id: 'edit', label: 'Edit', color: '#007AFF' },
    ];

    expect(() => {
      renderComponent(
        <SwipeActionMenu actions={mockActions} progress={0.5} />,
      );
    }).not.toThrow();
  });
});
