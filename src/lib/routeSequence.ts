import type { Route } from '../types';

/** N° consecutivo de hoja de ruta (guía interna del operador). */
export function resolveRouteSequence(route: Pick<Route, 'guiaInterna' | 'code'>): number | null {
  if (route.guiaInterna != null && route.guiaInterna > 0) return route.guiaInterna;
  const imp = route.code.match(/^IMP-(\d+)/i);
  if (imp) {
    const n = Number.parseInt(imp[1]!, 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export function formatRouteSequence(route: Pick<Route, 'guiaInterna' | 'code'>): string {
  const n = resolveRouteSequence(route);
  return n != null ? String(n) : '—';
}

/** Etiqueta principal de la ruta en UI (consecutivo del operador, no folio interno). */
export function formatRouteDisplayLabel(route: Pick<Route, 'guiaInterna' | 'code' | 'name'>): string {
  const n = resolveRouteSequence(route);
  if (n != null) return String(n);
  return route.name?.trim() || '—';
}

export function formatRouteDisplayTitle(route: Pick<Route, 'guiaInterna' | 'code' | 'name'>): string {
  const n = resolveRouteSequence(route);
  const name = route.name?.trim();
  if (n != null && name) return `N° ${n} · ${name}`;
  if (n != null) return `N° ${n}`;
  return name || route.code;
}

/** Siguiente consecutivo sugerido (tenant o filtrado por cuenta mandante). */
export function suggestNextRouteSequence(
  routes: Pick<Route, 'guiaInterna' | 'code' | 'clientId'>[],
  clientId?: string | null,
): number {
  const pool =
    clientId?.trim()
      ? routes.filter((r) => !r.clientId || r.clientId === clientId)
      : routes;
  let max = 0;
  for (const route of pool) {
    const n = resolveRouteSequence(route);
    if (n != null && n > max) max = n;
  }
  return max + 1;
}

/** Etiqueta visible del pedido dentro de una ruta (p. ej. 1245-3). */
export function formatOrderInRouteLabel(
  route: Pick<Route, 'guiaInterna' | 'code'>,
  orderIndex: number,
): string {
  const routeNum = resolveRouteSequence(route);
  const seq = orderIndex + 1;
  if (routeNum != null) return `${routeNum}-${seq}`;
  return `#${seq}`;
}

export function parseRouteSequenceInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(n) || n < 1) return null;
  return n;
}
