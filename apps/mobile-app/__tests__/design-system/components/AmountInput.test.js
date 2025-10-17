/**
 * AmountInput Component Tests
 */

import { render, fireEvent } from '@testing-library/react-native';
import AmountInput from '../../../src/design-system/components/AmountInput';
import { ThemeProvider } from '../../../src/context/ThemeContext';

describe('AmountInput component', () => {
  it('should export a component', () => {
    expect(AmountInput).toBeTruthy();
  });

  it('should render an amount input field', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <AmountInput />
      </ThemeProvider>,
    );

    expect(getByTestId('amount-input')).toBeTruthy();
  });

  describe('Input Character Filtering', () => {
    it('should only allow numeric characters and decimal point', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent.changeText(getByTestId('amount-input-field'), '123.45');
      expect(onChangeTextMock).toHaveBeenCalledWith('123.45');
    });

    it('should filter out alphabetic characters', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent.changeText(getByTestId('amount-input-field'), 'abc123');
      expect(onChangeTextMock).toHaveBeenCalledWith('123');
    });

    it('should filter out special characters except decimal point', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent.changeText(getByTestId('amount-input-field'), '$1@2#3.45%');
      expect(onChangeTextMock).toHaveBeenCalledWith('123.45');
    });

    it('should allow only one decimal point', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent.changeText(getByTestId('amount-input-field'), '12.34.56');
      // Should keep first decimal and limit to 2 decimal places
      expect(onChangeTextMock).toHaveBeenCalledWith('12.34');
    });
  });

  describe('Visual $ Prefix Display', () => {
    it('should display $ prefix when value is present', () => {
      const { getByTestId, getByText } = render(
        <ThemeProvider>
          <AmountInput value="10.00" />
        </ThemeProvider>,
      );

      expect(getByTestId('amount-prefix')).toBeTruthy();
      expect(getByText('$')).toBeTruthy();
    });

    it('should not display $ prefix when value is empty', () => {
      const { queryByTestId } = render(
        <ThemeProvider>
          <AmountInput value="" />
        </ThemeProvider>,
      );

      expect(queryByTestId('amount-prefix')).toBeNull();
    });

    it('should not display $ prefix when value is undefined', () => {
      const { queryByTestId } = render(
        <ThemeProvider>
          <AmountInput />
        </ThemeProvider>,
      );

      expect(queryByTestId('amount-prefix')).toBeNull();
    });
  });

  describe('Decimal Place Limiting', () => {
    it('should limit decimal places to 2', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent.changeText(getByTestId('amount-input-field'), '10.999');
      expect(onChangeTextMock).toHaveBeenCalledWith('10.99');
    });

    it('should allow exactly 2 decimal places', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent.changeText(getByTestId('amount-input-field'), '10.99');
      expect(onChangeTextMock).toHaveBeenCalledWith('10.99');
    });

    it('should allow less than 2 decimal places', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent.changeText(getByTestId('amount-input-field'), '10.5');
      expect(onChangeTextMock).toHaveBeenCalledWith('10.5');
    });

    it('should allow decimal point without digits after', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent.changeText(getByTestId('amount-input-field'), '10.');
      expect(onChangeTextMock).toHaveBeenCalledWith('10.');
    });
  });

  describe('Format on Blur', () => {
    it('should format to 2 decimal places when field loses focus', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput value="10.5" onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent(getByTestId('amount-input-field'), 'blur');
      expect(onChangeTextMock).toHaveBeenCalledWith('10.50');
    });

    it('should add .00 to whole numbers on blur', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput value="10" onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent(getByTestId('amount-input-field'), 'blur');
      expect(onChangeTextMock).toHaveBeenCalledWith('10.00');
    });

    it('should not call onChangeText if already 2 decimal places', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput value="10.99" onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent(getByTestId('amount-input-field'), 'blur');
      // Should not call onChangeText if value is already formatted correctly
      expect(onChangeTextMock).not.toHaveBeenCalled();
    });

    it('should remove trailing decimal point on blur', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput value="10." onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent(getByTestId('amount-input-field'), 'blur');
      expect(onChangeTextMock).toHaveBeenCalledWith('10.00');
    });

    it('should not format empty value on blur', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput value="" onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent(getByTestId('amount-input-field'), 'blur');
      expect(onChangeTextMock).not.toHaveBeenCalled();
    });
  });

  describe('Empty Field Handling', () => {
    it('should allow empty value', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput value="" onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      expect(getByTestId('amount-input-field')).toBeTruthy();
      expect(getByTestId('amount-input-field').props.value).toBe('');
    });

    it('should handle clearing the field', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput value="10.00" onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent.changeText(getByTestId('amount-input-field'), '');
      expect(onChangeTextMock).toHaveBeenCalledWith('');
    });

    it('should not show $ prefix when field is cleared', () => {
      const { queryByTestId, rerender } = render(
        <ThemeProvider>
          <AmountInput value="10.00" />
        </ThemeProvider>,
      );

      expect(queryByTestId('amount-prefix')).toBeTruthy();

      rerender(
        <ThemeProvider>
          <AmountInput value="" />
        </ThemeProvider>,
      );

      expect(queryByTestId('amount-prefix')).toBeNull();
    });

    it('should accept zero as valid input', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent.changeText(getByTestId('amount-input-field'), '0');
      expect(onChangeTextMock).toHaveBeenCalledWith('0');
    });

    it('should format zero on blur', () => {
      const onChangeTextMock = jest.fn();
      const { getByTestId } = render(
        <ThemeProvider>
          <AmountInput value="0" onChangeText={onChangeTextMock} />
        </ThemeProvider>,
      );

      fireEvent(getByTestId('amount-input-field'), 'blur');
      expect(onChangeTextMock).toHaveBeenCalledWith('0.00');
    });
  });
});
