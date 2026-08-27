import { useEffect, useState } from 'react';
import {
  Calculator,
  ChevronDown,
  Lock,
  Unlock,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { api, ApiError } from '../../lib/api';
import {
  DEFAULT_PRICING_PROFILE,
  normalizePricingProfile,
} from '../../lib/pricingProfile';
import type { PricingProfile } from '../../types/pricing';
import { isValuationModuleEnabled } from '../../lib/valuationModule';
import { useAuthStore } from '../../store/useAuthStore';
import { PricingProfileForm } from './PricingProfileForm';

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
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.get<{ pricing_profile?: unknown }>('/tenant/pricing-profile');
        if (cancelled) return;
        setProfile(normalizePricingProfile(data.pricing_profile));
      } catch {
        if (cancelled) return;
        setError('No se pudo cargar el perfil de valorización.');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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
          ) : (
            <PricingProfileForm
              profile={profile}
              loading={loading}
              saving={saving}
              error={error}
              saved={saved}
              onProfileChange={setProfile}
              onPatchClient={patchClient}
              onPatchDriver={patchDriver}
              onPatchPeoneta={patchPeoneta}
              onSave={() => void handleSave()}
            />
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
