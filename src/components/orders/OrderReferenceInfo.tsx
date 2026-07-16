import { FileText } from 'lucide-react';
import { clsx } from 'clsx';
import type { OrderReferenceFields } from '../../lib/orderReferenceFields';

function RefCell({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {label}
      </p>
      <p translate="no" className="text-xs font-medium text-stone-800 dark:text-stone-100 truncate tabular-nums">
        {value}
      </p>
    </div>
  );
}

export function OrderReferenceInfo({
  fields,
  className,
}: {
  fields: OrderReferenceFields;
  className?: string;
}) {
  const hasAny = fields.numeroOc || fields.factura || fields.referencia;
  if (!hasAny) return null;

  return (
    <div
      className={clsx(
        'rounded-lg border border-stone-200/80 bg-stone-50/60 dark:border-stone-700/60 dark:bg-stone-900/40 px-2.5 py-2',
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400 flex items-center gap-1 mb-1.5">
        <FileText size={12} aria-hidden />
        Referencias
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3 gap-y-1.5 min-w-0">
        <RefCell label="N° OC" value={fields.numeroOc} />
        <RefCell label="Factura" value={fields.factura} />
        <RefCell label="Referencia" value={fields.referencia} />
      </div>
    </div>
  );
}
