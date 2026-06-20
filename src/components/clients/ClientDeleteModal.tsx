import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Package, Route, StickyNote } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { Client } from '../../types';

export interface ClientDeletionImpact {
  client_id: string;
  company_name: string;
  routes_count: number;
  orders_count: number;
  activities_count: number;
  requires_cascade: boolean;
}

interface ClientDeleteModalProps {
  client: Client | null;
  open: boolean;
  onClose: () => void;
  onConfirmCascade: () => Promise<void>;
  loadImpact: (clientId: string) => Promise<ClientDeletionImpact>;
}

export function ClientDeleteModal({
  client,
  open,
  onClose,
  onConfirmCascade,
  loadImpact,
}: ClientDeleteModalProps) {
  const [impact, setImpact] = useState<ClientDeletionImpact | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open || !client) {
      setImpact(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void loadImpact(client.id)
      .then((data) => {
        if (!cancelled) setImpact(data);
      })
      .catch(() => {
        if (!cancelled) {
          setError('No se pudo cargar el detalle de eliminación. Intenta de nuevo.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, client, loadImpact]);

  const handleCascadeDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onConfirmCascade();
      onClose();
    } catch {
      setError('No se pudo eliminar el cliente. Intenta de nuevo.');
    } finally {
      setDeleting(false);
    }
  };

  const companyName = client?.companyName ?? impact?.company_name ?? 'este cliente';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Eliminar cliente"
      description={companyName}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => void handleCascadeDelete()}
            disabled={loading || deleting || !!error || !impact}
            loading={deleting}
          >
            {impact?.requires_cascade ? 'Eliminar todo en cadena' : 'Eliminar cliente'}
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-stone-500" role="status" aria-live="polite">
          <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden />
          Analizando dependencias…
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : impact ? (
        <div className="space-y-4">
          {impact.requires_cascade ? (
            <>
              <div
                className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30"
                role="alert"
              >
                <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden />
                <div className="text-sm text-amber-900 dark:text-amber-100">
                  <p className="font-semibold">Se eliminarán datos relacionados</p>
                  <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
                    Este cliente tiene rutas y/o pedidos. La eliminación en cadena borra también
                    esos registros de forma permanente.
                  </p>
                </div>
              </div>

              <ul className="space-y-2" role="list" aria-label="Elementos que se eliminarán">
                <li className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2.5 text-sm">
                  <span className="inline-flex items-center gap-2 text-stone-700 dark:text-stone-200">
                    <Route size={16} className="text-stone-400" aria-hidden />
                    Rutas
                  </span>
                  <span className="font-bold tabular-nums text-stone-900 dark:text-stone-100">
                    {impact.routes_count}
                  </span>
                </li>
                <li className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2.5 text-sm">
                  <span className="inline-flex items-center gap-2 text-stone-700 dark:text-stone-200">
                    <Package size={16} className="text-stone-400" aria-hidden />
                    Pedidos
                  </span>
                  <span className="font-bold tabular-nums text-stone-900 dark:text-stone-100">
                    {impact.orders_count}
                  </span>
                </li>
                <li className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-700 px-3 py-2.5 text-sm">
                  <span className="inline-flex items-center gap-2 text-stone-700 dark:text-stone-200">
                    <StickyNote size={16} className="text-stone-400" aria-hidden />
                    Actividades CRM
                  </span>
                  <span className="font-bold tabular-nums text-stone-900 dark:text-stone-100">
                    {impact.activities_count}
                  </span>
                </li>
              </ul>

              <p className="text-xs text-stone-500 dark:text-stone-400">
                Incluye fotos de ruta, registros de entrega y tokens de seguimiento vinculados a
                esos pedidos. Esta acción no se puede deshacer.
              </p>
            </>
          ) : (
            <p className="text-sm text-stone-600 dark:text-stone-300">
              {impact.activities_count > 0
                ? `Se eliminará el cliente "${companyName}" y ${impact.activities_count} actividad${impact.activities_count === 1 ? '' : 'es'} CRM asociada${impact.activities_count === 1 ? '' : 's'}.`
                : `Se eliminará el cliente "${companyName}". No tiene rutas ni pedidos asociados.`}
            </p>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
