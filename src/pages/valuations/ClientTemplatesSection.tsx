import { Link } from 'react-router-dom';
import { GitBranch } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import type { BillingFlowTemplate, ClientBillingAssignment } from '../../types/billingFlow';

type ClientRow = {
  id: string;
  companyName: string;
  rut?: string | null;
};

export function ClientTemplatesSection({
  activeClients,
  templates,
  assignmentByClient,
  pickByClient,
  assigningId,
  assignMsg,
  withFlow,
  onPickChange,
  onAssign,
  onNavigate,
}: {
  activeClients: ClientRow[];
  templates: BillingFlowTemplate[];
  assignmentByClient: Map<string, ClientBillingAssignment>;
  pickByClient: Record<string, string>;
  assigningId: string | null;
  assignMsg: string;
  withFlow: number;
  onPickChange: (clientId: string, templateId: string) => void;
  onAssign: (clientId: string) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <section className="rounded-xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitBranch size={16} className="text-stone-500" aria-hidden />
          <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
            Clientes y plantillas de cobro
          </h2>
        </div>
        <span className="text-xs text-stone-600 dark:text-stone-400 tabular-nums">
          {withFlow}/{activeClients.length} con flujo
        </span>
      </div>

      {activeClients.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={<GitBranch size={28} aria-hidden />}
            title="Sin clientes"
            description="Crea clientes en la sección Clientes para poder asociarles una plantilla de cobro."
            action={{
              label: 'Ir a clientes',
              onClick: () => onNavigate('/clientes'),
            }}
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-900/80 text-left text-[11px] font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                <th className="px-3 py-2.5">Cliente</th>
                <th className="px-3 py-2.5">RUT</th>
                <th className="px-3 py-2.5">Flujo actual</th>
                <th className="px-3 py-2.5">Asignar plantilla</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {activeClients.map((client) => {
                const assignment = assignmentByClient.get(client.id);
                const pick = pickByClient[client.id] ?? '';
                return (
                  <tr
                    key={client.id}
                    className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors duration-200"
                  >
                    <td className="px-3 py-2.5">
                      <Link
                        to={`/clientes/${client.id}`}
                        className="font-medium text-stone-800 dark:text-stone-100 hover:underline cursor-pointer"
                      >
                        {client.companyName}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-stone-600 dark:text-stone-400 font-mono text-xs">
                      {client.rut || '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {assignment ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800">
                          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                          {assignment.name || 'Flujo propio'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                          <span className="size-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden />
                          Sin flujo — usa perfil tenant
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="min-w-[160px] max-w-[220px] rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 px-2 py-1.5 text-xs text-stone-800 dark:text-stone-100"
                          value={pick}
                          onChange={(e) => onPickChange(client.id, e.target.value)}
                          aria-label={`Plantilla para ${client.companyName}`}
                        >
                          <option value="">
                            {templates.length ? 'Seleccionar…' : 'Sin plantillas'}
                          </option>
                          {templates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} (v{t.version})
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={!pick || assigningId === client.id || templates.length === 0}
                          onClick={() => onAssign(client.id)}
                        >
                          {assigningId === client.id ? '…' : 'Asignar'}
                        </Button>
                        {assignment ? (
                          <Link
                            to={`/clientes/${client.id}`}
                            className="text-xs text-primary-700 dark:text-primary-300 underline cursor-pointer"
                          >
                            Editar
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {assignMsg ? (
        <p
          className="px-4 py-2 text-xs text-stone-600 dark:text-stone-400 border-t border-stone-200 dark:border-stone-800"
          role="status"
          aria-live="polite"
        >
          {assignMsg}
        </p>
      ) : null}
      {templates.length === 0 && activeClients.length > 0 ? (
        <p className="px-4 py-2 text-xs text-stone-600 border-t border-stone-200 dark:border-stone-800">
          Aún no hay plantillas.{' '}
          <button
            type="button"
            className="underline text-primary-700 dark:text-primary-300 cursor-pointer"
            onClick={() => onNavigate('/valorizacion/flujos/nuevo')}
          >
            Crear una plantilla
          </button>{' '}
          para poder asociarla a clientes.
        </p>
      ) : null}
    </section>
  );
}
