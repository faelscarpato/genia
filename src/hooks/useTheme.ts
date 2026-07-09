import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'genealogia-ia-theme';

/**
 * Detecta a preferência de tema do sistema operacional.
 */
function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Recupera o tema salvo no localStorage ou, se não existir, usa o tema do sistema.
 */
function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // localStorage pode estar bloqueado em alguns contextos
  }
  return getSystemTheme();
}

/**
 * Aplica ou remove a classe 'dark' no elemento <html>.
 */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

/**
 * Hook para gerenciar o tema claro/escuro da aplicação.
 *
 * - Lê `prefers-color-scheme` do sistema na primeira execução
 * - Persiste a escolha do usuário no localStorage (`genealogia-ia-theme`)
 * - Aplica / remove a classe `dark` no `document.documentElement`
 * - Escuta mudanças automáticas na preferência do sistema
 *
 * @example
 * const { theme, toggleTheme } = useTheme();
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Aplica o tema no DOM sempre que ele mudar
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Escuta mudanças na preferência do sistema enquanto não há tema salvo
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const hasSaved = localStorage.getItem(STORAGE_KEY);
      if (!hasSaved) {
        const newTheme: Theme = e.matches ? 'dark' : 'light';
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  /**
   * Define explicitamente o tema e persiste no localStorage.
   */
  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // silencia erros de localStorage
    }
    setThemeState(newTheme);
  }, []);

  /**
   * Alterna entre 'light' e 'dark'.
   */
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return { theme, toggleTheme, setTheme };
}

export default useTheme;
