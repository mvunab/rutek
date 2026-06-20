import { useEffect } from 'react';

/** Fuerza tema claro en páginas públicas de seguimiento y restaura al salir. */
export function useForceLightTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    const prevScheme = root.style.colorScheme;

    root.classList.remove('dark');
    root.style.colorScheme = 'light';

    return () => {
      if (hadDark) root.classList.add('dark');
      root.style.colorScheme = prevScheme || (hadDark ? 'dark' : 'light');
    };
  }, []);
}
