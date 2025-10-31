import { render, act, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { BottomSheetProvider, useBottomSheet } from '../../src/context/BottomSheetContext';

describe('BottomSheetContext', () => {
  it('should export a provider', () => {
    expect(BottomSheetProvider).toBeDefined();
    expect(useBottomSheet).toBeDefined();
  });

  it('should open and close sheets', () => {
    function TestComponent() {
      const { openSheet, closeSheet, sheets } = useBottomSheet();
      return (
        <>
          <Text testID="sheet-state">{sheets.testSheet ? 'open' : 'closed'}</Text>
          <TouchableOpacity
            testID="open-button"
            onPress={() => openSheet('testSheet', { data: 'test' })}
          >
            <Text>Open</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="close-button"
            onPress={() => closeSheet('testSheet')}
          >
            <Text>Close</Text>
          </TouchableOpacity>
        </>
      );
    }

    const { getByTestId } = render(
      <BottomSheetProvider>
        <TestComponent />
      </BottomSheetProvider>,
    );

    // Initially closed
    expect(getByTestId('sheet-state').children[0]).toBe('closed');

    // Open sheet
    act(() => {
      fireEvent.press(getByTestId('open-button'));
    });
    expect(getByTestId('sheet-state').children[0]).toBe('open');

    // Close sheet
    act(() => {
      fireEvent.press(getByTestId('close-button'));
    });
    expect(getByTestId('sheet-state').children[0]).toBe('closed');
  });

  it('should handle multiple sheets', () => {
    function TestComponent() {
      const { openSheet, closeSheet, sheets } = useBottomSheet();
      return (
        <>
          <Text testID="sheet1-state">{sheets.sheet1 ? 'open' : 'closed'}</Text>
          <Text testID="sheet2-state">{sheets.sheet2 ? 'open' : 'closed'}</Text>
          <TouchableOpacity
            testID="open-sheet1"
            onPress={() => openSheet('sheet1', { data: 'test1' })}
          >
            <Text>Open Sheet 1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="open-sheet2"
            onPress={() => openSheet('sheet2', { data: 'test2' })}
          >
            <Text>Open Sheet 2</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="close-sheet1"
            onPress={() => closeSheet('sheet1')}
          >
            <Text>Close Sheet 1</Text>
          </TouchableOpacity>
        </>
      );
    }

    const { getByTestId } = render(
      <BottomSheetProvider>
        <TestComponent />
      </BottomSheetProvider>,
    );

    // Initially both closed
    expect(getByTestId('sheet1-state').children[0]).toBe('closed');
    expect(getByTestId('sheet2-state').children[0]).toBe('closed');

    // Open first sheet
    act(() => {
      fireEvent.press(getByTestId('open-sheet1'));
    });
    expect(getByTestId('sheet1-state').children[0]).toBe('open');
    expect(getByTestId('sheet2-state').children[0]).toBe('closed');

    // Open second sheet
    act(() => {
      fireEvent.press(getByTestId('open-sheet2'));
    });
    expect(getByTestId('sheet1-state').children[0]).toBe('open');
    expect(getByTestId('sheet2-state').children[0]).toBe('open');

    // Close first sheet
    act(() => {
      fireEvent.press(getByTestId('close-sheet1'));
    });
    expect(getByTestId('sheet1-state').children[0]).toBe('closed');
    expect(getByTestId('sheet2-state').children[0]).toBe('open');
  });
});
