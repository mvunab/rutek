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

  const items = itemsRaw
    .filter((row): row is Record<string, unknown> => Boolean(row && typeof row === 'object'))
    .map((row) => ({
      orderId: String(row.order_id ?? row.orderId ?? ''),
      orderCode: String(row.order_code ?? row.orderCode ?? ''),
      orderStatus: String(row.order_status ?? row.orderStatus ?? ''),
      bultos: numLedger(row.bultos),
      clientId: String(row.client_id ?? row.clientId ?? ''),
      clientName: String(row.client_name ?? row.clientName ?? ''),
      billingClientId:
        row.billing_client_id != null
          ? String(row.billing_client_id)
          : row.billingClientId != null
            ? String(row.billingClientId)
            : null,
      billingClientName:
        row.billing_client_name != null
          ? String(row.billing_client_name)
          : row.billingClientName != null
            ? String(row.billingClientName)
            : null,
      billingSource: ((): ValuationLedgerItem['billingSource'] => {
        const s = String(row.billing_source ?? row.billingSource ?? 'pricing_profile');
        if (s === 'assignment' || s === 'template' || s === 'pricing_profile') return s;
        return 'pricing_profile';
      })(),
      flowName:
        row.flow_name != null
          ? String(row.flow_name)
          : row.flowName != null
            ? String(row.flowName)
            : null,
      routeClientCharge: numLedger(row.route_client_charge ?? row.routeClientCharge),
      routeId: String(row.route_id ?? row.routeId ?? ''),
      routeCode: String(row.route_code ?? row.routeCode ?? ''),
      routeName: String(row.route_name ?? row.routeName ?? ''),
      routeCreatedAt: String(row.route_created_at ?? row.routeCreatedAt ?? ''),
      driverId:
        row.driver_id != null
          ? String(row.driver_id)
          : row.driverId != null
            ? String(row.driverId)
            : null,
      driverName:
        row.driver_name != null
          ? String(row.driver_name)
          : row.driverName != null
            ? String(row.driverName)
            : null,
      peonetaId:
        row.peoneta_id != null
          ? String(row.peoneta_id)
          : row.peonetaId != null
            ? String(row.peonetaId)
            : null,
      peonetaName:
        row.peoneta_name != null
          ? String(row.peoneta_name)
          : row.peonetaName != null
            ? String(row.peonetaName)
            : null,
      clientCharge: numLedger(row.client_charge ?? row.clientCharge),
      driverPay: numLedger(row.driver_pay ?? row.driverPay),
      peonetaPay: numLedger(row.peoneta_pay ?? row.peonetaPay),
      workerPayTotal: numLedger(row.worker_pay_total ?? row.workerPayTotal),
      margin: numLedger(row.margin),
    }))
    .filter((row) => Boolean(row.orderId));

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
