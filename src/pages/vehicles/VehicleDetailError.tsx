import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function VehicleDetailError({
  error,
  onBack,
}: {
  error: string | null;
  onBack: () => void;
}) {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        icon={<ArrowLeft size={16} aria-hidden />}
      >
        Volver a vehículos
      </Button>
      <div
        className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6"
        role="alert"
      >
        <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
          <AlertTriangle size={16} aria-hidden className="shrink-0" />
          {error ?? 'Vehículo no encontrado.'}
        </p>
      </div>
    </div>
  );
}
