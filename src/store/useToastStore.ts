import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ToastSeverity = 'info' | 'warning' | 'error';

export interface Notification {
  id: string;
  severity: ToastSeverity;
  title: string;
  description?: string;
  /** ISO timestamp */
  createdAt: string;
  read: boolean;
  /** ms antes de cerrar el toast flotante. 0 = no cierra solo. Default: 5000 */
  duration?: number;
}

/** Lo que vive en el estado flotante (toast activo) */
export type Toast = Notification;

const HISTORY_MAX = 100;

interface NotificationStore {
  /** Toasts flotantes activos */
  toasts: Toast[];
  /** Historial completo (persiste en localStorage) */
  history: Notification[];

  push: (n: Omit<Notification, 'id' | 'createdAt' | 'read'>) => string;
  dismiss: (id: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearHistory: () => void;

  unreadCount: () => number;
}

let seq = 0;

export const useToastStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      toasts: [],
      history: [],

      push: (n) => {
        const id = `notif-${Date.now()}-${++seq}`;
        const duration = n.duration ?? 5000;
        const notif: Notification = {
          ...n,
          id,
          createdAt: new Date().toISOString(),
          read: false,
          duration,
        };

        set((s) => ({
          toasts: [...s.toasts, notif],
          history: [notif, ...s.history].slice(0, HISTORY_MAX),
        }));

        if (duration > 0) {
          setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
          }, duration);
        }

        return id;
      },

      dismiss: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      markRead: (id) =>
        set((s) => ({
          history: s.history.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllRead: () =>
        set((s) => ({ history: s.history.map((n) => ({ ...n, read: true })) })),

      clearHistory: () => set({ history: [] }),

      unreadCount: () => get().history.filter((n) => !n.read).length,
    }),
    {
      name: 'rutek-notifications',
      partialize: (s) => ({ history: s.history }),
    },
  ),
);

/** Atajos de conveniencia — pueden llamarse desde cualquier lugar */
export const toast = {
  info: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().push({ severity: 'info', title, description, duration }),
  warning: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().push({ severity: 'warning', title, description, duration }),
  error: (title: string, description?: string, duration?: number) =>
    useToastStore.getState().push({ severity: 'error', title, description, duration }),
};
