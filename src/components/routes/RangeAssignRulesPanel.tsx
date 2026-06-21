import { Plus, ListChecks, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import {
  createEmptyRangeRule,
  type RangeAssignRule,
} from '../../lib/rangeAssignRules';

type PersonOption = { id: string; name: string };
type VehicleOption = { id: string; plate: string; brand: string; model: string };

export function RangeAssignRulesPanel({
  total,
  rules,
  onRulesChange,
  onApplyRules,
  drivers,
  vehicles,
  peonetas,
  showPeoneta = false,
  disabled = false,
  applyLabel = 'Aplicar reglas',
  tone = 'default',
}: {
  total: number;
  rules: RangeAssignRule[];
  onRulesChange: (rules: RangeAssignRule[]) => void;
  onApplyRules: () => void;
  drivers: PersonOption[];
  vehicles: VehicleOption[];
  peonetas?: PersonOption[];
  showPeoneta?: boolean;
  disabled?: boolean;
  applyLabel?: string;
  tone?: 'default' | 'violet';
}) {
  const shell =
    tone === 'violet'
      ? 'border-violet-200/80 dark:border-violet-800/60 bg-violet-50/30 dark:bg-violet-950/20'
      : 'border-stone-200 dark:border-stone-700 bg-white/70 dark:bg-stone-900/40';

  const updateRule = (id: string, patch: Partial<RangeAssignRule>) => {
    onRulesChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  return (
    <div className={clsx('rounded-xl border overflow-hidden', shell)}>
      <div className="flex items-start justify-between gap-3 px-3 pt-2.5 pb-2 border-b border-stone-100 dark:border-stone-800">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-stone-700 dark:text-stone-200 uppercase tracking-wide leading-none">
            Asignación por rangos
          </p>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1 leading-snug">
            Ej: pedidos 1–10 → chofer A · 11–24 → chofer B. Si se solapan, gana la última regla.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          <button
            type="button"
            disabled={disabled || total === 0}
            title="Crear una regla que cubre todos los pedidos"
            onClick={() => {
              if (total === 0) return;
              onRulesChange([
                {
                  id: `all-${Date.now()}`,
                  from: '1',
                  to: String(total),
                  driverId: '',
                  vehicleId: '',
                  peonetaId: '',
                },
              ]);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
          >
            <ListChecks size={13} aria-hidden />
            Todos
          </button>
          <button
            type="button"
            disabled={disabled || total === 0}
            onClick={() => onRulesChange([...rules, createEmptyRangeRule(total)])}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
          >
            <Plus size={13} aria-hidden />
            Agregar
          </button>
        </div>
      </div>

      {rules.length === 0 ? (
        <div className="px-3 py-5 text-center">
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Sin reglas aún — pulsa{' '}
            <span className="font-medium text-stone-500 dark:text-stone-400">&ldquo;Agregar&rdquo;</span>{' '}
            o{' '}
            <span className="font-medium text-stone-500 dark:text-stone-400">&ldquo;Todos&rdquo;</span>{' '}
            para empezar.
          </p>
        </div>
      ) : (
        <div className="px-3 py-2 space-y-1.5">
          {rules.map((r, rIdx) => (
            <div
              key={r.id}
              className="flex items-end gap-2 bg-stone-50/80 dark:bg-stone-800/50 rounded-lg px-2 pt-2 pb-1.5"
            >
              <span className="shrink-0 mb-[18px] size-5 flex items-center justify-center rounded-full bg-stone-200 dark:bg-stone-700 text-[10px] font-bold text-stone-600 dark:text-stone-300 tabular-nums">
                {rIdx + 1}
              </span>
              <div className="w-[60px] shrink-0">
                <Input
                  label="Desde"
                  value={r.from}
                  onChange={(e) => updateRule(r.id, { from: e.target.value })}
                  name={`rule-from-${r.id}`}
                  autoComplete="off"
                  disabled={disabled}
                />
              </div>
              <span className="text-stone-400 dark:text-stone-500 text-sm mb-[18px]">–</span>
              <div className="w-[60px] shrink-0">
                <Input
                  label="Hasta"
                  value={r.to}
                  onChange={(e) => updateRule(r.id, { to: e.target.value })}
                  name={`rule-to-${r.id}`}
                  autoComplete="off"
                  disabled={disabled}
                />
              </div>
              <div className="flex-1 min-w-0">
                <Select
                  label="Chofer"
                  value={r.driverId}
                  onChange={(e) => updateRule(r.id, { driverId: e.target.value })}
                  options={[
                    { value: '', label: 'Sin chofer' },
                    ...drivers.map((d) => ({ value: d.id, label: d.name })),
                  ]}
                  autoComplete="off"
                  disabled={disabled}
                />
              </div>
              {showPeoneta ? (
                <div className="flex-1 min-w-0">
                  <Select
                    label="Peoneta"
                    value={r.peonetaId ?? ''}
                    onChange={(e) => updateRule(r.id, { peonetaId: e.target.value })}
                    options={[
                      { value: '', label: 'Sin peoneta' },
                      ...(peonetas ?? []).map((p) => ({ value: p.id, label: p.name })),
                    ]}
                    autoComplete="off"
                    disabled={disabled}
                  />
                </div>
              ) : null}
              <div className="flex-1 min-w-0">
                <Select
                  label="Vehículo"
                  value={r.vehicleId}
                  onChange={(e) => updateRule(r.id, { vehicleId: e.target.value })}
                  options={[
                    { value: '', label: 'Sin vehículo' },
                    ...vehicles.map((v) => ({
                      value: v.id,
                      label: `${v.plate} · ${v.brand} ${v.model}`,
                    })),
                  ]}
                  autoComplete="off"
                  disabled={disabled}
                />
              </div>
              <button
                type="button"
                className="shrink-0 mb-[18px] p-1.5 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors disabled:opacity-40"
                aria-label="Eliminar regla"
                disabled={disabled}
                onClick={() => onRulesChange(rules.filter((x) => x.id !== r.id))}
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      {rules.length > 0 ? (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-stone-100 dark:border-stone-800">
          <button
            type="button"
            className="text-xs text-stone-400 hover:text-red-600 dark:hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded transition-colors disabled:opacity-40"
            disabled={disabled}
            onClick={() => onRulesChange([])}
          >
            Limpiar todo
          </button>
          <Button
            type="button"
            size="sm"
            onClick={onApplyRules}
            disabled={disabled || total === 0 || rules.length === 0}
            loading={disabled}
          >
            {applyLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
