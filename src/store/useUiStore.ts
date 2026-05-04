import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyThemeClass, UI_STORAGE_KEY, type ThemeMode } from '../lib/theme';

interface UiStore {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme });
        applyThemeClass(theme);
      },
      toggleTheme: () => {
        const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
        get().setTheme(next);
      },
    }),
    {
      name: UI_STORAGE_KEY,
    },
  ),
);
