import { FileClock, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function AuditPageHeader({
  loading,
  onRefresh,
}: {
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <div aria-hidden="true" className="size-9 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
          <FileClock size={18} className="text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-stone-900 dark:text-stone-100 tracking-tight">
            Auditoría
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Registro inmutable de cambios sobre tenants y usuarios.
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={onRefresh}
        disabled={loading}
        aria-label="Recargar registros"
      >
        <RefreshCw size={14} aria-hidden="true" className={loading ? 'animate-spin' : ''} />
        Recargar
      </Button>
    </div>
  );
}
