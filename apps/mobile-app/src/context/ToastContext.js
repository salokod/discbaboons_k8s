import {
  createContext, useContext, useState, useCallback, useMemo,
} from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const hide = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const show = useCallback((message, type = 'info', duration = 2000) => {
    setToast({ visible: true, message, type });
    setTimeout(() => hide(), duration);
  }, [hide]);

  const value = useMemo(() => ({ toast, show, hide }), [toast, show, hide]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
