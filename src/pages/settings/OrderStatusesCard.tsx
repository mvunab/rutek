import { Check, Plus, Tags, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

type OrderStatusRow = { slug: string; label: string };

type OrderStatusesCardProps = {
  statuses: OrderStatusRow[];
  onChange: (statuses: OrderStatusRow[]) => void;
  error: string;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
};

export function OrderStatusesCard({
  statuses,
  onChange,
  error,
  saving,
  saved,
  onSave,
}: OrderStatusesCardProps) {
  return (
    <Card padding="lg">
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
          <Tags size={20} aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Estados de pedido personalizados
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            El tenant siempre tiene Pendiente, En ruta, Entregado y Rechazada. Acá definís etiquetas extra (slug en minúscula, sin espacios).
          </p>
        </div>
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400 mb-3" role="alert">
          {error}
        </p>
      ) : null}
      <div className="space-y-3 mb-4">
        {statuses.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">Sin estados adicionales.</p>
        ) : null}
        {statuses.map((row, i) => (
          <div key={row.slug || row.label} className="flex flex-wrap gap-2 items-end">
            <Input
              label="Slug (interno)"
              spellCheck={false}
              autoComplete="off"
              value={row.slug}
              onChange={(e) => {
                const next = [...statuses];
                next[i] = { ...next[i], slug: e.target.value };
                onChange(next);
              }}
              containerClassName="flex-1 min-w-[140px]"
            />
            <Input
              label="Etiqueta visible"
              value={row.label}
              onChange={(e) => {
                const next = [...statuses];
                next[i] = { ...next[i], label: e.target.value };
                onChange(next);
              }}
              containerClassName="flex-1 min-w-[160px]"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(statuses.filter((_, j) => j !== i))}
              aria-label={`Quitar fila ${i + 1}`}
            >
              <Trash2 size={16} aria-hidden />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<Plus size={14} aria-hidden />}
          onClick={() => onChange([...statuses, { slug: '', label: '' }])}
          disabled={statuses.length >= 30}
        >
          Añadir estado
        </Button>
        <Button type="button" loading={saving} onClick={onSave}>
          Guardar catálogo
        </Button>
        {saved ? (
          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Check size={14} aria-hidden /> Guardado
          </span>
        ) : null}
      </div>
    </Card>
  );
}
