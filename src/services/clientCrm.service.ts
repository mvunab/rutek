import { api } from '../lib/api';
import type { Client } from '../types';
import type { DbClient } from '../types/api';
import type {
  ClientActivity,
  ClientCrmOverview,
  ClientCrmOrder,
  ClientCrmStats,
  PipelineStage,
  ProductLine,
  CreateClientActivityInput,
  UpdateClientActivityInput,
} from '../types/clientCrm';

function toClient(r: DbClient): Client {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    companyName: r.company_name,
    contactName: r.contact_name,
    email: r.email,
    phone: r.phone,
    rut: r.rut,
    address: r.address,
    city: r.city,
    region: r.region,
    active: r.active,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
  };
}

function mapActivity(raw: Record<string, unknown>): ClientActivity {
  const products = Array.isArray(raw.products)
    ? (raw.products as ProductLine[])
    : null;

  return {
    id: String(raw.id),
    clientId: String(raw.client_id),
    kind: raw.kind as ClientActivity['kind'],
    title: String(raw.title ?? ''),
    body: raw.body != null ? String(raw.body) : undefined,
    status: (raw.status as ClientActivity['status']) ?? null,
    stage: (raw.stage as ClientActivity['stage']) ?? null,
    probability: raw.probability != null ? Number(raw.probability) : null,
    amount: raw.amount != null ? Number(raw.amount) : null,
    dueDate: raw.due_date != null ? String(raw.due_date) : null,
    products,
    completed: Boolean(raw.completed ?? false),
    completedAt: raw.completed_at != null ? String(raw.completed_at) : null,
    occurredAt: String(raw.occurred_at ?? raw.created_at),
    createdById: raw.created_by_id != null ? String(raw.created_by_id) : null,
    createdByName: raw.created_by_name != null ? String(raw.created_by_name) : null,
    createdAt: String(raw.created_at),
  };
}

function mapOrder(raw: Record<string, unknown>): ClientCrmOrder {
  const est = raw.estimated_delivery;
  return {
    id: String(raw.id),
    code: String(raw.code ?? ''),
    status: raw.status as ClientCrmOrder['status'],
    createdAt: String(raw.created_at ?? ''),
    estimatedDelivery:
      typeof est === 'string' ? est.split('T')[0] ?? est : String(est ?? ''),
    destinationCity: String(raw.destination_city ?? ''),
    bultos: Number(raw.bultos ?? 0),
  };
}

function mapPipeline(raw: Record<string, unknown>): PipelineStage {
  return {
    stage: raw.stage as PipelineStage['stage'],
    count: Number(raw.count ?? 0),
    amount: Number(raw.amount ?? 0),
  };
}

function mapOverview(data: Record<string, unknown>): ClientCrmOverview {
  const statsRaw = (data.stats ?? {}) as Record<string, unknown>;
  const stats: ClientCrmStats = {
    totalOrders: Number(statsRaw.total_orders ?? 0),
    pendingOrders: Number(statsRaw.pending_orders ?? 0),
    inTransitOrders: Number(statsRaw.in_transit_orders ?? 0),
    deliveredOrders: Number(statsRaw.delivered_orders ?? 0),
    rejectedOrders: Number(statsRaw.rejected_orders ?? 0),
    openOpportunities: Number(statsRaw.open_opportunities ?? 0),
    lastOrderAt:
      statsRaw.last_order_at != null ? String(statsRaw.last_order_at) : null,
  };

  return {
    client: toClient(data.client as DbClient),
    stats,
    pipeline: Array.isArray(data.pipeline)
      ? (data.pipeline as Record<string, unknown>[]).map(mapPipeline)
      : [],
    pendingTasksCount: Number(data.pending_tasks_count ?? 0),
    recentOrders: Array.isArray(data.recent_orders)
      ? (data.recent_orders as Record<string, unknown>[]).map(mapOrder)
      : [],
    activities: Array.isArray(data.activities)
      ? (data.activities as Record<string, unknown>[]).map(mapActivity)
      : [],
  };
}

export const clientCrmService = {
  async getOverview(clientId: string): Promise<ClientCrmOverview> {
    const data = await api.get<Record<string, unknown>>(`/clients/${clientId}/crm`);
    return mapOverview(data);
  },

  async createActivity(
    clientId: string,
    input: CreateClientActivityInput,
  ): Promise<ClientActivity> {
    const data = await api.post<Record<string, unknown>>(
      `/clients/${clientId}/activities`,
      {
        kind: input.kind,
        title: input.title,
        body: input.body,
        status: input.status,
        stage: input.stage,
        probability: input.probability,
        amount: input.amount,
        due_date: input.dueDate,
        products: input.products,
        completed: input.completed,
        occurred_at: input.occurredAt,
      },
    );
    return mapActivity(data);
  },

  async updateActivity(
    clientId: string,
    activityId: string,
    input: UpdateClientActivityInput,
  ): Promise<ClientActivity> {
    const data = await api.patch<Record<string, unknown>>(
      `/clients/${clientId}/activities/${activityId}`,
      {
        kind: input.kind,
        title: input.title,
        body: input.body,
        status: input.status,
        stage: input.stage,
        probability: input.probability,
        amount: input.amount,
        due_date: input.dueDate,
        products: input.products,
        completed: input.completed,
        occurred_at: input.occurredAt,
      },
    );
    return mapActivity(data);
  },

  async deleteActivity(clientId: string, activityId: string): Promise<void> {
    await api.del(`/clients/${clientId}/activities/${activityId}`);
  },
};
