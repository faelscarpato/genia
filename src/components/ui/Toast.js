import React, { useEffect } from 'react';

/**
 * Mapeamento de classes de cor e ícones por tipo de toast.
 * Usa tokens do design system — compatível com dark mode.
 */
const TOAST_STYLES = {
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

/**
 * Componente de notificação toast.
 *
 * @param {object} props
 * @param {string} props.message - Mensagem a exibir
 * @param {'success'|'error'|'warning'|'info'} [props.type='info'] - Tipo visual
 * @param {() => void} props.onClose - Callback chamado ao fechar (automático em 4s)
 */
const Toast = ({ message, type = 'info', onClose }) => {
  const styles = TOAST_STYLES[type] ?? TOAST_STYLES.info;

  // Fecha automaticamente após 4 segundos
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
      {/* Ícone Material Symbols */}
      <span className="material-symbols-outlined text-[20px] shrink-0" aria-hidden="true">
        {styles.icon}
      </span>

      <span className="text-sm font-medium flex-1">{message}</span>

      {/* Botão de fechar manual */}
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
