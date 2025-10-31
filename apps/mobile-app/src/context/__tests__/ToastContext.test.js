import { renderHook, act, waitFor } from '@testing-library/react-native';
import { ToastProvider, useToast } from '../ToastContext';
import { ThemeProvider } from '../ThemeContext';

describe('ToastContext', () => {
  it('exports ToastProvider and useToast', () => {
    expect(ToastProvider).toBeDefined();
    expect(useToast).toBeDefined();
  });

  it('throws error when useToast is used outside ToastProvider', () => {
    expect(() => {
      renderHook(() => useToast());
    }).toThrow('useToast must be used within ToastProvider');
  });

  it('show() displays toast with message', () => {
    const wrapper = ({ children }) => (
      <ThemeProvider testMode>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    expect(result.current.toast.visible).toBe(false);

    act(() => {
      result.current.show('Test message', 'info');
    });

    expect(result.current.toast.visible).toBe(true);
    expect(result.current.toast.message).toBe('Test message');
    expect(result.current.toast.type).toBe('info');
  });

  it('hide() dismisses toast', () => {
    const wrapper = ({ children }) => (
      <ThemeProvider testMode>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.show('Test message', 'success');
    });

    expect(result.current.toast.visible).toBe(true);

    act(() => {
      result.current.hide();
    });

    expect(result.current.toast.visible).toBe(false);
  });

  it('auto-dismiss after duration', async () => {
    const wrapper = ({ children }) => (
      <ThemeProvider testMode>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.show('Test message', 'success', 100);
    });

    expect(result.current.toast.visible).toBe(true);

    await waitFor(() => {
      expect(result.current.toast.visible).toBe(false);
    }, { timeout: 200 });
  });

  it('uses default duration of 2000ms', async () => {
    const wrapper = ({ children }) => (
      <ThemeProvider testMode>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.show('Test message');
    });

    expect(result.current.toast.visible).toBe(true);

    // Should still be visible after 1000ms
    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
    expect(result.current.toast.visible).toBe(true);

    // Should be hidden after 2000ms
    await waitFor(() => {
      expect(result.current.toast.visible).toBe(false);
    }, { timeout: 1500 });
  });

  it('multiple toasts queue properly', async () => {
    const wrapper = ({ children }) => (
      <ThemeProvider testMode>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    );
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.show('First message', 'info', 100);
    });

    expect(result.current.toast.message).toBe('First message');

    act(() => {
      result.current.show('Second message', 'success', 100);
    });

    // Latest message should replace previous
    expect(result.current.toast.message).toBe('Second message');
    expect(result.current.toast.type).toBe('success');
  });
});
