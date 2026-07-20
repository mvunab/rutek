export type BillingChargeUnit =
  | 'route'
  | 'order_delivered'
  | 'order_rejected'
  | 'bulto_delivered'
  | 'km'
  | 'fixed';

export type BillingConditionField =
  | 'always'
  | 'has_delivered'
  | 'has_rejected'
  | 'has_orders'
  | 'bultos_gt'
  | 'km_gt';

export type BillingFlowNodePosition = { x: number; y: number };

export type BillingFlowNode = {
  id: string;
  type: 'start' | 'end' | 'condition' | 'charge';
  position?: BillingFlowNodePosition;
  field?: BillingConditionField;
  op?: 'gt' | 'gte' | 'eq';
  value?: number;
  unit?: BillingChargeUnit;
  amount?: number;
  label?: string;
};

export type BillingFlowEdge = {
  id: string;
  from: string;
  to: string;
  when?: boolean | null;
};

export type BillingFlowGraph = {
  nodes: BillingFlowNode[];
  edges: BillingFlowEdge[];
};

export type BillingFlowTemplate = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  version: number;
  isSystemDefault: boolean;
  graph: BillingFlowGraph;
  status: 'draft' | 'published' | string;
  createdAt: string;
  updatedAt: string;
};

export type ClientBillingAssignment = {
  id: string;
  tenantId: string;
  clientId: string;
  clientName?: string | null;
  sourceTemplateId: string | null;
  sourceTemplateVersion: number | null;
  name: string | null;
  graph: BillingFlowGraph;
  createdAt: string;
  updatedAt: string;
  /** Rutas completed recalculadas tras mutar el grafo. */
  recomputedRoutes?: number;
};

export type ClientChargeDocument = {
  id: string;
  tenantId: string;
  clientId: string;
  clientName?: string | null;
  clientRut?: string | null;
  periodFrom: string;
  periodTo: string;
  routeIds: string[];
  status: 'draft' | 'confirmed' | 'exported' | string;
  currency: string;
  totalAmount: number;
  lines: Array<{
    side: string;
    label: string;
    amount: number;
    quantity?: number;
    unitAmount?: number;
    routeCode?: string;
  }>;
  confirmedAt?: string | null;
  exportedAt?: string | null;
  createdAt: string;
};

export const CHARGE_UNIT_LABELS: Record<BillingChargeUnit, string> = {
  route: 'Por ruta',
  order_delivered: 'Por pedido entregado',
  order_rejected: 'Por pedido rechazado',
  bulto_delivered: 'Por bulto entregado',
  km: 'Por km',
  fixed: 'Monto fijo',
};

export const CONDITION_FIELD_LABELS: Record<BillingConditionField, string> = {
  always: 'Siempre',
  has_delivered: 'Hay entregas',
  has_rejected: 'Hay rechazos',
  has_orders: 'Hay pedidos',
  bultos_gt: 'Bultos entregados >',
  km_gt: 'Km >',
};

export function emptyStarterGraph(): BillingFlowGraph {
  return {
    nodes: [
      { id: 'start', type: 'start', position: { x: 280, y: 40 } },
      {
        id: 'c-route',
        type: 'charge',
        unit: 'route',
        amount: 10000,
        label: 'Base por ruta',
        position: { x: 240, y: 180 },
      },
      { id: 'end', type: 'end', position: { x: 280, y: 360 } },
    ],
    edges: [
      { id: 'e1', from: 'start', to: 'c-route' },
      { id: 'e2', from: 'c-route', to: 'end' },
    ],
  };
}

export function normalizeGraph(raw: unknown): BillingFlowGraph {
  if (!raw || typeof raw !== 'object') return emptyStarterGraph();
  const g = raw as BillingFlowGraph;
  if (!Array.isArray(g.nodes) || !Array.isArray(g.edges)) return emptyStarterGraph();
  return {
    nodes: g.nodes.map((n) => ({ ...n })),
    edges: g.edges.map((e) => ({ ...e })),
  };
}
