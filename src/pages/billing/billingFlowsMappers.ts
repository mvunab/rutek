import { getApiUrl } from '../../lib/api';
import {
  normalizeGraph,
  type BillingFlowTemplate,
  type ClientChargeDocument,
} from '../../types/billingFlow';

export function mapTemplate(raw: Record<string, unknown>): BillingFlowTemplate {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenant_id ?? raw.tenantId ?? ''),
    name: String(raw.name ?? ''),
    description: (raw.description as string | null) ?? null,
    version: Number(raw.version ?? 1),
    isSystemDefault: Boolean(raw.is_system_default ?? raw.isSystemDefault),
    graph: normalizeGraph(raw.graph),
    status: String(raw.status ?? 'draft'),
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
    updatedAt: String(raw.updated_at ?? raw.updatedAt ?? ''),
  };
}

export function mapCharge(raw: Record<string, unknown>): ClientChargeDocument {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenant_id ?? ''),
    clientId: String(raw.client_id ?? raw.clientId ?? ''),
    clientName: (raw.client_name as string) ?? null,
    clientRut: (raw.client_rut as string) ?? null,
    periodFrom: String(raw.period_from ?? raw.periodFrom ?? ''),
    periodTo: String(raw.period_to ?? raw.periodTo ?? ''),
    routeIds: Array.isArray(raw.route_ids) ? (raw.route_ids as string[]) : [],
    status: String(raw.status ?? 'draft'),
    currency: String(raw.currency ?? 'CLP'),
    totalAmount: Number(raw.total_amount ?? raw.totalAmount ?? 0),
    lines: Array.isArray(raw.lines) ? (raw.lines as ClientChargeDocument['lines']) : [],
    confirmedAt: (raw.confirmed_at as string) ?? null,
    exportedAt: (raw.exported_at as string) ?? null,
    createdAt: String(raw.created_at ?? raw.createdAt ?? ''),
  };
}

export async function downloadCharge(id: string, format: 'xlsx' | 'pdf') {
  const res = await fetch(
    `${getApiUrl()}/billing/charges/${id}/export?format=${format}`,
    { credentials: 'include' },
  );
  if (!res.ok) throw new Error('No se pudo exportar');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cobro.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
  a.click();
  URL.revokeObjectURL(url);
}
