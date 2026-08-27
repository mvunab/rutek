import { AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

export function ImportExcelErrorAlerts({
  previewError,
  confirmError,
  duplicateSequenceError,
}: {
  previewError: string | null;
  confirmError: string | null;
  duplicateSequenceError: boolean;
}) {
  return (
    <>
      {previewError && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-3 py-2.5" role="alert">
          <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" aria-hidden />
          <p className="text-xs text-red-700 dark:text-red-300">{previewError}</p>
        </div>
      )}
      {confirmError && (
        <div
          className={clsx(
            'flex items-start gap-2 rounded-lg border px-3 py-2.5',
            duplicateSequenceError
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900',
          )}
          role="alert"
        >
          <AlertCircle
            size={16}
            className={clsx(
              'shrink-0 mt-0.5',
              duplicateSequenceError
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400',
            )}
            aria-hidden
          />
          <div className="min-w-0 space-y-1">
            <p
              className={clsx(
                'text-xs',
                duplicateSequenceError
                  ? 'text-amber-800 dark:text-amber-200'
                  : 'text-red-700 dark:text-red-300',
              )}
            >
              {confirmError}
            </p>
            {duplicateSequenceError ? (
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Corrige el N° consecutivo abajo e intenta de nuevo.
              </p>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
