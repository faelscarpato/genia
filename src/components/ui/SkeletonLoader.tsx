import React from 'react';

// ─── Componentes individuais de skeleton ──────────────────────────────────────

/**
 * Linha de texto skeleton.
 *
 * @param {{ className?: string }} props
 */
export const SkeletonText: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`h-4 bg-surface-container-high dark:bg-dark-surface-container-high rounded animate-pulse ${className}`}
    aria-hidden="true"
  />
);

/**
 * Avatar / ícone circular skeleton.
 *
 * @param {{ size?: number }} props
 */
export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <div
    className="rounded-full bg-surface-container-high dark:bg-dark-surface-container-high animate-pulse shrink-0"
    style={{ width: size, height: size }}
    aria-hidden="true"
  />
);

/**
 * Card skeleton genérico — replica a estrutura de um card com cabeçalho e linhas de conteúdo.
 */
export const SkeletonCard: React.FC = () => (
  <div
    className="bg-surface dark:bg-dark-surface border border-outline-variant dark:border-dark-outline-variant rounded-xl p-lg animate-pulse"
    aria-hidden="true"
  >
    {/* Cabeçalho */}
    <div className="flex items-center gap-md mb-md">
      <SkeletonAvatar size={36} />
      <div className="flex-1 space-y-xs">
        <SkeletonText className="w-1/2" />
        <SkeletonText className="w-1/4 h-3" />
      </div>
    </div>
    {/* Linhas de conteúdo */}
    <div className="space-y-sm">
      <SkeletonText className="w-full" />
      <SkeletonText className="w-5/6" />
      <SkeletonText className="w-4/6" />
    </div>
    {/* Footer */}
    <div className="mt-md flex items-center justify-between">
      <SkeletonText className="w-24 h-3" />
      <SkeletonText className="w-16 h-8 rounded-lg" />
    </div>
  </div>
);

/**
 * Lista skeleton — renderiza N itens de linha com avatar + texto.
 *
 * @param {{ count?: number }} props
 */
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-sm" aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-md p-sm bg-surface dark:bg-dark-surface border border-outline-variant dark:border-dark-outline-variant rounded-lg animate-pulse"
      >
        <SkeletonAvatar size={32} />
        <div className="flex-1 space-y-xs">
          <SkeletonText className="w-1/3" />
          <SkeletonText className="w-1/2 h-3" />
        </div>
        <SkeletonText className="w-16 h-3" />
      </div>
    ))}
  </div>
);

/** Exportação padrão com todos os componentes agrupados */
const SkeletonLoader = { SkeletonCard, SkeletonList, SkeletonText, SkeletonAvatar };

export default SkeletonLoader;
