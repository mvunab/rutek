import type { ObservabilityTenant } from '../../types/observability';

export function tenantHealthTone(
  status: ObservabilityTenant['healthStatus'],
): 'ok' | 'warning' | 'critical' | 'neutral' {
  if (status === 'high_load') return 'critical';
  if (status === 'moderate') return 'warning';
  if (status === 'healthy') return 'ok';
  return 'neutral';
}

export function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `hace ${days}d`;
    const hours = Math.floor(diff / 3600000);
    if (hours > 0) return `hace ${hours}h`;
    const mins = Math.floor(diff / 60000);
    return mins > 0 ? `hace ${mins}m` : 'ahora';
  } catch {
    return iso.slice(0, 10);
  }
}
