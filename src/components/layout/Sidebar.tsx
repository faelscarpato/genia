import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSidebar } from '../../contexts/SidebarContext';
import useApp from '../../hooks/useApp';

const LINKS = [
  { path: '/dashboard',  label: 'Dashboard',   icone: 'dashboard' },
  { path: '/family',     label: 'Árvore',       icone: 'account_tree' },
  { path: '/documents',  label: 'Documentos',   icone: 'description' },
  { path: '/settings',   label: 'Configurações',icone: 'settings' },
];

/**
 * Sidebar de navegação colapsável.
 *
 * - Estado expandido: ícone + label (256px)
 * - Estado colapsado: somente ícone (72px)
 * - Indicador de rota ativa
 * - Avatar e nome do usuário na base
 * - Botão de logout
 * - Dark mode completo
 */
export function Sidebar() {
  const { isCollapsed, toggle } = useSidebar();
  const { user, family, logout } = useApp();
  const location = useLocation();

  const familyPath = family ? `/family/${family.id}` : '/family';

  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen z-50 flex flex-col
        bg-surface dark:bg-surface-container
        border-r border-outline-variant dark:border-outline-variant/40
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[72px]' : 'w-64'}
      `}
    >
      {/* Logo + toggle */}
      <div className={`flex items-center h-16 px-4 border-b border-outline-variant dark:border-outline-variant/40 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && (
          <div>
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight leading-none">Ancestry AI</h1>
            <p className="text-label-md text-on-surface-variant/60 text-[10px] mt-0.5">Digital Archive</p>
          </div>
        )}
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-highest dark:hover:bg-surface/30 transition-colors"
          aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          title={isCollapsed ? 'Expandir' : 'Recolher'}
        >
          <span className="material-symbols-outlined text-[22px]">
            {isCollapsed ? 'menu_open' : 'menu'}
          </span>
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {LINKS.map((link) => {
          const href = link.path === '/family' ? familyPath : link.path;
          const ativo = location.pathname.startsWith(link.path);

          return (
            <Link
              key={link.path}
              to={href}
              title={isCollapsed ? link.label : undefined}
              className={`
                flex items-center gap-3 px-4 py-3 mx-2 rounded-lg
                font-label-md text-label-md transition-colors duration-200
                ${ativo
                  ? 'bg-secondary-container/60 text-secondary font-bold dark:bg-secondary/20 dark:text-secondary'
                  : 'text-on-surface-variant hover:bg-surface-container-highest dark:hover:bg-surface/30 hover:text-primary'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <span className="material-symbols-outlined text-[22px] flex-shrink-0"
                style={{ fontVariationSettings: ativo ? "'FILL' 1" : "'FILL' 0" }}>
                {link.icone}
              </span>
              {!isCollapsed && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Usuário */}
      <div className={`mt-auto border-t border-outline-variant dark:border-outline-variant/40 p-3 ${isCollapsed ? 'flex justify-center' : ''}`}>
        {isCollapsed ? (
          <button
            onClick={logout}
            className="p-2 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
            title="Sair"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container flex-shrink-0 overflow-hidden">
              {user?.name ? (
                <span className="font-bold text-sm uppercase">{user.name.charAt(0)}</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">person</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-label-md font-bold text-on-surface truncate">{user?.name ?? 'Usuário'}</p>
              <p className="text-[10px] uppercase tracking-wider text-secondary truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
              title="Sair"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
