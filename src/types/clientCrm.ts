import type { Client, OrderStatus } from '../types';

export type ClientActivityKind =
  | 'note'
  | 'call'
  | 'email'
  | 'meeting'
  | 'opportunity'
  | 'task';

/** Pipeline stages — reemplaza open/won/lost */
export type OpportunityStage =
  | 'new'
  | 'qualification'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

/** Legado — mantener para compatibilidad */
export type OpportunityStatus = 'open' | 'won' | 'lost';

export interface ProductLine {
  name: string;
  qty: number;
  unitPrice: number;
}

export interface ClientActivity {
  id: string;
  clientId: string;
  kind: ClientActivityKind;
  title: string;
  body?: string;
  /** Legado */
  status?: OpportunityStatus | null;
  /** Pipeline stage para oportunidades */
  stage?: OpportunityStage | null;
  /** Probabilidad de cierre 0–100 */
  probability?: number | null;
  amount?: number | null;
  dueDate?: string | null;
  products?: ProductLine[] | null;
  completed: boolean;
  completedAt?: string | null;
  occurredAt: string;
  createdById?: string | null;
  createdByName?: string | null;
  createdAt: string;
}

export interface ClientCrmStats {
  totalOrders: number;
  pendingOrders: number;
  inTransitOrders: number;
  deliveredOrders: number;
  rejectedOrders: number;
  openOpportunities: number;
  lastOrderAt?: string | null;
}

export interface PipelineStage {
  stage: OpportunityStage;
  count: number;
  amount: number;
}

export interface ClientCrmOrder {
  id: string;
  code: string;
  status: OrderStatus;
  createdAt: string;
  estimatedDelivery: string;
  destinationCity: string;
  bultos: number;
}

export interface ClientCrmOverview {
  client: Client;
  stats: ClientCrmStats;
  pipeline: PipelineStage[];
  pendingTasksCount: number;
  recentOrders: ClientCrmOrder[];
  activities: ClientActivity[];
}

export interface CreateClientActivityInput {
  kind: ClientActivityKind;
  title: string;
  body?: string;
  status?: OpportunityStatus;
  stage?: OpportunityStage;
  probability?: number;
  amount?: number;
  dueDate?: string;
  products?: ProductLine[];
  completed?: boolean;
  occurredAt?: string;
}

export interface UpdateClientActivityInput {
  kind?: ClientActivityKind;
  title?: string;
  body?: string;
  status?: OpportunityStatus | null;
  stage?: OpportunityStage | null;
  probability?: number | null;
  amount?: number | null;
  dueDate?: string | null;
  products?: ProductLine[] | null;
  completed?: boolean;
  occurredAt?: string;
}

export const CLIENT_ACTIVITY_KIND_LABELS: Record<ClientActivityKind, string> = {
  note: 'Nota',
  call: 'Llamada',
  email: 'Email',
  meeting: 'Reunión',
  opportunity: 'Oportunidad',
  task: 'Tarea',
};

/** Legado */
export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  open: 'Abierta',
  won: 'Ganada',
  lost: 'Perdida',
};
