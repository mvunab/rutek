import { useCallback, useEffect, useState } from 'react';

export const PANEL_WIDTH_KEY = 'rutek-route-panel-width';
export const PANEL_MIN = 300;
export const PANEL_DEFAULT = 440;

/** Cantidad de pedidos que se pintan por tanda en el detalle de ruta. */
export const ORDERS_PAGE_SIZE = 80;

export function getPanelMaxPx(): number {
  if (typeof window === 'undefined') return 760;
  return Math.min(820, Math.max(520, Math.floor(window.innerWidth * 0.58)));
}

export function clampPanelWidth(w: number): number {
  return Math.min(getPanelMaxPx(), Math.max(PANEL_MIN, w));
}

export function usePanelWidth() {
  const [width, setWidth] = useState<number>(() => {
    const stored = localStorage.getItem(PANEL_WIDTH_KEY);
    const n = stored ? parseInt(stored, 10) : NaN;
    return isNaN(n) ? PANEL_DEFAULT : clampPanelWidth(n);
  });

  const commit = useCallback((w: number) => {
    const clamped = clampPanelWidth(w);
    setWidth(clamped);
    localStorage.setItem(PANEL_WIDTH_KEY, String(clamped));
  }, []);

  useEffect(() => {
    const onResize = () => setWidth((w) => clampPanelWidth(w));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return { width, commit };
}
