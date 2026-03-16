import { createContext, useContext, useCallback, useState } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, duration) => {
    const id = crypto.randomUUID();
    const dur = duration ?? (type === 'error' ? 6000 : 4000);
    // Máximo 5 toasts simultáneos; descarta el más antiguo si se supera
    setToasts((prev) => [...prev.slice(-4), { id, type, message, duration: dur }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast('success', msg, dur),
    error:   (msg, dur) => addToast('error',   msg, dur),
    warning: (msg, dur) => addToast('warning', msg, dur),
  };

  return (
    <ToastCtx.Provider value={{ toast, toasts, removeToast }}>
      {children}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
