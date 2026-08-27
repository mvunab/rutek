import { Banknote, CircleDot, Flag, GitBranch, Trash2, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { Node } from '@xyflow/react';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import {
  CHARGE_UNIT_LABELS,
  CONDITION_FIELD_LABELS,
  type BillingChargeUnit,
  type BillingConditionField,
} from '../../types/billingFlow';
import type { FlowNodeData } from './BillingFlowNodes';

export function BillingFlowPropertiesPanel({
  selected,
  readOnly,
  onClose,
  onUpdateSelected,
  onRemoveSelected,
}: {
  selected: Node | null;
  readOnly: boolean;
  onClose: () => void;
  onUpdateSelected: (patch: Partial<FlowNodeData>) => void;
  onRemoveSelected: () => void;
}) {
  return (
    <aside className="w-full lg:w-72 shrink-0 border-t lg:border-t-0 lg:border-l border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-stone-200 dark:border-stone-800">
        <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
          Propiedades
        </p>
        {selected ? (
          <button
            type="button"
            className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
            aria-label="Cerrar propiedades"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!selected ? (
          <div className="rounded-lg border border-dashed border-stone-200 dark:border-stone-700 p-4 text-center">
            <GitBranch size={22} className="mx-auto text-stone-300 mb-2" aria-hidden />
            <p className="text-xs text-stone-500 leading-relaxed">
              Selecciona un elemento en el canvas para editarlo. Usa el toolbox para
              agregar Decisiones y Cargos.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  'size-8 rounded-md flex items-center justify-center',
                  selected.type === 'charge' && 'bg-sky-50 text-sky-600',
                  selected.type === 'condition' && 'bg-amber-50 text-amber-600',
                  selected.type === 'start' && 'bg-emerald-50 text-emerald-600',
                  selected.type === 'end' && 'bg-stone-100 text-stone-600',
                )}
              >
                {selected.type === 'charge' ? (
                  <Banknote size={16} />
                ) : selected.type === 'condition' ? (
                  <GitBranch size={16} />
                ) : selected.type === 'start' ? (
                  <CircleDot size={16} />
                ) : (
                  <Flag size={16} />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {selected.type === 'charge'
                    ? 'Cargo'
                    : selected.type === 'condition'
                      ? 'Decisión'
                      : selected.type === 'start'
                        ? 'Inicio'
                        : 'Fin'}
                </p>
                <p className="text-[10px] text-stone-400 font-mono">{selected.id}</p>
              </div>
            </div>

            {selected.type === 'charge' ? (
              <>
                <Input
                  label="Etiqueta"
                  value={(selected.data as FlowNodeData).label ?? ''}
                  onChange={(e) => onUpdateSelected({ label: e.target.value })}
                  disabled={readOnly}
                />
                <Select
                  label="Unidad de cobro"
                  value={(selected.data as FlowNodeData).unit ?? 'fixed'}
                  onChange={(e) =>
                    onUpdateSelected({ unit: e.target.value as BillingChargeUnit })
                  }
                  disabled={readOnly}
                  options={Object.entries(CHARGE_UNIT_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
                <Input
                  label="Monto (CLP)"
                  type="number"
                  value={String((selected.data as FlowNodeData).amount ?? 0)}
                  onChange={(e) =>
                    onUpdateSelected({ amount: Number(e.target.value) || 0 })
                  }
                  disabled={readOnly}
                />
              </>
            ) : null}

            {selected.type === 'condition' ? (
              <>
                <Select
                  label="Condición"
                  value={(selected.data as FlowNodeData).field ?? 'always'}
                  onChange={(e) =>
                    onUpdateSelected({
                      field: e.target.value as BillingConditionField,
                    })
                  }
                  disabled={readOnly}
                  options={Object.entries(CONDITION_FIELD_LABELS).map(
                    ([value, label]) => ({ value, label }),
                  )}
                />
                <Input
                  label="Valor umbral"
                  type="number"
                  value={String((selected.data as FlowNodeData).value ?? 0)}
                  onChange={(e) =>
                    onUpdateSelected({ value: Number(e.target.value) || 0 })
                  }
                  disabled={readOnly}
                  hint="Usado en bultos_gt / km_gt"
                />
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Conecta la salida <strong>Sí</strong> (derecha) y <strong>No</strong>{' '}
                  (abajo) a los siguientes elementos.
                </p>
              </>
            ) : null}

            {(selected.type === 'start' || selected.type === 'end') && (
              <p className="text-xs text-stone-500">
                Elemento fijo del flujo. No se puede eliminar.
              </p>
            )}

            {(selected.type === 'charge' || selected.type === 'condition') &&
            !readOnly ? (
              <Button
                type="button"
                size="sm"
                variant="danger"
                icon={<Trash2 size={14} />}
                onClick={onRemoveSelected}
                fullWidth
              >
                Eliminar elemento
              </Button>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}
