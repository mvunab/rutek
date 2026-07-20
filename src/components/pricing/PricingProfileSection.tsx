import { useEffect, useState } from 'react';
import {
  Calculator,
  Check,
  AlertCircle,
  ChevronDown,
  Lock,
  Unlock,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { api, ApiError } from '../../lib/api';
import {
  DEFAULT_PRICING_PROFILE,
  normalizePricingProfile,
} from '../../lib/pricingProfile';
import type { PricingProfile } from '../../types/pricing';
import { isValuationModuleEnabled } from '../../lib/valuationModule';
import { useAuthStore } from '../../store/useAuthStore';

function MoneyInput({
  label,
  value,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <Input
      label={label}
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
      hint={hint}
    />
  );
}

export function PricingProfileSection({ onSaved }: { onSaved?: () => void }) {
  const tenant = useAuthStore((s) => s.tenant);
  const valuationEnabled = isValuationModuleEnabled(tenant);
  const [profile, setProfile] = useState<PricingProfile>(DEFAULT_PRICING_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!valuationEnabled) {
      setLoading(false);
      return;
    }
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.get<{ pricing_profile?: unknown }>('/tenant/pricing-profile');
        setProfile(normalizePricingProfile(data.pricing_profile));
      } catch {
        setError('No se pudo cargar el perfil de valorización.');
      } finally {
        setLoading(false);
      }
    })();
  }, [valuationEnabled]);

  const patchClient = (patch: Partial<PricingProfile['client']>) =>
    setProfile((p) => ({ ...p, client: { ...p.client, ...patch } }));

  const patchDriver = (patch: Partial<PricingProfile['worker']['driver']>) =>
    setProfile((p) => ({
      ...p,
      worker: { ...p.worker, driver: { ...p.worker.driver, ...patch } },
    }));

  const patchPeoneta = (patch: Partial<PricingProfile['worker']['peoneta']>) =>
    setProfile((p) => ({
      ...p,
      worker: { ...p.worker, peoneta: { ...p.worker.peoneta, ...patch } },
    }));

  const handleUnlock = () => {
    const ok = window.confirm(
      'Tarifas del tenant es un ajuste sensible: afecta pagos de chofer/peoneta y el fallback de cobro para todos los clientes sin flujo propio.\n\n¿Desbloquear para editar?',
    );
    if (!ok) return;
    setUnlocked(true);
    setExpanded(true);
  };

  const handleLock = () => {
    setUnlocked(false);
    setExpanded(false);
    setSaved(false);
  };

  const toggleExpand = () => {
    if (!unlocked) {
      handleUnlock();
      return;
    }
    setExpanded((v) => !v);
  };

  const handleSave = async () => {
    if (!unlocked) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const data = await api.patch<{ pricing_profile?: unknown }>('/tenant/pricing-profile', {
        enabled: profile.enabled,
        client: profile.client,
        worker: profile.worker,
      });
      setProfile(normalizePricingProfile(data.pricing_profile));
      setSaved(true);
      onSaved?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  if (!valuationEnabled) return null;

  return (
    <Card padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <button
          type="button"
          onClick={toggleExpand}
          className="flex items-start gap-3 text-left min-w-0 flex-1 group"
          aria-expanded={expanded}
        >
          <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 shrink-0">
            <Calculator size={20} aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Tarifas del tenant
              </h2>
              <span
                className={clsx(
                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                  unlocked
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                    : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
                )}
              >
                {unlocked ? <Unlock size={11} aria-hidden /> : <Lock size={11} aria-hidden />}
                {unlocked ? 'Desbloqueado' : 'Protegido'}
              </span>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Ajuste avanzado: pagos a chofer/peoneta y cobro fallback sin flujo de cliente.
            </p>
          </div>
          <ChevronDown
            size={18}
            className={clsx(
              'shrink-0 mt-1 text-stone-400 transition-transform',
              expanded && 'rotate-180',
            )}
            aria-hidden
          />
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {unlocked ? (
            <Button type="button" size="sm" variant="secondary" onClick={handleLock}>
              <Lock size={14} aria-hidden />
              Bloquear
            </Button>
          ) : (
            <Button type="button" size="sm" variant="secondary" onClick={handleUnlock}>
              <Unlock size={14} aria-hidden />
              Desbloquear
            </Button>
          )}
        </div>
      </div>

      {expanded ? (
        <div className="mt-5 pt-5 border-t border-stone-200 dark:border-stone-800">
          {!unlocked ? (
            <p className="text-sm text-stone-500 dark:text-stone-400 flex items-center gap-2">
              <Lock size={14} aria-hidden />
              Desbloquea el bloque para ver y editar las tarifas.
            </p>
          ) : loading ? (
            <p className="text-sm text-stone-400">Cargando perfil…</p>
          ) : (
            <div className="space-y-6">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={profile.enabled}
                  onChange={(e) => setProfile((p) => ({ ...p, enabled: e.target.checked }))}
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
                  <MoneyInput
                    label="Base por ruta (CLP)"
                    value={profile.client.basePerRoute}
                    onChange={(n) => patchClient({ basePerRoute: n })}
                  />
                  <MoneyInput
                    label="Por pedido entregado"
                    value={profile.client.perDeliveredOrder}
                    onChange={(n) => patchClient({ perDeliveredOrder: n })}
                  />
                  <MoneyInput
                    label="Por bulto entregado"
                    value={profile.client.perBultoDelivered}
                    onChange={(n) => patchClient({ perBultoDelivered: n })}
                  />
                  <MoneyInput
                    label="Por pedido rechazado"
                    value={profile.client.perRejectedOrder}
                    onChange={(n) => patchClient({ perRejectedOrder: n })}
                  />
                  <MoneyInput
                    label="Por kilómetro"
                    value={profile.client.perKm}
                    onChange={(n) => patchClient({ perKm: n })}
                    hint="Usa la distancia estimada de la ruta."
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">
                  Pago chofer
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <MoneyInput
                    label="Fijo por chofer en ruta"
                    value={profile.worker.driver.fixedPerRoute}
                    onChange={(n) => patchDriver({ fixedPerRoute: n })}
                  />
                  <MoneyInput
                    label="Por pedido entregado"
                    value={profile.worker.driver.perDeliveredOrder}
                    onChange={(n) => patchDriver({ perDeliveredOrder: n })}
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
                      patchDriver({
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
                  <MoneyInput
                    label="Fijo por peoneta en ruta"
                    value={profile.worker.peoneta.fixedPerRoute}
                    onChange={(n) => patchPeoneta({ fixedPerRoute: n })}
                  />
                  <MoneyInput
                    label="Por pedido entregado"
                    value={profile.worker.peoneta.perDeliveredOrder}
                    onChange={(n) => patchPeoneta({ perDeliveredOrder: n })}
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
                <Button type="button" loading={saving} onClick={() => void handleSave()}>
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
          )}
        </div>
      ) : (
        <p className="mt-3 text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
          <Lock size={12} aria-hidden />
          Bloque colapsado. Usa Desbloquear para editar tarifas globales del tenant.
        </p>
      )}
    </Card>
  );
}
