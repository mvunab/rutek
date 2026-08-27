import type {
  PricingProfile,
  RouteValuation,
  ValuationLedger,
  ValuationLedgerItem,
  ValuationLine,
} from '../types/pricing';

export const DEFAULT_PRICING_PROFILE: PricingProfile = {
  enabled: false,
  version: 1,
  currency: 'CLP',
  client: {
    basePerRoute: 0,
    perDeliveredOrder: 0,
    perBultoDelivered: 0,
    perRejectedOrder: 0,
    perKm: 0,
  },
  worker: {
    driver: {
      fixedPerRoute: 0,
      perDeliveredOrder: 0,
      percentOfClientCharge: 0,
    },
    peoneta: {
      fixedPerRoute: 0,
      perDeliveredOrder: 0,
    },
  },
};

function num(raw: unknown, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}

function rulesBlock<T extends Record<string, number>>(
  raw: unknown,
  defaults: T,
): T {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    out[key] = num(src[key as string], defaults[key]) as T[keyof T];
  }
  return out;
}

export function normalizePricingProfile(raw: unknown): PricingProfile {
  if (!raw || typeof raw !== 'object') return structuredClone(DEFAULT_PRICING_PROFILE);
  const o = raw as Record<string, unknown>;
  const workerRaw =
    o.worker && typeof o.worker === 'object'
      ? (o.worker as Record<string, unknown>)
      : {};

  return {
    enabled: Boolean(o.enabled),
    version: Math.max(1, Math.floor(num(o.version, 1))),
    currency: 'CLP',
    client: rulesBlock(o.client, { ...DEFAULT_PRICING_PROFILE.client }),
    worker: {
      driver: rulesBlock(workerRaw.driver, { ...DEFAULT_PRICING_PROFILE.worker.driver }),
      peoneta: rulesBlock(workerRaw.peoneta, { ...DEFAULT_PRICING_PROFILE.worker.peoneta }),
    },
  };
}

function mapLine(raw: unknown): ValuationLine | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const side = o.side === 'worker' ? 'worker' : 'client';
  return {
    side,
    role: o.role === 'driver' || o.role === 'peoneta' ? o.role : undefined,
    label: String(o.label ?? ''),
    quantity: o.quantity != null ? num(o.quantity) : undefined,
    unitAmount: o.unit_amount != null ? num(o.unit_amount) : undefined,
    amount: num(o.amount),
  };
}

export function normalizeRouteValuation(raw: Record<string, unknown>): RouteValuation {
  const breakdownRaw = Array.isArray(raw.breakdown) ? raw.breakdown : [];
  const enabled =
    raw.enabled != null
      ? Boolean(raw.enabled)
      : num(raw.client_charge) > 0 || breakdownRaw.length > 0;
  return {
    id: raw.id != null ? String(raw.id) : null,
    routeId: String(raw.route_id ?? ''),
    profileVersion: num(raw.profile_version, 1),
    clientCharge: num(raw.client_charge),
    workerPayTotal: num(raw.worker_pay_total),
    driverPay: num(raw.driver_pay),
    peonetaPay: num(raw.peoneta_pay),
    margin: num(raw.margin),
    breakdown: breakdownRaw
      .map(mapLine)
      .filter((line): line is ValuationLine => line !== null && Boolean(line.label)),
    preview: Boolean(raw.preview),
    enabled,
    stats:
      raw.stats && typeof raw.stats === 'object'
        ? {
            orderCount: num((raw.stats as Record<string, unknown>).order_count),
            deliveredCount: num((raw.stats as Record<string, unknown>).delivered_count),
            rejectedCount: num((raw.stats as Record<string, unknown>).rejected_count),
            bultosDelivered: num((raw.stats as Record<string, unknown>).bultos_delivered),
            km: num((raw.stats as Record<string, unknown>).km),
            driverCount: num((raw.stats as Record<string, unknown>).driver_count),
            peonetaCount: num((raw.stats as Record<string, unknown>).peoneta_count),
          }
        : undefined,
    computedAt: raw.computed_at != null ? String(raw.computed_at) : undefined,
  };
}

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export function formatCLP(amount: number): string {
  return clp.format(Math.round(amount));
}

function numLedger(raw: unknown, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizeValuationLedger(raw: Record<string, unknown>): ValuationLedger {
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  const summaryRaw =
    raw.summary && typeof raw.summary === 'object'
      ? (raw.summary as Record<string, unknown>)
      : {};

  const items: ValuationLedger['items'] = [];
  for (const row of itemsRaw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const item = {
      orderId: String(r.order_id ?? r.orderId ?? ''),
      orderCode: String(r.order_code ?? r.orderCode ?? ''),
      orderStatus: String(r.order_status ?? r.orderStatus ?? ''),
      bultos: numLedger(r.bultos),
      clientId: String(r.client_id ?? r.clientId ?? ''),
      clientName: String(r.client_name ?? r.clientName ?? ''),
      billingClientId:
        r.billing_client_id != null
          ? String(r.billing_client_id)
          : r.billingClientId != null
            ? String(r.billingClientId)
            : null,
      billingClientName:
        r.billing_client_name != null
          ? String(r.billing_client_name)
          : r.billingClientName != null
            ? String(r.billingClientName)
            : null,
      billingSource: ((): ValuationLedgerItem['billingSource'] => {
        const s = String(r.billing_source ?? r.billingSource ?? 'pricing_profile');
        if (s === 'assignment' || s === 'template' || s === 'pricing_profile') return s;
        return 'pricing_profile';
      })(),
      flowName:
        r.flow_name != null
          ? String(r.flow_name)
          : r.flowName != null
            ? String(r.flowName)
            : null,
      routeClientCharge: numLedger(r.route_client_charge ?? r.routeClientCharge),
      routeId: String(r.route_id ?? r.routeId ?? ''),
      routeCode: String(r.route_code ?? r.routeCode ?? ''),
      routeName: String(r.route_name ?? r.routeName ?? ''),
      routeCreatedAt: String(r.route_created_at ?? r.routeCreatedAt ?? ''),
      driverId:
        r.driver_id != null
          ? String(r.driver_id)
          : r.driverId != null
            ? String(r.driverId)
            : null,
      driverName:
        r.driver_name != null
          ? String(r.driver_name)
          : r.driverName != null
            ? String(r.driverName)
            : null,
      peonetaId:
        r.peoneta_id != null
          ? String(r.peoneta_id)
          : r.peonetaId != null
            ? String(r.peonetaId)
            : null,
      peonetaName:
        r.peoneta_name != null
          ? String(r.peoneta_name)
          : r.peonetaName != null
            ? String(r.peonetaName)
            : null,
      clientCharge: numLedger(r.client_charge ?? r.clientCharge),
      driverPay: numLedger(r.driver_pay ?? r.driverPay),
      peonetaPay: numLedger(r.peoneta_pay ?? r.peonetaPay),
      workerPayTotal: numLedger(r.worker_pay_total ?? r.workerPayTotal),
      margin: numLedger(r.margin),
    };
    if (item.orderId) items.push(item);
  }

  return {
    enabled: Boolean(raw.enabled),
    profileVersion: numLedger(raw.profile_version ?? raw.profileVersion, 1),
    currency: 'CLP',
    items,
    summary: {
      orderCount: numLedger(
        summaryRaw.order_count ?? summaryRaw.orderCount ?? items.length,
      ),
      clientCharge: numLedger(summaryRaw.client_charge ?? summaryRaw.clientCharge),
      driverPay: numLedger(summaryRaw.driver_pay ?? summaryRaw.driverPay),
      peonetaPay: numLedger(summaryRaw.peoneta_pay ?? summaryRaw.peonetaPay),
      workerPayTotal: numLedger(
        summaryRaw.worker_pay_total ?? summaryRaw.workerPayTotal,
      ),
      margin: numLedger(summaryRaw.margin),
    },
  };
}
