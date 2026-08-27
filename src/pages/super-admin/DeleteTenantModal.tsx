import { AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function DeleteTenantModal({
  loading,
  onClose,
  onConfirm,
}: {
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle size={24} className="text-red-500" />
          <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Eliminar Tenant</h3>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">¿Estás seguro? Esta acción eliminará todos los datos asociados.</p>
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onConfirm} disabled={loading}>
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
