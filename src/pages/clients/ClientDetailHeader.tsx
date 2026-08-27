import {
  ArrowLeft,
  CheckCircle,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import type { ClientCrmOverview } from '../../types/clientCrm';

export function ClientDetailHeader({
  client,
  onBack,
  onNewOpportunity,
}: {
  client: ClientCrmOverview['client'];
  onBack: () => void;
  onNewOpportunity: () => void;
}) {
  const phoneDigits = client.phone.replace(/\D/g, '');

  return (
    <>
      <div className="flex flex-wrap items-start gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          icon={<ArrowLeft size={16} aria-hidden />}
        >
          Clientes
        </Button>
      </div>

      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div
              aria-hidden
              className="size-14 rounded-2xl bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-800 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xl shrink-0"
            >
              {client.companyName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100 truncate">
                  {client.companyName}
                </h1>
                <Badge variant={client.active ? 'success' : 'slate'}>
                  {client.active ? <CheckCircle size={10} aria-hidden /> : <XCircle size={10} aria-hidden />}
                  {client.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {client.contactName} · RUT {client.rut}
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 flex items-center gap-1.5">
                <MapPin size={12} aria-hidden />
                {client.address}, {client.city}, {client.region}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {phoneDigits ? (
              <a href={`tel:${client.phone}`}>
                <Button variant="secondary" size="sm" icon={<Phone size={16} aria-hidden />}>
                  Llamar
                </Button>
              </a>
            ) : null}
            <a href={`mailto:${client.email}`}>
              <Button variant="secondary" size="sm" icon={<Mail size={16} aria-hidden />}>
                Email
              </Button>
            </a>
            <Button
              variant="primary"
              size="sm"
              icon={<Sparkles size={16} aria-hidden />}
              onClick={onNewOpportunity}
            >
              Nueva oportunidad
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
