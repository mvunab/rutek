import { Check, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { PricingProfile } from '../../types/pricing';
import { PricingProfileMoneyInput } from './PricingProfileMoneyInput';

export function PricingProfileForm({
  profile,
  loading,
  saving,
  error,
  saved,
  onProfileChange,
  onPatchClient,
  onPatchDriver,
  onPatchPeoneta,
  onSave,
}: {
  profile: PricingProfile;
  loading: boolean;
  saving: boolean;
  error: string;
  saved: boolean;
  onProfileChange: (updater: (p: PricingProfile) => PricingProfile) => void;
  onPatchClient: (patch: Partial<PricingProfile['client']>) => void;
  onPatchDriver: (patch: Partial<PricingProfile['worker']['driver']>) => void;
  onPatchPeoneta: (patch: Partial<PricingProfile['worker']['peoneta']>) => void;
  onSave: () => void;
}) {
  if (loading) {
    return <p className="text-sm text-stone-400">Cargando perfil…</p>;
  }

  return (
    <div className="space-y-6">
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={profile.enabled}
          onChange={(e) => onProfileChange((p) => ({ ...p, enabled: e.target.checked }))}
          className="h-4 w-4 rounded border-stone-300 dark:border-stone-600 accent-primary-600"
        />
        <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
          Activar valorización automática
        </span>
      </label>

      <div>
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Cobro al cliente (fallback sin flujo)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <PricingProfileMoneyInput
            label="Base por ruta (CLP)"
            value={profile.client.basePerRoute}
            onChange={(n) => onPatchClient({ basePerRoute: n })}
          />
          <PricingProfileMoneyInput
            label="Por pedido entregado"
            value={profile.client.perDeliveredOrder}
            onChange={(n) => onPatchClient({ perDeliveredOrder: n })}
          />
          <PricingProfileMoneyInput
            label="Por bulto entregado"
            value={profile.client.perBultoDelivered}
            onChange={(n) => onPatchClient({ perBultoDelivered: n })}
          />
          <PricingProfileMoneyInput
            label="Por pedido rechazado"
            value={profile.client.perRejectedOrder}
            onChange={(n) => onPatchClient({ perRejectedOrder: n })}
          />
          <PricingProfileMoneyInput
            label="Por kilómetro"
            value={profile.client.perKm}
            onChange={(n) => onPatchClient({ perKm: n })}
            hint="Usa la distancia estimada de la ruta."
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Pago chofer
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <PricingProfileMoneyInput
            label="Fijo por chofer en ruta"
            value={profile.worker.driver.fixedPerRoute}
            onChange={(n) => onPatchDriver({ fixedPerRoute: n })}
          />
          <PricingProfileMoneyInput
            label="Por pedido entregado"
            value={profile.worker.driver.perDeliveredOrder}
            onChange={(n) => onPatchDriver({ perDeliveredOrder: n })}
          />
          <Input
            label="% del cobro al cliente"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step={1}
            value={profile.worker.driver.percentOfClientCharge}
            onChange={(e) =>
              onPatchDriver({
                percentOfClientCharge: Math.min(
                  100,
                  Math.max(0, Number(e.target.value) || 0),
                ),
              })
            }
          />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
          Pago peoneta
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PricingProfileMoneyInput
            label="Fijo por peoneta en ruta"
            value={profile.worker.peoneta.fixedPerRoute}
            onChange={(n) => onPatchPeoneta({ fixedPerRoute: n })}
          />
          <PricingProfileMoneyInput
            label="Por pedido entregado"
            value={profile.worker.peoneta.perDeliveredOrder}
            onChange={(n) => onPatchPeoneta({ perDeliveredOrder: n })}
          />
        </div>
      </div>

      <p className="text-xs text-stone-500 dark:text-stone-400">
        Versión del perfil: {profile.version}. Al guardar se incrementa la versión; las
        rutas ya valorizadas conservan el snapshot anterior.
      </p>

      {error ? (
        <p
          className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5"
          role="alert"
        >
          <AlertCircle size={14} aria-hidden />
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" loading={saving} onClick={onSave}>
          Guardar perfil
        </Button>
        {saved ? (
          <span
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400"
            role="status"
            aria-live="polite"
          >
            <Check size={16} aria-hidden />
            Perfil guardado
          </span>
        ) : null}
      </div>
    </div>
  );
}
