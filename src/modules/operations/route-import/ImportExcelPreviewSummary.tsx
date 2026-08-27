import type { ImportExcelPreview } from './importExcelPreviewTypes';

export function ImportExcelPreviewSummary({ preview }: { preview: ImportExcelPreview }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[
        { label: 'Empresa', value: preview.transport_company || '—' },
        { label: 'Flete', value: preview.flete_type || '—' },
        { label: 'Total bultos', value: String(preview.total_bultos_declared) },
      ].map((item) => (
        <div key={item.label} className="rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2">
          <p className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            {item.label}
          </p>
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate" translate="no">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
