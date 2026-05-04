/** Debe coincidir con `name` del persist en `useUiStore` */
export const UI_STORAGE_KEY = 'rutek-ui';

export type ThemeMode = 'light' | 'dark';

export function applyThemeClass(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
}

/** Evita parpadeo antes de hidratar Zustand */
export function bootThemeFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(UI_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { state?: { theme?: ThemeMode } };
    const theme = parsed.state?.theme === 'dark' ? 'dark' : 'light';
    applyThemeClass(theme);
  } catch {
    /* ignore */
  }
}
