import { CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { useRouteImportStore } from '../../../store/useRouteImportStore';

type LastResult = NonNullable<ReturnType<typeof useRouteImportStore.getState>['lastResult']>;
type Preview = ReturnType<typeof useRouteImportStore.getState>['preview'];

export function ImportExcelSuccessStep({
  lastResult,
  parsedRouteSequence,
  preview,
  onClose,
}: {
  lastResult: LastResult;
  parsedRouteSequence: number | null;
  preview: Preview;
  onClose: () => void;
}) {
  return (
    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-5 space-y-3 text-center">
      <CheckCircle2 size={36} className="mx-auto text-emerald-500" aria-hidden />
      <div>
        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
          ¡Ruta importada correctamente!
        </p>
        <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
          N°{' '}
          <span translate="no" className="font-mono font-bold">
            {parsedRouteSequence ?? preview?.route_number ?? lastResult.route_code}
          </span>
          {' '}· {lastResult.orders_created} pedidos creados
          {lastResult.client_name ? ` · cuenta: ${lastResult.client_name}` : ''}
        </p>
      </div>
      <Button onClick={onClose}>Cerrar</Button>
    </div>
  );
}
