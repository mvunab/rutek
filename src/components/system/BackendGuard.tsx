import { useEffect, type ReactNode } from 'react';
import { Activity } from 'lucide-react';
import { useHealthStore } from '../../store/useHealthStore';
import { ServiceUnavailable } from './ServiceUnavailable';

interface BackendGuardProps {
  children: ReactNode;
}

/**
 * Bloquea el acceso a rutas protegidas cuando el backend no responde.
 *
 * En el primer render dispara un health check. Mientras tanto muestra un
 * loader. Si responde "offline", muestra `<ServiceUnavailable />` y no
 * renderiza los children — es decir, no se entrega ninguna parte de la app
 * al usuario hasta que el backend vuelva.
 */
export function BackendGuard({ children }: BackendGuardProps) {
  const { status, check } = useHealthStore();

  useEffect(() => {
    if (status === 'unknown') {
      void check();
    }
  }, [status, check]);

  if (status === 'unknown' || status === 'checking') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950"
      >
        <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400">
          <Activity size={18} className="animate-spin text-primary-600" aria-hidden="true" />
          <span className="text-sm">Conectando con el servidor…</span>
        </div>
      </div>
    );
  }

  if (status === 'offline') {
    return <ServiceUnavailable />;
  }

  return <>{children}</>;
}
