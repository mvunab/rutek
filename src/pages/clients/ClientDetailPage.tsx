import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, CheckCircle, Package, Target } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/Modal';
import { clientCrmService } from '../../services/clientCrm.service';
import type {
  ClientActivity,
  ClientActivityKind,
  ClientCrmOverview,
  OpportunityStatus,
} from '../../types/clientCrm';
import { ClientBillingPanel } from '../../components/billing/ClientBillingPanel';
import { ClientActivityForm } from './ClientActivityForm';
import {
  ClientActivityTimeline,
  type TimelineFilter,
  type TimelineItem,
} from './ClientActivityTimeline';
import { ClientDetailHeader } from './ClientDetailHeader';
import { StatCard } from './ClientDetailStatCard';

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

  return (
    <div className="space-y-6 pb-8">
      <ClientDetailHeader
        client={client}
        onBack={() => navigate('/clientes')}
        onNewOpportunity={() => {
          setFormKind('opportunity');
          document.getElementById('crm-activity-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />

      {error ? (
        <p className="text-sm text-amber-600 dark:text-amber-400" role="alert">{error}</p>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Pedidos totales" value={stats.totalOrders} icon={<Package size={16} aria-hidden />} />
        <StatCard label="Pendientes" value={stats.pendingOrders} icon={<Calendar size={16} aria-hidden />} />
        <StatCard label="Entregados" value={stats.deliveredOrders} icon={<CheckCircle size={16} aria-hidden />} />
        <StatCard label="Oport. abiertas" value={stats.openOpportunities} icon={<Target size={16} aria-hidden />} />
      </div>

      {id ? <ClientBillingPanel clientId={id} /> : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <ClientActivityTimeline
          filter={filter}
          onFilterChange={setFilter}
          filteredTimeline={filteredTimeline}
          onDeleteActivity={setDeleteTarget}
          onOpportunityStatus={handleOpportunityStatus}
        />

        <ClientActivityForm
          formKind={formKind}
          onFormKindChange={setFormKind}
          formTitle={formTitle}
          onFormTitleChange={setFormTitle}
          formBody={formBody}
          onFormBodyChange={setFormBody}
          formAmount={formAmount}
          onFormAmountChange={setFormAmount}
          formDueDate={formDueDate}
          onFormDueDateChange={setFormDueDate}
          formStatus={formStatus}
          onFormStatusChange={setFormStatus}
          saving={saving}
          onSubmit={(e) => void handleCreateActivity(e)}
          clientNotes={client.notes}
        />
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
