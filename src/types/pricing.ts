export type PricingCurrency = 'CLP';

export interface PricingClientRules {
  basePerRoute: number;
  perDeliveredOrder: number;
  perBultoDelivered: number;
  perRejectedOrder: number;
  perKm: number;
}

export interface PricingDriverRules {
  fixedPerRoute: number;
  perDeliveredOrder: number;
  percentOfClientCharge: number;
}

export interface PricingPeonetaRules {
  fixedPerRoute: number;
  perDeliveredOrder: number;
}

export interface PricingWorkerRules {
  driver: PricingDriverRules;
  peoneta: PricingPeonetaRules;
}

export interface PricingProfile {
  enabled: boolean;
  version: number;
  currency: PricingCurrency;
  client: PricingClientRules;
  worker: PricingWorkerRules;
}

export interface ValuationLine {
  side: 'client' | 'worker';
  role?: 'driver' | 'peoneta';
  label: string;
  quantity?: number;
  unitAmount?: number;
  amount: number;
}

export interface RouteValuation {
  id: string | null;
  routeId: string;
  profileVersion: number;
  clientCharge: number;
  workerPayTotal: number;
  driverPay: number;
  peonetaPay: number;
  margin: number;
  breakdown: ValuationLine[];
  preview: boolean;
  enabled?: boolean;
  stats?: {
    orderCount: number;
    deliveredCount: number;
    rejectedCount: number;
    bultosDelivered: number;
    km: number;
    driverCount: number;
    peonetaCount: number;
  };
  computedAt?: string;
}

export interface ValuationLedgerItem {
  orderId: string;
  orderCode: string;
  orderStatus: string;
  bultos: number;
  clientId: string;
  clientName: string;
  routeId: string;
  routeCode: string;
  routeName: string;
  routeCreatedAt: string;
  driverId: string | null;
  driverName: string | null;
  peonetaId: string | null;
  peonetaName: string | null;
  clientCharge: number;
  driverPay: number;
  peonetaPay: number;
  workerPayTotal: number;
  margin: number;
}

export interface ValuationLedgerSummary {
  orderCount: number;
  clientCharge: number;
  driverPay: number;
  peonetaPay: number;
  workerPayTotal: number;
  margin: number;
}

export interface ValuationLedger {
  enabled: boolean;
  profileVersion: number;
  currency: PricingCurrency;
  items: ValuationLedgerItem[];
  summary: ValuationLedgerSummary;
}
