export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

let toasts: Toast[] = [];
let listeners: ((toasts: Toast[]) => void)[] = [];

export function createToast(message: string, type: ToastType = 'info', duration = 4000) {
  const id = Math.random().toString(36).slice(2);
  const toast: Toast = { id, type, message, duration };

  toasts = [...toasts, toast];
  notifyListeners();

  setTimeout(() => {
    removeToast(id);
  }, duration);

  return id;
}

export function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  notifyListeners();
}

export function onToastChange(listener: (toasts: Toast[]) => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

function notifyListeners() {
  listeners.forEach(listener => listener([...toasts]));
}

export const toast = {
  success: (message: string) => createToast(message, 'success'),
  error: (message: string) => createToast(message, 'error'),
  info: (message: string) => createToast(message, 'info'),
  warning: (message: string) => createToast(message, 'warning'),
};
