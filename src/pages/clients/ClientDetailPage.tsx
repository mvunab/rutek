import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  Sparkles,
  Target,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '../../components/ui/Button';
import { Badge, OrderStatusBadge } from '../../components/ui/Badge';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { ConfirmModal } from '../../components/ui/Modal';
import { clientCrmService } from '../../services/clientCrm.service';
import type {
  ClientActivity,
  ClientActivityKind,
  ClientCrmOverview,
  OpportunityStatus,
} from '../../types/clientCrm';
import {
  CLIENT_ACTIVITY_KIND_LABELS,
  OPPORTUNITY_STATUS_LABELS,
} from '../../types/clientCrm';

type TimelineFilter = 'all' | 'crm' | 'orders' | 'opportunities';

type TimelineItem =
  | { type: 'activity'; id: string; at: string; activity: ClientActivity }
  | {
      type: 'order';
      id: string;
      at: string;
      code: string;
      status: string;
      destinationCity: string;
      bultos: number;
    };

const KIND_ICONS: Record<ClientActivityKind, typeof MessageSquare> = {
  note: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: User,
  opportunity: Target,
  task: Target,
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return format(d, "d MMM yyyy · HH:mm", { locale: es });
}

function formatDateOnly(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return format(d, 'd MMM yyyy', { locale: es });
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2 text-stone-500 dark:text-stone-400">
        {icon}
        <p className="text-xs">{label}</p>
      </div>
      <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 tabular-nums">{value}</p>
    </div>
  );
}

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<ClientCrmOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClientActivity | null>(null);

  const [formKind, setFormKind] = useState<ClientActivityKind>('note');
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formStatus, setFormStatus] = useState<OpportunityStatus>('open');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await clientCrmService.getOverview(id);
      setOverview(data);
    } catch {
      setError('No se pudo cargar la ficha del cliente.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const timeline = useMemo((): TimelineItem[] => {
    if (!overview) return [];
    const activityItems: TimelineItem[] = overview.activities.map((a) => ({
      type: 'activity',
      id: a.id,
      at: a.occurredAt,
      activity: a,
    }));
    const orderItems: TimelineItem[] = overview.recentOrders.map((o) => ({
      type: 'order',
      id: o.id,
      at: o.createdAt,
      code: o.code,
      status: o.status,
      destinationCity: o.destinationCity,
      bultos: o.bultos,
    }));
    return [...activityItems, ...orderItems].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [overview]);

  const filteredTimeline = useMemo(() => {
    if (filter === 'all') return timeline;
    if (filter === 'orders') return timeline.filter((t) => t.type === 'order');
    if (filter === 'opportunities') {
      return timeline.filter((t) => t.type === 'activity' && t.activity.kind === 'opportunity');
    }
    return timeline.filter((t) => t.type === 'activity');
  }, [timeline, filter]);

  const resetForm = () => {
    setFormTitle('');
    setFormBody('');
    setFormAmount('');
    setFormDueDate('');
    setFormStatus('open');
    setFormKind('note');
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formTitle.trim()) return;
    setSaving(true);
    try {
      await clientCrmService.createActivity(id, {
        kind: formKind,
        title: formTitle.trim(),
        body: formBody.trim() || undefined,
        status: formKind === 'opportunity' ? formStatus : undefined,
        amount: formKind === 'opportunity' && formAmount
          ? Math.max(0, parseInt(formAmount, 10) || 0)
          : undefined,
        dueDate: formKind === 'opportunity' && formDueDate ? formDueDate : undefined,
      });
      resetForm();
      await load();
    } catch {
      setError('No se pudo registrar la actividad.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (!id || !deleteTarget) return;
    try {
      await clientCrmService.deleteActivity(id, deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch {
      setError('No se pudo eliminar la actividad.');
    }
  };

  const handleOpportunityStatus = async (activity: ClientActivity, status: OpportunityStatus) => {
    if (!id) return;
    try {
      await clientCrmService.updateActivity(id, activity.id, { status });
      await load();
    } catch {
      setError('No se pudo actualizar la oportunidad.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-sm text-stone-500 dark:text-stone-400">
        Cargando ficha de cliente…
      </div>
    );
  }

  if (!overview || error) {
    return (
      <div className="space-y-4 max-w-lg mx-auto text-center py-16">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {error || 'Cliente no encontrado'}
        </p>
        <Button variant="secondary" onClick={() => navigate('/clientes')}>
          Volver a clientes
        </Button>
      </div>
    );
  }

  const { client, stats } = overview;
  const phoneDigits = client.phone.replace(/\D/g, '');

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-start gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/clientes')}
          icon={<ArrowLeft size={16} aria-hidden />}
        >
          Clientes
        </Button>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div
              aria-hidden
              className="size-14 rounded-2xl bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xl shrink-0"
            >
              {client.companyName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 truncate">
                  {client.companyName}
                </h1>
                <Badge variant={client.active ? 'success' : 'slate'}>
                  {client.active ? <CheckCircle size={10} aria-hidden /> : <XCircle size={10} aria-hidden />}
                  {client.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {client.contactName} · RUT {client.rut}
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 flex items-center gap-1.5">
                <MapPin size={12} aria-hidden />
                {client.address}, {client.city}, {client.region}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {phoneDigits ? (
              <a href={`tel:${client.phone}`}>
                <Button variant="secondary" size="sm" icon={<Phone size={16} aria-hidden />}>
                  Llamar
                </Button>
              </a>
            ) : null}
            <a href={`mailto:${client.email}`}>
              <Button variant="secondary" size="sm" icon={<Mail size={16} aria-hidden />}>
                Email
              </Button>
            </a>
            <Button
              variant="primary"
              size="sm"
              icon={<Sparkles size={16} aria-hidden />}
              onClick={() => {
                setFormKind('opportunity');
                document.getElementById('crm-activity-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Nueva oportunidad
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-amber-600 dark:text-amber-400" role="alert">{error}</p>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Pedidos totales" value={stats.totalOrders} icon={<Package size={16} aria-hidden />} />
        <StatCard label="Pendientes" value={stats.pendingOrders} icon={<Calendar size={16} aria-hidden />} />
        <StatCard label="Entregados" value={stats.deliveredOrders} icon={<CheckCircle size={16} aria-hidden />} />
        <StatCard label="Oport. abiertas" value={stats.openOpportunities} icon={<Target size={16} aria-hidden />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Timeline */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
              Actividad del cliente
            </h2>
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar actividad">
              {([
                ['all', 'Todo'],
                ['crm', 'Interacciones'],
                ['opportunities', 'Oportunidades'],
                ['orders', 'Pedidos'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={filter === key}
                  onClick={() => setFilter(key)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                    filter === key
                      ? 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-950/45 dark:text-primary-300 dark:border-primary-800'
                      : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-transparent',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm divide-y divide-stone-100 dark:divide-stone-800">
            {filteredTimeline.length === 0 ? (
              <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-12 px-4">
                Sin actividad en este filtro. Registra una nota u oportunidad.
              </p>
            ) : (
              filteredTimeline.map((item) => {
                if (item.type === 'order') {
                  return (
                    <div key={`order-${item.id}`} className="flex gap-4 p-4">
                      <div className="size-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Package size={16} aria-hidden />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono font-semibold text-stone-800 dark:text-stone-100">{item.code}</span>
                          <OrderStatusBadge status={item.status} />
                          <span className="text-[10px] uppercase tracking-wide text-stone-400">Pedido</span>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          {item.destinationCity || 'Sin destino'} · {item.bultos} bulto{item.bultos === 1 ? '' : 's'}
                        </p>
                        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">{formatWhen(item.at)}</p>
                      </div>
                    </div>
                  );
                }

                const { activity } = item;
                const Icon = KIND_ICONS[activity.kind];
                const isOpportunity = activity.kind === 'opportunity';
                const oppStatus = activity.status ?? (activity.stage === 'won' ? 'won' : activity.stage === 'lost' ? 'lost' : 'open');

                return (
                  <div key={activity.id} className="flex gap-4 p-4 group">
                    <div className={clsx(
                      'size-9 rounded-lg flex items-center justify-center shrink-0',
                      isOpportunity
                        ? 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300',
                    )}>
                      <Icon size={16} aria-hidden />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-stone-800 dark:text-stone-100">
                          {activity.title}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-stone-400">
                          {CLIENT_ACTIVITY_KIND_LABELS[activity.kind]}
                        </span>
                        {isOpportunity && (
                          <Badge variant={oppStatus === 'won' ? 'success' : oppStatus === 'lost' ? 'slate' : 'warning'}>
                            {OPPORTUNITY_STATUS_LABELS[oppStatus as keyof typeof OPPORTUNITY_STATUS_LABELS] ?? 'Abierta'}
                          </Badge>
                        )}
                      </div>
                      {activity.body ? (
                        <p className="text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap">{activity.body}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-stone-400 dark:text-stone-500">
                        <span>{formatWhen(activity.occurredAt)}</span>
                        {activity.createdByName && <span>· {activity.createdByName}</span>}
                        {activity.amount != null && activity.amount > 0 && (
                          <span className="font-medium text-stone-600 dark:text-stone-300">
                            · ${activity.amount.toLocaleString('es-CL')} CLP
                          </span>
                        )}
                        {activity.dueDate && (
                          <span>· Cierre {formatDateOnly(activity.dueDate)}</span>
                        )}
                      </div>
                      {isOpportunity && oppStatus === 'open' && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Button
                            type="button"
                            size="xs"
                            variant="success"
                            onClick={() => void handleOpportunityStatus(activity, 'won')}
                          >
                            Marcar ganada
                          </Button>
                          <Button
                            type="button"
                            size="xs"
                            variant="ghost"
                            onClick={() => void handleOpportunityStatus(activity, 'lost')}
                          >
                            Marcar perdida
                          </Button>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity shrink-0"
                      onClick={() => setDeleteTarget(activity)}
                      icon={<Trash2 size={14} aria-hidden />}
                      aria-label="Eliminar actividad"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div
            id="crm-activity-form"
            className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-sm"
          >
            <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
              <Plus size={16} aria-hidden />
              Registrar actividad
            </h2>
            <form onSubmit={(e) => void handleCreateActivity(e)} className="space-y-3">
              <Select
                label="Tipo"
                value={formKind}
                onChange={(e) => setFormKind(e.target.value as ClientActivityKind)}
                options={(['note', 'call', 'email', 'meeting', 'opportunity'] as ClientActivityKind[]).map((v) => ({
                  value: v,
                  label: CLIENT_ACTIVITY_KIND_LABELS[v],
                }))}
              />
              <Input
                label="Título"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={formKind === 'opportunity' ? 'Ej. Contrato distribución Q3…' : 'Resumen breve…'}
                required
                autoComplete="off"
              />
              <Textarea
                label="Detalle"
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                placeholder="Notas de la conversación, próximos pasos…"
                rows={3}
              />
              {formKind === 'opportunity' && (
                <>
                  <Input
                    label="Monto estimado (CLP)"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0"
                    autoComplete="off"
                  />
                  <Input
                    label="Fecha estimada de cierre"
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                  />
                  <Select
                    label="Estado"
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as OpportunityStatus)}
                    options={Object.entries(OPPORTUNITY_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
                  />
                </>
              )}
              <Button type="submit" loading={saving} fullWidth>
                Guardar
              </Button>
            </form>
          </div>

          {client.notes && (
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/60 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2 flex items-center gap-1.5">
                <Building2 size={14} aria-hidden />
                Notas del cliente
              </h3>
              <p className="text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteActivity()}
        title="Eliminar actividad"
        message={`¿Eliminar "${deleteTarget?.title}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
