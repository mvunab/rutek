import { Copy } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { api } from '../../lib/api';
import { formatCLP } from '../../lib/pricingProfile';
import type { Client } from '../../types';
import type { BillingFlowTemplate, ClientChargeDocument } from '../../types/billingFlow';
import { downloadCharge } from './billingFlowsMappers';

export function BillingFlowsListView({
  templates,
  charges,
  clients,
  chargeClientId,
  periodFrom,
  periodTo,
  saving,
  onOpenTemplate,
  onDuplicate,
  onChargeClientIdChange,
  onPeriodFromChange,
  onPeriodToChange,
  onGenerateCharge,
  onReload,
}: {
  templates: BillingFlowTemplate[];
  charges: ClientChargeDocument[];
  clients: Client[];
  chargeClientId: string;
  periodFrom: string;
  periodTo: string;
  saving: boolean;
  onOpenTemplate: (t: BillingFlowTemplate) => void;
  onDuplicate: (id: string) => void;
  onChargeClientIdChange: (id: string) => void;
  onPeriodFromChange: (value: string) => void;
  onPeriodToChange: (value: string) => void;
  onGenerateCharge: () => void;
  onReload: () => void;
}) {
  return (
    <>
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 dark:bg-stone-950 text-left text-xs text-stone-500">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Versión</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-t border-stone-100 dark:border-stone-800">
                <td className="px-3 py-2 font-medium">{t.name}</td>
                <td className="px-3 py-2">{t.status}</td>
                <td className="px-3 py-2 tabular-nums">v{t.version}</td>
                <td className="px-3 py-2 text-right space-x-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => onOpenTemplate(t)}>
                    Editar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    icon={<Copy size={14} />}
                    onClick={() => void onDuplicate(t.id)}
                  >
                    Duplicar
                  </Button>
                </td>
              </tr>
            ))}
            {templates.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-stone-500">
                  Aún no hay plantillas. Crea una para negociar cobros por cliente.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold">Generar cobro</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Select
            label="Cliente"
            value={chargeClientId}
            onChange={(e) => onChargeClientIdChange(e.target.value)}
            options={[
              { value: '', label: 'Seleccionar…' },
              ...clients.map((c) => ({ value: c.id, label: c.companyName })),
            ]}
          />
          <Input
            label="Desde"
            type="date"
            value={periodFrom}
            onChange={(e) => onPeriodFromChange(e.target.value)}
          />
          <Input
            label="Hasta"
            type="date"
            value={periodTo}
            onChange={(e) => onPeriodToChange(e.target.value)}
          />
          <div className="flex items-end">
            <Button type="button" onClick={onGenerateCharge} disabled={saving || !chargeClientId}>
              Generar
            </Button>
          </div>
        </div>

        <ul className="divide-y divide-stone-100 dark:divide-stone-800">
          {charges.slice(0, 10).map((c) => (
            <li key={c.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <p className="font-medium">{c.clientName ?? c.clientId}</p>
                <p className="text-xs text-stone-500">
                  {c.status} · {formatCLP(c.totalAmount)}
                </p>
              </div>
              <div className="flex gap-2">
                {c.status === 'draft' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      void api.post(`/billing/charges/${c.id}/confirm`, {}).then(() => onReload())
                    }
                  >
                    Confirmar
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void downloadCharge(c.id, 'xlsx')}
                >
                  Excel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void downloadCharge(c.id, 'pdf')}
                >
                  PDF
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
