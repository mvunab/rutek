import { Upload, X } from 'lucide-react';
import type { ExcelColumnMapping, ExcelFormatConfig } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import type { RawHeadersResult } from './constants';
import {
  ExcelFormatColumnMapping,
  ExcelFormatDataPosition,
  ExcelFormatMetadataSection,
  ExcelFormatPreviewTable,
} from './ExcelFormatEditorSections';

type ExcelFormatEditorProps = {
  editingId: string | 'new';
  editorForm: Omit<ExcelFormatConfig, 'id'> & { id?: string };
  onChange: (form: Omit<ExcelFormatConfig, 'id'> & { id?: string }) => void;
  rawHeaders: RawHeadersResult | null;
  headersLoading: boolean;
  headersError: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  headerCols: (string | null)[];
  saving: boolean;
  onFileUpload: (file: File) => void;
  onClose: () => void;
  onSave: () => void;
  onSetCol: (field: keyof ExcelColumnMapping, colIdx: number | null) => void;
  onSetMeta: (field: 'routeNumber' | 'date' | 'driver', pos: { row: number; col: number } | null) => void;
};

export function ExcelFormatEditor({
  editingId,
  editorForm,
  onChange,
  rawHeaders,
  headersLoading,
  headersError,
  fileInputRef,
  headerCols,
  saving,
  onFileUpload,
  onClose,
  onSave,
  onSetCol,
  onSetMeta,
}: ExcelFormatEditorProps) {
  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/60 dark:bg-stone-900/40 overflow-hidden mt-4">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 dark:border-stone-700">
        <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
          {editingId === 'new' ? 'Nuevo formato' : 'Editar formato'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label="Cerrar editor"
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      <div className="p-4 space-y-5">
        <div className="flex flex-wrap gap-3 items-end">
          <Input
            label="Nombre del formato"
            value={editorForm.name}
            onChange={(e) => onChange({ ...editorForm, name: e.target.value })}
            autoComplete="off"
            containerClassName="flex-1 min-w-[200px]"
          />
          <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300 pb-2 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-stone-300 dark:border-stone-600 text-orange-500 focus:ring-orange-500"
              checked={editorForm.active}
              onChange={(e) => onChange({ ...editorForm, active: e.target.checked })}
            />
            Marcar como activo al guardar
          </label>
        </div>

        <div>
          <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide mb-2">
            1. Cargar Excel de muestra
          </p>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFileUpload(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={headersLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-sm text-stone-600 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors"
            >
              <Upload size={14} aria-hidden />
              {headersLoading ? 'Cargando…' : rawHeaders ? 'Cambiar archivo' : 'Subir Excel'}
            </button>
            {rawHeaders && (
              <span className="text-xs text-stone-500 dark:text-stone-400">
                {rawHeaders.sheetName} · {rawHeaders.rows.length} filas detectadas
              </span>
            )}
            {headersError && (
              <span className="text-xs text-red-600 dark:text-red-400">{headersError}</span>
            )}
          </div>
        </div>

        {rawHeaders && (
          <ExcelFormatPreviewTable rawHeaders={rawHeaders} editorForm={editorForm} />
        )}

        <ExcelFormatDataPosition editorForm={editorForm} onChange={onChange} />
        <ExcelFormatColumnMapping
          editorForm={editorForm}
          headerCols={headerCols}
          onSetCol={onSetCol}
        />
        <ExcelFormatMetadataSection
          editorForm={editorForm}
          onSetMeta={onSetMeta}
          onChange={onChange}
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-700">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
          >
            Cancelar
          </button>
          <Button
            type="button"
            onClick={() => void onSave()}
            loading={saving}
            disabled={!editorForm.name.trim()}
          >
            Guardar formato
          </Button>
        </div>
      </div>
    </div>
  );
}
