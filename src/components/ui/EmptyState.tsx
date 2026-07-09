import React from 'react';

interface EmptyStateProps {
  /** Nome do ícone Material Symbols a exibir */
  icon?: string;
  /** Título principal do estado vazio */
  title: string;
  /** Descrição auxiliar para orientar o usuário */
  description?: string;
  /** Ação opcional: elemento React (botão, link, etc.) */
  action?: React.ReactNode;
  /** Classe CSS extra para o container */
  className?: string;
}

/**
 * Componente genérico de estado vazio.
 * Exibido quando não há dados para mostrar em uma lista ou seção.
 *
 * @example
 * <EmptyState
 *   icon="family_restroom"
 *   title="Nenhuma família encontrada"
 *   description="Crie sua primeira família para começar a construir sua árvore genealógica."
 *   action={{ label: 'Criar família', onClick: handleCreate }}
 * />
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-xl px-lg text-center ${className}`}
      role="status"
      aria-label={title}
    >
      {/* Ícone */}
      <div className="w-16 h-16 rounded-full bg-surface-container dark:bg-dark-surface-container flex items-center justify-center mb-md">
        <span
          className="material-symbols-outlined text-4xl text-on-surface-variant dark:text-dark-on-surface-variant"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      {/* Título */}
      <h3 className="font-title-lg text-title-lg text-on-surface dark:text-dark-on-surface mb-xs">
        {title}
      </h3>

      {/* Descrição */}
      {description && (
        <p className="font-body-md text-body-md text-on-surface-variant dark:text-dark-on-surface-variant max-w-xs">
          {description}
        </p>
      )}

      {/* Ação personalizada */}
      {action && (
        <div className="mt-lg">
          {action}
        </div>
      )}
    </div>
  );
};

export { EmptyState };
export default EmptyState;
