import { normalizeGraph } from '../../types/billingFlow';
import type { BillingFlowTemplate, ClientBillingAssignment } from '../../types/billingFlow';

export type DateRange = '7d' | '30d' | '90d' | 'all';
export type StatusFilter = 'all' | 'delivered' | 'rejected' | 'in_transit' | 'pending';

const routeDateFormatter = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function cutoffForRange(range: DateRange): string | undefined {
  if (range === 'all') return undefined;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function formatRouteDate(iso: string): string {
  if (!iso) return '—';
  try {
    return routeDateFormatter.format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function mapTemplate(raw: Record<string, unknown>): BillingFlowTemplate {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenant_id ?? ''),
    name: String(raw.name ?? ''),
    description: (raw.description as string | null) ?? null,
    version: Number(raw.version ?? 1),
    isSystemDefault: Boolean(raw.is_system_default),
    graph: normalizeGraph(raw.graph),
    status: String(raw.status ?? 'draft'),
    createdAt: String(raw.created_at ?? ''),
    updatedAt: String(raw.updated_at ?? ''),
  };
}

export function mapAssignment(raw: Record<string, unknown>): ClientBillingAssignment {
  return {
    id: String(raw.id),
    tenantId: String(raw.tenant_id ?? ''),
    clientId: String(raw.client_id ?? raw.clientId ?? ''),
    clientName: (raw.client_name as string) ?? null,
    sourceTemplateId: (raw.source_template_id as string) ?? null,
    sourceTemplateVersion: (raw.source_template_version as number) ?? null,
    name: (raw.name as string) ?? null,
    graph: normalizeGraph(raw.graph),
    createdAt: String(raw.created_at ?? ''),
    updatedAt: String(raw.updated_at ?? ''),
    recomputedRoutes: Number(raw.recomputed_routes ?? raw.recomputedRoutes ?? 0),
  };
}

export function billingSourceLabel(
  source: import('../../types/pricing').ValuationLedgerItem['billingSource'] | null | undefined,
): string {
  if (source === 'assignment') return 'Flujo del cliente';
  if (source === 'template') return 'Plantilla';
  return 'Perfil tenant';
}

export type RouteGroup = {
  routeId: string;
  routeCode: string;
  routeName: string;
  routeCreatedAt: string;
  billingClientId: string | null;
  billingClientName: string | null;
  billingSource: import('../../types/pricing').ValuationLedgerItem['billingSource'];
  flowName: string | null;
  routeClientCharge: number;
  orders: import('../../types/pricing').ValuationLedgerItem[];
  orderChargeSum: number;
  driverPay: number;
  peonetaPay: number;
  margin: number;
};

export function buildRouteGroups(items: import('../../types/pricing').ValuationLedgerItem[]): RouteGroup[] {
  const map = new Map<string, RouteGroup>();

  for (const row of items) {
    const key = row.routeId || row.orderId;
    let group = map.get(key);
    if (!group) {
      group = {
        routeId: row.routeId,
        routeCode: row.routeCode,
        routeName: row.routeName,
        routeCreatedAt: row.routeCreatedAt,
        billingClientId: row.billingClientId,
        billingClientName: row.billingClientName,
        billingSource: row.billingSource,
        flowName: row.flowName,
        routeClientCharge: row.routeClientCharge,
        orders: [],
        orderChargeSum: 0,
        driverPay: 0,
        peonetaPay: 0,
        margin: 0,
      };
      map.set(key, group);
    }
    group.orders.push(row);
    group.orderChargeSum += row.clientCharge;
    group.driverPay += row.driverPay;
    group.peonetaPay += row.peonetaPay;
    group.margin += row.margin;
  }

  return [...map.values()];
}
