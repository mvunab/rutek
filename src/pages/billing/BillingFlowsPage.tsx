import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, GitBranch, Plus, Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { BillingFlowEditor } from '../../components/billing/BillingFlowEditor';
import { api, ApiError, getAccessToken, getApiUrl } from '../../lib/api';
import { isValuationModuleEnabled } from '../../lib/valuationModule';
import { formatCLP } from '../../lib/pricingProfile';
import { useClientStore } from '../../store/useClientStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  emptyStarterGraph,
  normalizeGraph,
  type BillingFlowGraph,
  type BillingFlowTemplate,
  type ClientChargeDocument,
} from '../../types/billingFlow';

function mapTemplate(raw: Record<string, unknown>): BillingFlowTemplate {
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

function mapCharge(raw: Record<string, unknown>): ClientChargeDocument {
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

async function downloadCharge(id: string, format: 'xlsx' | 'pdf') {
  const token = getAccessToken();
  const res = await fetch(
    `${getApiUrl()}/billing/charges/${id}/export?format=${format}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
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

export function BillingFlowsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { templateId } = useParams<{ templateId?: string }>();
  const tenant = useAuthStore((s) => s.tenant);
  const valuationEnabled = isValuationModuleEnabled(tenant);
  const { clients, fetchClients } = useClientStore();

  const [templates, setTemplates] = useState<BillingFlowTemplate[]>([]);
  const [charges, setCharges] = useState<ClientChargeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<BillingFlowTemplate | null>(null);
  const [graph, setGraph] = useState<BillingFlowGraph>(emptyStarterGraph());
  const [name, setName] = useState('Nueva plantilla');
  const [status, setStatus] = useState('draft');

  const [assignClientId, setAssignClientId] = useState('');
  const [chargeClientId, setChargeClientId] = useState('');
  const [periodFrom, setPeriodFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [periodTo, setPeriodTo] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    if (!valuationEnabled) return;
    setLoading(true);
    setError('');
    try {
      const [tplRaw, chargeRaw] = await Promise.all([
        api.get<Record<string, unknown>[]>('/billing/flow-templates'),
        api.get<Record<string, unknown>[]>('/billing/charges'),
      ]);
      setTemplates((tplRaw ?? []).map(mapTemplate));
      setCharges((chargeRaw ?? []).map(mapCharge));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar flujos');
    } finally {
      setLoading(false);
    }
  }, [valuationEnabled]);

  useEffect(() => {
    void fetchClients();
    void load();
  }, [fetchClients, load]);

  useEffect(() => {
    if (!templateId || templates.length === 0) return;
    const found = templates.find((t) => t.id === templateId);
    if (found) {
      setEditing(found);
      setGraph(found.graph);
      setName(found.name);
      setStatus(found.status);
    }
  }, [templateId, templates]);

  const startNew = () => {
    setEditing(null);
    setGraph(emptyStarterGraph());
    setName('Nueva plantilla');
    setStatus('draft');
    navigate('/valorizacion/flujos/nuevo');
  };

  const openTemplate = (t: BillingFlowTemplate) => {
    setEditing(t);
    setGraph(t.graph);
    setName(t.name);
    setStatus(t.status);
    navigate(`/valorizacion/flujos/${t.id}`);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const raw = await api.patch<Record<string, unknown>>(
          `/billing/flow-templates/${editing.id}`,
          { name, status, graph },
        );
        const mapped = mapTemplate(raw);
        setEditing(mapped);
        setTemplates((list) => list.map((t) => (t.id === mapped.id ? mapped : t)));
      } else {
        const raw = await api.post<Record<string, unknown>>('/billing/flow-templates', {
          name,
          status,
          graph,
        });
        const mapped = mapTemplate(raw);
        setEditing(mapped);
        setTemplates((list) => [mapped, ...list]);
        navigate(`/valorizacion/flujos/${mapped.id}`);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async (id: string) => {
    const raw = await api.post<Record<string, unknown>>(
      `/billing/flow-templates/${id}/duplicate`,
      {},
    );
    const mapped = mapTemplate(raw);
    setTemplates((list) => [mapped, ...list]);
    openTemplate(mapped);
  };

  const assignToClient = async () => {
    if (!editing || !assignClientId) return;
    setSaving(true);
    setError('');
    try {
      const raw = await api.post<Record<string, unknown>>(
        `/billing/clients/${assignClientId}/flow`,
        { template_id: editing.id },
      );
      const n = Number(raw.recomputed_routes ?? raw.recomputedRoutes ?? 0);
      setError(
        n > 0
          ? `Plantilla asignada. ${n} ruta${n !== 1 ? 's' : ''} completed recalculada${n !== 1 ? 's' : ''}.`
          : 'Plantilla asignada al cliente.',
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo asignar');
    } finally {
      setSaving(false);
    }
  };

  const generateCharge = async () => {
    if (!chargeClientId) return;
    setSaving(true);
    setError('');
    try {
      const raw = await api.post<Record<string, unknown>>('/billing/charges', {
        client_id: chargeClientId,
        period_from: new Date(`${periodFrom}T00:00:00`).toISOString(),
        period_to: new Date(`${periodTo}T23:59:59`).toISOString(),
      });
      const mapped = mapCharge(raw);
      setCharges((list) => [mapped, ...list]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo generar cobro');
    } finally {
      setSaving(false);
    }
  };

  if (!valuationEnabled) {
    return (
      <EmptyState
        icon={<GitBranch size={32} />}
        title="Flujos de cobro"
        description="Activa el módulo de valorización para diseñar flujos."
      />
    );
  }

  if (loading && templates.length === 0) {
    return <p className="text-sm text-stone-500 py-8 text-center">Cargando flujos…</p>;
  }

  const inEditor =
    Boolean(templateId) || location.pathname.endsWith('/flujos/nuevo');

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            icon={<ArrowLeft size={14} />}
            onClick={() => navigate('/valorizacion')}
          >
            Valorización
          </Button>
          <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            Flujos de cobro
          </h2>
        </div>
        <Button type="button" size="sm" icon={<Plus size={14} />} onClick={startNew}>
          Nueva plantilla
        </Button>
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      {!inEditor ? (
        <>
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 dark:bg-stone-950 text-left text-xs text-stone-500">
                <tr>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Versión</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-t border-stone-100 dark:border-stone-800">
                    <td className="px-3 py-2 font-medium">{t.name}</td>
                    <td className="px-3 py-2">{t.status}</td>
                    <td className="px-3 py-2 tabular-nums">v{t.version}</td>
                    <td className="px-3 py-2 text-right space-x-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => openTemplate(t)}>
                        Editar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        icon={<Copy size={14} />}
                        onClick={() => void duplicate(t.id)}
                      >
                        Duplicar
                      </Button>
                    </td>
                  </tr>
                ))}
                {templates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-stone-500">
                      Aún no hay plantillas. Crea una para negociar cobros por cliente.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold">Generar cobro</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Select
                label="Cliente"
                value={chargeClientId}
                onChange={(e) => setChargeClientId(e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar…' },
                  ...clients.map((c) => ({ value: c.id, label: c.companyName })),
                ]}
              />
              <Input
                label="Desde"
                type="date"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
              />
              <Input
                label="Hasta"
                type="date"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
              />
              <div className="flex items-end">
                <Button type="button" onClick={() => void generateCharge()} disabled={saving || !chargeClientId}>
                  Generar
                </Button>
              </div>
            </div>

            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {charges.slice(0, 10).map((c) => (
                <li key={c.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium">{c.clientName ?? c.clientId}</p>
                    <p className="text-xs text-stone-500">
                      {c.status} · {formatCLP(c.totalAmount)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {c.status === 'draft' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          void api.post(`/billing/charges/${c.id}/confirm`, {}).then(() => load())
                        }
                      >
                        Confirmar
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void downloadCharge(c.id, 'xlsx')}
                    >
                      Excel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void downloadCharge(c.id, 'pdf')}
                    >
                      PDF
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="space-y-3 -mx-1">
          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3 flex flex-wrap items-end gap-3 shadow-sm">
            <Input
              label="Nombre del flujo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              containerClassName="flex-1 min-w-[180px]"
            />
            <Select
              label="Estado"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'draft', label: 'Borrador' },
                { value: 'published', label: 'Activo (publicado)' },
              ]}
              containerClassName="w-44"
            />
            <div className="flex items-end gap-2 pb-0.5">
              <Button
                type="button"
                icon={<Save size={14} />}
                onClick={() => void save()}
                disabled={saving}
              >
                Guardar
              </Button>
              <Link
                to="/valorizacion/flujos"
                className="text-sm text-stone-500 hover:text-stone-800 underline self-center px-1"
              >
                Volver
              </Link>
            </div>
          </div>

          <BillingFlowEditor initialGraph={graph} onChange={setGraph} />

          {editing ? (
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 flex flex-wrap items-end gap-3">
              <Select
                label="Aplicar a cliente (clona la plantilla)"
                value={assignClientId}
                onChange={(e) => setAssignClientId(e.target.value)}
                options={[
                  { value: '', label: 'Seleccionar…' },
                  ...clients.map((c) => ({ value: c.id, label: c.companyName })),
                ]}
                containerClassName="flex-1 min-w-[200px]"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!assignClientId || saving}
                onClick={() => void assignToClient()}
              >
                Asignar
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
