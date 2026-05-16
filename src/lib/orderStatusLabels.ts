import type { Tenant } from '../types';

/** Etiquetas por defecto para slugs base (y legado). */
const BUILTIN: Record<string, string> = {
  pending: 'Pendiente',
  in_transit: 'En ruta',
  delivered: 'Entregado',
  rejected: 'Rechazada',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  returned: 'Devuelto',
};

export function resolveOrderStatusLabel(
  slug: string,
  tenant?: Tenant | null,
): string {
  const hit = tenant?.customOrderStatuses?.find((c) => c.slug === slug);
  if (hit?.label.trim()) return hit.label.trim();
  return BUILTIN[slug] ?? slug.replace(/_/g, ' ');
}
