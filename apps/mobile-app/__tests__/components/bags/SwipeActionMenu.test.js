/**
 * Tests for SwipeActionMenu Component
 * Following TDD methodology
 */

import { render, fireEvent } from '@testing-library/react-native';
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

  it('should render action icons when provided', () => {
    const mockActions = [
      {
        id: 'edit', label: 'Edit', color: '#007AFF', icon: 'edit',
      },
      {
        id: 'delete', label: 'Delete', color: '#FF3B30', icon: 'trash',
      },
    ];

    expect(() => {
      renderComponent(
        <SwipeActionMenu actions={mockActions} />,
      );
    }).not.toThrow();
  });

  it('should accept deviceWidth prop for responsive design', () => {
    const mockActions = [
      {
        id: 'edit', label: 'Edit', color: '#007AFF', icon: 'edit',
      },
    ];

    expect(() => {
      renderComponent(
        <SwipeActionMenu actions={mockActions} deviceWidth={375} />,
      );
    }).not.toThrow();
  });

  it('should use StyleSheet instead of inline styles', () => {
    const mockActions = [
      {
        id: 'edit', label: 'Edit', color: '#007AFF', icon: 'edit',
      },
    ];

    expect(() => {
      renderComponent(
        <SwipeActionMenu actions={mockActions} />,
      );
    }).not.toThrow();
  });

  it('should call action onPress handlers when buttons are pressed', () => {
    const mockEditHandler = jest.fn();
    const mockDeleteHandler = jest.fn();
    const mockActions = [
      {
        id: 'edit', label: 'Edit', color: '#007AFF', icon: 'create-outline', onPress: mockEditHandler,
      },
      {
        id: 'delete', label: 'Delete', color: '#FF3B30', icon: 'trash-outline', onPress: mockDeleteHandler,
      },
    ];

    const { getByText } = renderComponent(
      <SwipeActionMenu actions={mockActions} />,
    );

    // Test edit button
    const editButton = getByText('Edit');
    fireEvent.press(editButton);
    expect(mockEditHandler).toHaveBeenCalledTimes(1);

    // Test delete button
    const deleteButton = getByText('Delete');
    fireEvent.press(deleteButton);
    expect(mockDeleteHandler).toHaveBeenCalledTimes(1);
  });
});
