import React from 'react';
import { Sidebar } from './Sidebar';
import { useSidebar } from '../../contexts/SidebarContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout padrão para páginas autenticadas.
 * Inclui Sidebar colapsável e ajusta o padding-left automaticamente.
 */
export function AppLayout({ children }: AppLayoutProps) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background dark:bg-on-background/5">
      <Sidebar />
      <main
        className={`
          min-h-screen transition-all duration-300 ease-in-out
          ${isCollapsed ? 'md:ml-[72px]' : 'md:ml-64'}
        `}
      >
        {children}
      </main>
    </div>
  );
}

export default AppLayout;
