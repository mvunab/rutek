import { FileSpreadsheet } from 'lucide-react';
import { clsx } from 'clsx';

export function ImportExcelFileDropzone({
  fileInputRef,
  file,
  previewLoading,
  confirmLoading,
  evaluateLoading,
  onFileChange,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  file: File | null;
  previewLoading: boolean;
  confirmLoading: boolean;
  evaluateLoading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="sr-only"
        onChange={onFileChange}
        aria-label="Seleccionar archivo Excel"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={previewLoading || confirmLoading || evaluateLoading}
        className={clsx(
          'w-full rounded-xl border-2 border-dashed p-6 flex flex-col items-center gap-2 transition-colors text-center',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          previewLoading || evaluateLoading
            ? 'opacity-60 cursor-wait border-stone-300 dark:border-stone-700'
            : file
              ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/30'
              : 'border-stone-300 hover:border-primary-400 hover:bg-primary-50/40 dark:border-stone-600 dark:hover:border-primary-600',
        )}
      >
        <FileSpreadsheet
          size={28}
          className={file ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}
          aria-hidden
        />
        {evaluateLoading ? (
          <p className="text-sm text-stone-500">Evaluando plantillas…</p>
        ) : previewLoading ? (
          <p className="text-sm text-stone-500">Leyendo archivo…</p>
        ) : file ? (
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 truncate max-w-xs">
            {file.name}
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
              Haz clic para seleccionar el Excel
            </p>
            <p className="text-xs text-stone-400">.xlsx · máx. 10 MB</p>
          </>
        )}
      </button>
    </div>
  );
}
