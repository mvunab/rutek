import { useState } from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { useHealthStore } from '../../store/useHealthStore';

export function ServiceUnavailable() {
  const { check, status } = useHealthStore();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await check();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-6"
    >
      <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 flex items-center justify-center mb-5">
          <CloudOff size={26} className="text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>

        <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-2">
          Servicio no disponible
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
          No podemos contactar al servidor en este momento.
        </p>
        <p className="text-xs text-stone-400 dark:text-stone-500 mb-8">
          Puedes intentar{' '}
          <a href="/login" className="text-primary-600 hover:underline">
            iniciar sesión
          </a>{' '}
          o recargar la página. Si acabas de cambiar el DNS, espera unos minutos.
        </p>

        <Button
          onClick={handleRetry}
          loading={retrying || status === 'checking'}
          icon={<RefreshCw size={16} />}
          fullWidth
        >
          Reintentar conexión
        </Button>

        <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-6">
          Si el problema persiste, contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}
