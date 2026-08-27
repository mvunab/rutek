import { Building2, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Input';
import type { ClientActivityKind, OpportunityStatus } from '../../types/clientCrm';
import { CLIENT_ACTIVITY_KIND_LABELS, OPPORTUNITY_STATUS_LABELS } from '../../types/clientCrm';

export function ClientActivityForm({
  formKind,
  onFormKindChange,
  formTitle,
  onFormTitleChange,
  formBody,
  onFormBodyChange,
  formAmount,
  onFormAmountChange,
  formDueDate,
  onFormDueDateChange,
  formStatus,
  onFormStatusChange,
  saving,
  onSubmit,
  clientNotes,
}: {
  formKind: ClientActivityKind;
  onFormKindChange: (kind: ClientActivityKind) => void;
  formTitle: string;
  onFormTitleChange: (value: string) => void;
  formBody: string;
  onFormBodyChange: (value: string) => void;
  formAmount: string;
  onFormAmountChange: (value: string) => void;
  formDueDate: string;
  onFormDueDateChange: (value: string) => void;
  formStatus: OpportunityStatus;
  onFormStatusChange: (status: OpportunityStatus) => void;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  clientNotes?: string | null;
}) {
  return (
    <div className="space-y-4">
      <div
        id="crm-activity-form"
        className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 shadow-sm"
      >
        <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100 mb-4 flex items-center gap-2">
          <Plus size={16} aria-hidden />
          Registrar actividad
        </h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <Select
            label="Tipo"
            value={formKind}
            onChange={(e) => onFormKindChange(e.target.value as ClientActivityKind)}
            options={(['note', 'call', 'email', 'meeting', 'opportunity'] as ClientActivityKind[]).map((v) => ({
              value: v,
              label: CLIENT_ACTIVITY_KIND_LABELS[v],
            }))}
          />
          <Input
            label="Título"
            value={formTitle}
            onChange={(e) => onFormTitleChange(e.target.value)}
            placeholder={formKind === 'opportunity' ? 'Ej. Contrato distribución Q3…' : 'Resumen breve…'}
            required
            autoComplete="off"
          />
          <Textarea
            label="Detalle"
            value={formBody}
            onChange={(e) => onFormBodyChange(e.target.value)}
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
                onChange={(e) => onFormAmountChange(e.target.value)}
                placeholder="0"
                autoComplete="off"
              />
              <Input
                label="Fecha estimada de cierre"
                type="date"
                value={formDueDate}
                onChange={(e) => onFormDueDateChange(e.target.value)}
              />
              <Select
                label="Estado"
                value={formStatus}
                onChange={(e) => onFormStatusChange(e.target.value as OpportunityStatus)}
                options={Object.entries(OPPORTUNITY_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
              />
            </>
          )}
          <Button type="submit" loading={saving} fullWidth>
            Guardar
          </Button>
        </form>
      </div>

      {clientNotes && (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/60 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400 mb-2 flex items-center gap-1.5">
            <Building2 size={14} aria-hidden />
            Notas del cliente
          </h3>
          <p className="text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap">{clientNotes}</p>
        </div>
      )}
    </div>
  );
}
