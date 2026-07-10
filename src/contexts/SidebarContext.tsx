import React, { createContext, useContext, useState, useCallback } from 'react';

interface SidebarContextValue {
  isCollapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
}

const STORAGE_KEY = 'genealogia-ia-sidebar-collapsed';

export const SidebarContext = createContext<SidebarContextValue>({
  isCollapsed: false,
  toggle: () => {},
  setCollapsed: () => {},
});

/**
 * Provider do contexto da sidebar colapsável.
 * Persiste o estado no localStorage.
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setCollapsedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedState(v);
    try { localStorage.setItem(STORAGE_KEY, String(v)); } catch { /* silencia */ }
  }, []);

  const toggle = useCallback(() => {
    setCollapsed(!isCollapsed);
  }, [isCollapsed, setCollapsed]);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggle, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}

export default SidebarContext;
