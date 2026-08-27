import { FileSpreadsheet, Trash2, Zap } from 'lucide-react';
import type { ExcelFormatConfig } from '../../../types';
import { colLetter } from './constants';

type ExcelFormatListProps = {
  formats: ExcelFormatConfig[];
  loading: boolean;
  editingId: string | 'new' | null;
  onActivate: (id: string) => void;
  onEdit: (fmt: ExcelFormatConfig) => void;
  onDelete: (id: string) => void;
};

export function ExcelFormatList({
  formats,
  loading,
  editingId,
  onActivate,
  onEdit,
  onDelete,
}: ExcelFormatListProps) {
  if (loading) {
    return <p className="text-sm text-stone-400 dark:text-stone-500">Cargando…</p>;
  }

  if (formats.length === 0 && editingId === null) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-700 py-8 text-center">
        <FileSpreadsheet size={24} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" aria-hidden />
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Sin formatos definidos. Crea uno para personalizar la importación.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mb-4">
      {formats.map((fmt) => (
        <div
          key={fmt.id}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors ${
            fmt.active
              ? 'border-orange-300 bg-orange-50/70 dark:border-orange-700/60 dark:bg-orange-950/25'
              : 'border-stone-200 dark:border-stone-700 bg-white/60 dark:bg-stone-900/30'
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-800 dark:text-stone-100 truncate">
                {fmt.name}
              </span>
              {fmt.active && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wide">
                  <Zap size={9} aria-hidden />
                  Activo
                </span>
              )}
            </div>
            <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
              Encabezado: fila {fmt.headerRow + 1} · Datos desde fila {fmt.dataStartRow + 1}
              {' · '}
              {Object.values(fmt.columns).filter((v) => typeof v === 'number' && v >= 0).length}{' '}
              columnas mapeadas
              {fmt.detection ? ` · Detección: "${fmt.detection.value}" en ${colLetter(fmt.detection.col)}${fmt.detection.row + 1}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!fmt.active && (
              <button
                type="button"
                onClick={() => void onActivate(fmt.id)}
                className="text-xs px-2 py-1 rounded-md border border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 transition-colors"
              >
                Activar
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(fmt)}
              disabled={editingId !== null}
              className="text-xs px-2 py-1 rounded-md border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => void onDelete(fmt.id)}
              disabled={fmt.active}
              className="p-1.5 rounded-md text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
              aria-label="Eliminar formato"
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
