import { Link } from 'react-router-dom';
import { Save } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { BillingFlowEditor } from '../../components/billing/BillingFlowEditor';
import type { BillingFlowGraph, BillingFlowTemplate } from '../../types/billingFlow';
import type { Client } from '../../types';

export function BillingFlowEditorView({
  name,
  status,
  graph,
  editing,
  clients,
  assignClientId,
  saving,
  onNameChange,
  onStatusChange,
  onGraphChange,
  onSave,
  onAssignClientIdChange,
  onAssignToClient,
}: {
  name: string;
  status: string;
  graph: BillingFlowGraph;
  editing: BillingFlowTemplate | null;
  clients: Client[];
  assignClientId: string;
  saving: boolean;
  onNameChange: (name: string) => void;
  onStatusChange: (status: string) => void;
  onGraphChange: (graph: BillingFlowGraph) => void;
  onSave: () => void;
  onAssignClientIdChange: (id: string) => void;
  onAssignToClient: () => void;
}) {
  return (
    <div className="space-y-3 -mx-1">
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3 flex flex-wrap items-end gap-3 shadow-sm">
        <Input
          label="Nombre del flujo"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          containerClassName="flex-1 min-w-[180px]"
        />
        <Select
          label="Estado"
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
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
            onClick={onSave}
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

      <BillingFlowEditor initialGraph={graph} onChange={onGraphChange} />

      {editing ? (
        <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 flex flex-wrap items-end gap-3">
          <Select
            label="Aplicar a cliente (clona la plantilla)"
            value={assignClientId}
            onChange={(e) => onAssignClientIdChange(e.target.value)}
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
            onClick={onAssignToClient}
          >
            Asignar
          </Button>
        </div>
      ) : null}
    </div>
  );
}
