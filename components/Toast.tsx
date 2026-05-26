'use client';

import { useEffect, useState } from 'react';
import { onToastChange, removeToast } from '@/lib/toast';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration: number;
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return onToastChange(setToasts);
  }, []);

  const getIcon = (type: Toast['type']) => {
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️',
    };
    return icons[type];
  };

  const getColors = (type: Toast['type']) => {
    const colors = {
      success: 'bg-green-500/20 border-green-500/30 text-green-300',
      error: 'bg-red-500/20 border-red-500/30 text-red-300',
      info: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
      warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
    };
    return colors[type];
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${getColors(toast.type)} border rounded-lg p-4 flex items-start gap-3 animate-slide-in-right`}
          role="alert"
          aria-live="polite"
        >
          <span className="text-xl flex-shrink-0 mt-0.5">{getIcon(toast.type)}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-current opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 ml-2"
            aria-label="Fermer le message"
          >
            ✕
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(400px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
