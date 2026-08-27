import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GitBranch, Save } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';
import { BillingFlowEditor } from './BillingFlowEditor';
import { api, ApiError } from '../../lib/api';
import { isValuationModuleEnabled } from '../../lib/valuationModule';
import { useAuthStore } from '../../store/useAuthStore';
import {
  emptyStarterGraph,
  normalizeGraph,
  type BillingFlowGraph,
  type BillingFlowTemplate,
  type ClientBillingAssignment,
} from '../../types/billingFlow';

function mapAssignment(raw: Record<string, unknown> | null): ClientBillingAssignment | null {
  if (!raw) return null;
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

function mapTemplate(raw: Record<string, unknown>): BillingFlowTemplate {
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

export function ClientBillingPanel({ clientId }: { clientId: string }) {
  const tenant = useAuthStore((s) => s.tenant);
  const valuationEnabled = isValuationModuleEnabled(tenant);
  const [assignment, setAssignment] = useState<ClientBillingAssignment | null>(null);
  const [templates, setTemplates] = useState<BillingFlowTemplate[]>([]);
  const [graph, setGraph] = useState<BillingFlowGraph>(() => emptyStarterGraph());
  const [templateId, setTemplateId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    if (!valuationEnabled) return;
    setLoading(true);
    try {
      const [aRaw, tRaw] = await Promise.all([
        api.get<Record<string, unknown> | null>(`/billing/clients/${clientId}/flow`),
        api.get<Record<string, unknown>[]>('/billing/flow-templates'),
      ]);
      const a = mapAssignment(aRaw);
      setAssignment(a);
      setGraph(a?.graph ?? emptyStarterGraph());
      setTemplates((tRaw ?? []).map(mapTemplate));
    } catch {
      setMsg('No se pudo cargar el flujo de cobro.');
    } finally {
      setLoading(false);
    }
  }, [clientId, valuationEnabled]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!valuationEnabled) return null;

  const assignFromTemplate = async () => {
    if (!templateId) return;
    setSaving(true);
    setMsg('');
    try {
      const raw = await api.post<Record<string, unknown>>(
        `/billing/clients/${clientId}/flow`,
        { template_id: templateId },
      );
      const a = mapAssignment(raw);
      setAssignment(a);
      if (a) setGraph(a.graph);
      const n = a?.recomputedRoutes ?? 0;
      setMsg(
        n > 0
          ? `Flujo asignado. ${n} ruta${n !== 1 ? 's' : ''} completed recalculada${n !== 1 ? 's' : ''}.`
          : 'Flujo asignado (clonado desde plantilla).',
      );
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Error al asignar');
    } finally {
      setSaving(false);
    }
  };

  const saveGraph = async () => {
    setSaving(true);
    setMsg('');
    try {
      let a: ClientBillingAssignment | null = null;
      if (assignment) {
        const raw = await api.patch<Record<string, unknown>>(
          `/billing/clients/${clientId}/flow`,
          { graph },
        );
        a = mapAssignment(raw);
        setAssignment(a);
      } else {
        const raw = await api.post<Record<string, unknown>>(
          `/billing/clients/${clientId}/flow`,
          { graph, name: 'Negociación cliente' },
        );
        a = mapAssignment(raw);
        setAssignment(a);
      }
      const n = a?.recomputedRoutes ?? 0;
      setMsg(
        n > 0
          ? `Flujo guardado. ${n} ruta${n !== 1 ? 's' : ''} completed recalculada${n !== 1 ? 's' : ''}.`
          : 'Flujo guardado.',
      );
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const saveAsTemplate = async () => {
    setSaving(true);
    try {
      await api.post(`/billing/clients/${clientId}/flow/as-template`, {});
      setMsg('Plantilla creada desde este cliente.');
      await load();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Error al crear plantilla');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-stone-500" aria-hidden />
          <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            Cobro / flujo asignado
          </h2>
        </div>
        <Link
          to="/valorizacion/flujos"
          className="text-xs text-primary-700 dark:text-primary-300 underline"
        >
          Biblioteca de plantillas
        </Link>
      </div>

      {loading ? (
        <p className="text-xs text-stone-500">Cargando…</p>
      ) : (
        <>
          <p className="text-xs text-stone-500">
            {assignment
              ? `Negociación activa${assignment.name ? `: ${assignment.name}` : ''}`
              : 'Sin flujo propio — se usa el perfil tenant como fallback.'}
          </p>

          <div className="flex flex-wrap items-end gap-2">
            <Select
              label="Asignar plantilla"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              options={[
                { value: '', label: 'Seleccionar…' },
                ...templates.map((t) => ({
                  value: t.id,
                  label: `${t.name} (v${t.version})`,
                })),
              ]}
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!templateId || saving}
              onClick={() => void assignFromTemplate()}
            >
              Clonar y asignar
            </Button>
          </div>

          <BillingFlowEditor initialGraph={graph} onChange={setGraph} />

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              icon={<Save size={14} />}
              disabled={saving}
              onClick={() => void saveGraph()}
            >
              Guardar flujo
            </Button>
            {assignment ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={saving}
                onClick={() => void saveAsTemplate()}
              >
                Usar como plantilla
              </Button>
            ) : null}
          </div>
          {msg ? <p className="text-xs text-stone-500">{msg}</p> : null}
        </>
      )}
    </section>
  );
}
