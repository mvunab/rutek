import { FileSpreadsheet } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export function ImportExcelPreviewFooter({
  previewRowCount,
  confirmLoading,
  assignBusy,
  parsedRouteSequence,
  assignProgress,
  onConfirm,
  onClose,
}: {
  previewRowCount: number;
  confirmLoading: boolean;
  assignBusy: boolean;
  parsedRouteSequence: number | null;
  assignProgress: { done: number; total: number } | null;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="flex gap-3 justify-end pt-1">
        <Button variant="ghost" onClick={onClose} disabled={confirmLoading}>
          Cancelar
        </Button>
        <Button
          onClick={() => void onConfirm()}
          loading={confirmLoading}
          icon={<FileSpreadsheet size={15} />}
          disabled={assignBusy || parsedRouteSequence == null}
        >
          Crear ruta y {previewRowCount} pedidos
        </Button>
      </div>
      {assignProgress ? (
        <p className="text-xs text-stone-500 dark:text-stone-400 text-right tabular-nums">
          Aplicando asignaciones… {assignProgress.done}/{assignProgress.total}
        </p>
      ) : null}
    </>
  );
}
