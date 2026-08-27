import { clsx } from 'clsx';
import { Select } from '../../../components/ui/Input';
import type { useRouteImportStore } from '../../../store/useRouteImportStore';
import type { ExcelFormatConfig } from '../../../types';

type FormatEval = ReturnType<typeof useRouteImportStore.getState>['formatEval'];

export function ImportExcelFormatPicker({
  formatId,
  formatAutoPicked,
  excelFormats,
  formatEval,
  formatSelectOptions,
  previewLoading,
  confirmLoading,
  evaluateLoading,
  onFormatChange,
}: {
  formatId: string;
  formatAutoPicked: boolean;
  excelFormats: ExcelFormatConfig[];
  formatEval: FormatEval;
  formatSelectOptions: { value: string; label: string }[];
  previewLoading: boolean;
  confirmLoading: boolean;
  evaluateLoading: boolean;
  onFormatChange: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Select
        label="Plantilla de importación"
        value={formatId}
        onChange={(e) => void onFormatChange(e.target.value)}
        disabled={previewLoading || confirmLoading || evaluateLoading}
        options={formatSelectOptions}
        hint={
          excelFormats.length > 0
            ? formatAutoPicked
              ? 'Detectada automáticamente (≥80% confianza). Puedes cambiarla si hace falta.'
              : formatEval?.needs_manual_choice
                ? 'Revisa el ranking y elige la plantilla correcta.'
                : 'Elige la plantilla según el formato del Excel.'
            : 'No hay plantillas configuradas. Se usará la detección automática del archivo.'
        }
      />

      {formatEval && formatEval.rankings.length > 0 ? (
        <div
          className={clsx(
            'rounded-xl border px-3 py-2.5 space-y-2',
            formatEval.needs_manual_choice
              ? 'border-amber-200 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/30'
              : 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30',
          )}
          role="status"
        >
          <p
            className={clsx(
              'text-[11px] leading-snug',
              formatEval.needs_manual_choice
                ? 'text-amber-900 dark:text-amber-200'
                : 'text-emerald-900 dark:text-emerald-200',
            )}
          >
            {formatEval.reason}
          </p>
          <ul className="space-y-1">
            {formatEval.rankings.slice(0, 4).map((r, idx) => {
              const active = formatId === r.format_id;
              const pct = Math.round(r.confidence * 100);
              return (
                <li key={r.format_id}>
                  <button
                    type="button"
                    disabled={previewLoading || confirmLoading || evaluateLoading}
                    onClick={() => void onFormatChange(r.format_id)}
                    className={clsx(
                      'w-full flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left cursor-pointer transition-colors duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
                      active
                        ? 'border-primary-400 bg-primary-50 dark:border-primary-600 dark:bg-primary-950/40'
                        : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-950 dark:hover:bg-stone-800',
                    )}
                  >
                    <span className="text-[10px] font-semibold tabular-nums text-stone-400 w-4 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-stone-800 dark:text-stone-100">
                      {r.format_name}
                    </span>
                    <span
                      className={clsx(
                        'shrink-0 tabular-nums text-[11px] font-semibold rounded-md px-1.5 py-0.5',
                        pct >= 80
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                          : pct >= 50
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                            : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
                      )}
                    >
                      {pct}%
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
