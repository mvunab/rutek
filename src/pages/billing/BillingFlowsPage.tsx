import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, GitBranch, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { api, ApiError } from '../../lib/api';
import { isValuationModuleEnabled } from '../../lib/valuationModule';
import { useClientStore } from '../../store/useClientStore';
import { useAuthStore } from '../../store/useAuthStore';
import {
  emptyStarterGraph,
  type BillingFlowGraph,
  type BillingFlowTemplate,
  type ClientChargeDocument,
} from '../../types/billingFlow';
import { mapCharge, mapTemplate } from './billingFlowsMappers';
import { BillingFlowsListView } from './BillingFlowsListView';
import { BillingFlowEditorView } from './BillingFlowEditorView';

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
  const [graph, setGraph] = useState<BillingFlowGraph>(() => emptyStarterGraph());
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
        <BillingFlowsListView
          templates={templates}
          charges={charges}
          clients={clients}
          chargeClientId={chargeClientId}
          periodFrom={periodFrom}
          periodTo={periodTo}
          saving={saving}
          onOpenTemplate={openTemplate}
          onDuplicate={(id) => void duplicate(id)}
          onChargeClientIdChange={setChargeClientId}
          onPeriodFromChange={setPeriodFrom}
          onPeriodToChange={setPeriodTo}
          onGenerateCharge={() => void generateCharge()}
          onReload={() => void load()}
        />
      ) : (
        <BillingFlowEditorView
          name={name}
          status={status}
          graph={graph}
          editing={editing}
          clients={clients}
          assignClientId={assignClientId}
          saving={saving}
          onNameChange={setName}
          onStatusChange={setStatus}
          onGraphChange={setGraph}
          onSave={() => void save()}
          onAssignClientIdChange={setAssignClientId}
          onAssignToClient={() => void assignToClient()}
        />
      )}
    </div>
  );
}
