import { useState, useEffect } from 'react';

type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const breakpointValues: Record<Breakpoint, string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    const updateMatches = () => setMatches(media.matches);
    
    updateMatches();
    
    const listener = () => updateMatches();
    
    if (media.addEventListener) {
      media.addEventListener('change', listener);
    } else {
      media.addListener(listener);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', listener);
      } else {
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

export function useBreakpoint(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${breakpointValues[breakpoint]})`);
}

export function useBreakpoints(): Record<Breakpoint, boolean> {
  const [breakpoints, setBreakpoints] = useState<Record<Breakpoint, boolean>>({
    sm: false,
    md: false,
    lg: false,
    xl: false,
    '2xl': false,
  });

  useEffect(() => {
    const updateBreakpoints = () => {
      setBreakpoints({
        sm: window.matchMedia(`(min-width: ${breakpointValues.sm})`).matches,
        md: window.matchMedia(`(min-width: ${breakpointValues.md})`).matches,
        lg: window.matchMedia(`(min-width: ${breakpointValues.lg})`).matches,
        xl: window.matchMedia(`(min-width: ${breakpointValues.xl})`).matches,
        '2xl': window.matchMedia(`(min-width: ${breakpointValues['2xl']})`).matches,
      });
    };

    updateBreakpoints();

    const listeners: (() => void)[] = [];
    
    (Object.keys(breakpointValues) as Breakpoint[]).forEach(bp => {
      const mql = window.matchMedia(`(min-width: ${breakpointValues[bp]})`);
      
      const listener = () => updateBreakpoints();
      mql.addEventListener('change', listener);
      listeners.push(() => mql.removeEventListener('change', listener));
    });

    return () => {
      listeners.forEach(unsub => unsub());
    };
  }, []);

  return breakpoints;
}

export function useIsMobile(): boolean {
  return !useMediaQuery('(min-width: 768px)');
}

export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

export default useMediaQuery;