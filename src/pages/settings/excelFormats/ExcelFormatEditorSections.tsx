import type { ExcelColumnMapping, ExcelFormatConfig } from '../../../types';
import { Input, Select } from '../../../components/ui/Input';
import { SYSTEM_FIELDS, colLetter, LETTERS } from './constants';
import type { RawHeadersResult } from './constants';

type ExcelFormatPreviewTableProps = {
  rawHeaders: RawHeadersResult;
  editorForm: Omit<ExcelFormatConfig, 'id'> & { id?: string };
};

export function ExcelFormatPreviewTable({ rawHeaders, editorForm }: ExcelFormatPreviewTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-700">
      <table className="text-[11px] min-w-full">
        <thead>
          <tr className="bg-stone-100 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-700">
            <th className="px-2 py-2 font-bold text-stone-500 dark:text-stone-400 text-left w-8">Fila</th>
            {rawHeaders.rows[0]?.map((_, ci) => {
              const mappedField = (Object.entries(editorForm.columns) as [keyof ExcelColumnMapping, number | null | undefined][])
                .find(([, v]) => v === ci)?.[0];
              const fieldInfo = mappedField
                ? SYSTEM_FIELDS.find((f) => f.key === mappedField)
                : null;
              return (
                <th key={ci} className="px-2 py-1.5 text-left whitespace-nowrap">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-stone-600 dark:text-stone-300">{colLetter(ci)}</span>
                    {fieldInfo ? (
                      <span className="inline-block px-1 py-px rounded text-[9px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 leading-tight truncate max-w-[80px]">
                        {fieldInfo.label}
                      </span>
                    ) : null}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
          {rawHeaders.rows.slice(0, 10).map((row, ri) => {
            const isHeader = ri === editorForm.headerRow;
            const isData = ri === editorForm.dataStartRow;
            return (
              <tr
                key={ri}
                className={
                  isHeader
                    ? 'bg-orange-100 dark:bg-orange-900/40 font-semibold border-l-2 border-orange-400 dark:border-orange-500'
                    : isData
                    ? 'bg-sky-100/70 dark:bg-sky-900/30 border-l-2 border-sky-400 dark:border-sky-500'
                    : ''
                }
              >
                <td className="px-2 py-1 tabular-nums font-medium text-stone-500 dark:text-stone-400">{ri + 1}</td>
                {row.map((cell, ci) => {
                  const mappedField = (Object.entries(editorForm.columns) as [keyof ExcelColumnMapping, number | null | undefined][])
                    .find(([, v]) => v === ci)?.[0];
                  return (
                    <td
                      key={ci}
                      className={`px-2 py-1 truncate max-w-[140px] ${
                        mappedField
                          ? 'text-violet-700 dark:text-violet-300 font-medium'
                          : 'text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {cell ?? <span className="text-stone-300 dark:text-stone-600">—</span>}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex items-center gap-4 px-3 py-1.5 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50">
        <span className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-400 dark:bg-orange-500" />
          Encabezado
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-sky-400 dark:bg-sky-500" />
          Primera fila datos
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-violet-400 dark:bg-violet-500" />
          Columna mapeada
        </span>
      </div>
    </div>
  );
}

type ExcelFormatDataPositionProps = {
  editorForm: Omit<ExcelFormatConfig, 'id'> & { id?: string };
  onChange: (form: Omit<ExcelFormatConfig, 'id'> & { id?: string }) => void;
};

export function ExcelFormatDataPosition({ editorForm, onChange }: ExcelFormatDataPositionProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-3">
        2. Posición de datos
      </p>
      <div className="flex flex-wrap gap-4 items-stretch">
        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/60 rounded-xl px-3 py-2 min-w-[180px]">
          <span className="shrink-0 w-2 self-stretch rounded-full bg-orange-400 dark:bg-orange-500" />
          <Input
            label="Fila encabezado"
            type="number"
            value={String(editorForm.headerRow + 1)}
            onChange={(e) => {
              const v = Math.max(1, parseInt(e.target.value) || 1);
              onChange({ ...editorForm, headerRow: v - 1, dataStartRow: Math.max(v, editorForm.dataStartRow) });
            }}
            autoComplete="off"
            containerClassName="flex-1"
          />
        </div>
        <div className="flex items-center gap-2 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 rounded-xl px-3 py-2 min-w-[180px]">
          <span className="shrink-0 w-2 self-stretch rounded-full bg-sky-400 dark:bg-sky-500" />
          <Input
            label="Primera fila de datos"
            type="number"
            value={String(editorForm.dataStartRow + 1)}
            onChange={(e) => {
              const v = Math.max(1, parseInt(e.target.value) || 1);
              onChange({ ...editorForm, dataStartRow: v - 1 });
            }}
            autoComplete="off"
            containerClassName="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

type ExcelFormatColumnMappingProps = {
  editorForm: Omit<ExcelFormatConfig, 'id'> & { id?: string };
  headerCols: (string | null)[];
  onSetCol: (field: keyof ExcelColumnMapping, colIdx: number | null) => void;
};

export function ExcelFormatColumnMapping({ editorForm, headerCols, onSetCol }: ExcelFormatColumnMappingProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-2">
        3. Mapeo de columnas
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SYSTEM_FIELDS.map(({ key, label, hint }) => {
          const currentCol = editorForm.columns[key] ?? null;
          const colOptions = headerCols.map((cell, ci) => ({
            value: String(ci),
            label: `${colLetter(ci)} — ${cell ?? '(vacía)'}`,
          }));
          return (
            <div key={key} className="space-y-1">
              <Select
                label={label}
                value={currentCol != null ? String(currentCol) : ''}
                onChange={(e) => onSetCol(key, e.target.value !== '' ? parseInt(e.target.value) : null)}
                options={[
                  { value: '', label: '— No mapear —' },
                  ...colOptions,
                ]}
                autoComplete="off"
              />
              {currentCol == null && (
                <p className="text-[10px] text-stone-400 pl-1">{hint}</p>
              )}
            </div>
          );
        })}
      </div>
      {headerCols.length === 0 && (
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
          Sube un Excel de muestra para ver las columnas disponibles.
        </p>
      )}
    </div>
  );
}

type ExcelFormatMetadataSectionProps = {
  editorForm: Omit<ExcelFormatConfig, 'id'> & { id?: string };
  onSetMeta: (field: 'routeNumber' | 'date' | 'driver', pos: { row: number; col: number } | null) => void;
  onChange: (form: Omit<ExcelFormatConfig, 'id'> & { id?: string }) => void;
};

export function ExcelFormatMetadataSection({
  editorForm,
  onSetMeta,
  onChange,
}: ExcelFormatMetadataSectionProps) {
  return (
    <>
      <div>
        <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-2">
          4. Celdas de metadatos <span className="normal-case font-normal text-stone-400">(opcional)</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              { field: 'routeNumber' as const, label: 'N° de ruta' },
              { field: 'date' as const, label: 'Fecha' },
              { field: 'driver' as const, label: 'Chofer' },
            ] as const
          ).map(({ field, label }) => {
            const pos = editorForm.metadata?.[field] ?? null;
            return (
              <div key={field} className="space-y-1.5 p-3 rounded-lg border border-stone-200 dark:border-stone-700 bg-white/60 dark:bg-stone-900/40">
                <p className="text-xs font-medium text-stone-700 dark:text-stone-300">{label}</p>
                <div className="flex gap-2">
                  <Input
                    label="Fila"
                    type="number"
                    value={pos ? String(pos.row + 1) : ''}
                    onChange={(e) => {
                      const row = parseInt(e.target.value);
                      if (!isNaN(row) && row >= 1) {
                        onSetMeta(field, { row: row - 1, col: pos?.col ?? 0 });
                      } else if (e.target.value === '') {
                        onSetMeta(field, null);
                      }
                    }}
                    autoComplete="off"
                    containerClassName="flex-1"
                  />
                  <Input
                    label="Col"
                    placeholder="A"
                    value={pos ? colLetter(pos.col) : ''}
                    onChange={(e) => {
                      const letter = e.target.value.trim().toUpperCase();
                      const ci = LETTERS.indexOf(letter);
                      if (ci >= 0) {
                        onSetMeta(field, { row: pos?.row ?? 0, col: ci });
                      } else if (letter === '') {
                        onSetMeta(field, null);
                      }
                    }}
                    autoComplete="off"
                    containerClassName="w-16"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-2">
          5. Regla de detección automática <span className="normal-case font-normal text-stone-400">(opcional)</span>
        </p>
        <p className="text-xs text-stone-400 dark:text-stone-500 mb-3">
          Si se define, Rutek puede identificar este formato cuando la celda indicada contenga el valor exacto. Al importar, de todos modos puedes elegir la plantilla manualmente.
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <Input
            label="Fila"
            type="number"
            value={editorForm.detection ? String(editorForm.detection.row + 1) : ''}
            onChange={(e) => {
              const row = parseInt(e.target.value);
              if (!isNaN(row) && row >= 1) {
                onChange({
                  ...editorForm,
                  detection: { row: row - 1, col: editorForm.detection?.col ?? 0, value: editorForm.detection?.value ?? '' },
                });
              } else if (e.target.value === '') {
                onChange({ ...editorForm, detection: null });
              }
            }}
            autoComplete="off"
            containerClassName="w-20"
          />
          <Input
            label="Col"
            placeholder="A"
            value={editorForm.detection ? colLetter(editorForm.detection.col) : ''}
            onChange={(e) => {
              const letter = e.target.value.trim().toUpperCase();
              const ci = LETTERS.indexOf(letter);
              if (ci >= 0) {
                onChange({
                  ...editorForm,
                  detection: { row: editorForm.detection?.row ?? 0, col: ci, value: editorForm.detection?.value ?? '' },
                });
              } else if (letter === '') {
                onChange({ ...editorForm, detection: null });
              }
            }}
            autoComplete="off"
            containerClassName="w-16"
          />
          <Input
            label="Valor esperado"
            placeholder="Ej. TIENDA"
            value={editorForm.detection?.value ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              onChange({
                ...editorForm,
                detection: editorForm.detection
                  ? { ...editorForm.detection, value }
                  : { row: 0, col: 0, value },
              });
            }}
            autoComplete="off"
            containerClassName="flex-1 min-w-[160px]"
          />
        </div>
      </div>
    </>
  );
}
