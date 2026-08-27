import {
  Handle,
  Position,
  type NodeProps,
} from '@xyflow/react';
import { Banknote, CircleDot, Flag } from 'lucide-react';
import { clsx } from 'clsx';
import {
  CHARGE_UNIT_LABELS,
  CONDITION_FIELD_LABELS,
  type BillingChargeUnit,
  type BillingConditionField,
  type BillingFlowNode,
} from '../../types/billingFlow';
import { formatCLP } from '../../lib/pricingProfile';

export type FlowNodeData = {
  kind: BillingFlowNode['type'];
  label?: string;
  unit?: BillingChargeUnit;
  amount?: number;
  field?: BillingConditionField;
  value?: number;
};

const handleCls =
  '!size-2.5 !bg-white !border-2 !border-stone-400 dark:!border-stone-500';

export function StartNode({ selected }: NodeProps) {
  return (
    <div
      className={clsx(
        'relative flex flex-col items-center',
        selected && 'ring-2 ring-emerald-400 ring-offset-2 rounded-full',
      )}
    >
      <div className="size-14 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center border-4 border-emerald-100 dark:border-emerald-900">
        <CircleDot size={22} aria-hidden />
      </div>
      <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        Inicio
      </p>
      <Handle type="source" position={Position.Bottom} className={handleCls} />
    </div>
  );
}

export function EndNode({ selected }: NodeProps) {
  return (
    <div
      className={clsx(
        'relative flex flex-col items-center',
        selected && 'ring-2 ring-stone-400 ring-offset-2 rounded-full',
      )}
    >
      <Handle type="target" position={Position.Top} className={handleCls} />
      <div className="size-14 rounded-full bg-stone-700 text-white shadow-lg flex items-center justify-center border-4 border-stone-200 dark:border-stone-600">
        <Flag size={20} aria-hidden />
      </div>
      <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-stone-600 dark:text-stone-300">
        Fin
      </p>
    </div>
  );
}

export function ChargeNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData;
  return (
    <div
      className={clsx(
        'w-[220px] rounded-lg border bg-white dark:bg-stone-900 shadow-md overflow-hidden',
        selected
          ? 'border-sky-500 ring-2 ring-sky-300/60'
          : 'border-stone-200 dark:border-stone-700',
      )}
    >
      <Handle type="target" position={Position.Top} className={handleCls} />
      <div className="flex items-center gap-2 bg-sky-600 px-3 py-1.5 text-white">
        <Banknote size={14} aria-hidden />
        <span className="text-[11px] font-bold uppercase tracking-wide">Cargo</span>
      </div>
      <div className="px-3 py-2.5 space-y-1">
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
          {d.label || 'Cargo'}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          {CHARGE_UNIT_LABELS[d.unit ?? 'fixed']}
        </p>
        <p className="text-sm font-bold tabular-nums text-sky-700 dark:text-sky-300">
          {formatCLP(d.amount ?? 0)}
        </p>
      </div>
      <Handle type="source" position={Position.Bottom} className={handleCls} />
    </div>
  );
}

/** Decisión estilo diamante (Salesforce Decision). */
export function ConditionNode({ data, selected }: NodeProps) {
  const d = data as FlowNodeData;
  const subtitle =
    d.field === 'bultos_gt' || d.field === 'km_gt'
      ? `${CONDITION_FIELD_LABELS[d.field ?? 'always']} ${d.value ?? 0}`
      : CONDITION_FIELD_LABELS[d.field ?? 'always'];

  return (
    <div className="relative w-[200px] h-[140px] flex items-center justify-center">
      <Handle type="target" position={Position.Top} className={handleCls} style={{ zIndex: 2 }} />
      <div
        className={clsx(
          'absolute inset-x-6 inset-y-3 rotate-45 rounded-md border-2 bg-amber-50 dark:bg-amber-950/50 shadow-md',
          selected
            ? 'border-amber-500 ring-2 ring-amber-300/50'
            : 'border-amber-400 dark:border-amber-600',
        )}
      />
      <div className="relative z-[1] text-center px-4 max-w-[140px]">
        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
          Decisión
        </p>
        <p className="text-xs font-semibold text-stone-800 dark:text-stone-100 leading-snug mt-0.5">
          {subtitle}
        </p>
      </div>
      <Handle
        type="source"
        id="true"
        position={Position.Right}
        className={handleCls}
        style={{ zIndex: 2, top: '50%' }}
      />
      <Handle
        type="source"
        id="false"
        position={Position.Bottom}
        className={handleCls}
        style={{ zIndex: 2 }}
      />
      <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 text-[9px] font-bold text-emerald-600">
        Sí
      </span>
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 text-[9px] font-bold text-red-500">
        No
      </span>
    </div>
  );
}
