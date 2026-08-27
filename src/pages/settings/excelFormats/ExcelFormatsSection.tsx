import { AlertCircle, FileSpreadsheet, Plus } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ExcelFormatEditor } from './ExcelFormatEditor';
import { ExcelFormatList } from './ExcelFormatList';
import { useExcelFormatsSection } from './useExcelFormatsSection';

export function ExcelFormatsSection() {
  const {
    formats,
    loading,
    error,
    editingId,
    saving,
    editorForm,
    setEditorForm,
    rawHeaders,
    headersLoading,
    headersError,
    fileInputRef,
    headerCols,
    openNew,
    openEdit,
    closeEditor,
    handleFileUpload,
    handleSave,
    handleDelete,
    handleActivate,
    setCol,
    setMeta,
  } = useExcelFormatsSection();

  return (
    <Card padding="lg">
      <div className="flex items-start gap-3 mb-5">
        <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400">
          <FileSpreadsheet size={20} aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
            Formatos de importación Excel
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
            Define plantillas personalizadas para importar rutas desde Excel. Al importar puedes elegir cuál usar; la marcada como activa es la predeterminada.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          icon={<Plus size={14} aria-hidden />}
          onClick={openNew}
          disabled={editingId !== null}
        >
          Nuevo formato
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-3 flex items-center gap-1.5" role="alert">
          <AlertCircle size={14} aria-hidden />
          {error}
        </p>
      )}

      <ExcelFormatList
        formats={formats}
        loading={loading}
        editingId={editingId}
        onActivate={handleActivate}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      {editingId !== null && (
        <ExcelFormatEditor
          editingId={editingId}
          editorForm={editorForm}
          onChange={setEditorForm}
          rawHeaders={rawHeaders}
          headersLoading={headersLoading}
          headersError={headersError}
          fileInputRef={fileInputRef}
          headerCols={headerCols}
          saving={saving}
          onFileUpload={handleFileUpload}
          onClose={closeEditor}
          onSave={handleSave}
          onSetCol={setCol}
          onSetMeta={setMeta}
        />
      )}
    </Card>
  );
}
