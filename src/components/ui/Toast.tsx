import React, { useEffect } from 'react';
import type { ToastType } from '../../types';

// ============================================================
// TIPOS
// ============================================================

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
}

// ============================================================
// ESTILOS
// ============================================================

const TOAST_STYLES: Record<ToastType, { container: string; icon: string }> = {
  success: {
    container: 'bg-green-700 dark:bg-green-800 text-white',
    icon: 'check_circle',
  },
  error: {
    container: 'bg-error dark:bg-dark-error text-white dark:text-dark-on-error',
    icon: 'cancel',
  },
  warning: {
    container: 'bg-yellow-600 dark:bg-yellow-700 text-white',
    icon: 'warning',
  },
  info: {
    container: 'bg-secondary dark:bg-dark-secondary text-on-secondary dark:text-dark-on-secondary',
    icon: 'info',
  },
};

// ============================================================
// COMPONENTE
// ============================================================

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const styles = TOAST_STYLES[type] ?? TOAST_STYLES.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`toast-enter px-4 py-3 rounded-lg shadow-lg ${styles.container} flex items-center gap-3 min-w-[300px] max-w-sm`}
    >
      <span className="material-symbols-outlined text-[20px] shrink-0" aria-hidden="true">
        {styles.icon}
      </span>
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar notificação"
        className="shrink-0 ml-1 opacity-70 hover:opacity-100 transition-opacity"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
      </button>
    </div>
  );
};

export default Toast;
