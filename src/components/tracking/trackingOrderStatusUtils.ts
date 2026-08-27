const MARKER_ACCENT: Record<string, string> = {
  pending: 'border-l-amber-500',
  in_transit: 'border-l-violet-500',
  delivered: 'border-l-emerald-500',
  rejected: 'border-l-red-500',
  confirmed: 'border-l-blue-500',
  cancelled: 'border-l-stone-400',
  returned: 'border-l-stone-500',
};

export function normalizeTrackingStatus(status: string): string {
  return status.trim().toLowerCase();
}

export function trackingOrderAccentClass(status: string): string {
  const slug = normalizeTrackingStatus(status);
  return MARKER_ACCENT[slug] ?? 'border-l-stone-300';
}

/** Resumen de conteos por estado para la vista de ruta. */
export function buildStatusCounts(
  orders: Array<{ status: string }>,
): Array<{ status: string; count: number }> {
  const map = new Map<string, number>();
  for (const order of orders) {
    const slug = normalizeTrackingStatus(order.status);
    map.set(slug, (map.get(slug) ?? 0) + 1);
  }
  const priority = ['in_transit', 'pending', 'confirmed', 'delivered', 'rejected', 'cancelled', 'returned'];
  const entries = [...map.entries()].map(([status, count]) => ({ status, count }));
  entries.sort((a, b) => {
    const ai = priority.indexOf(a.status);
    const bi = priority.indexOf(b.status);
    if (ai === -1 && bi === -1) return a.status.localeCompare(b.status, 'es');
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return entries;
}
