import { useCallback, useEffect, useState } from 'react';
import { Calculator, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { api, ApiError } from '../../lib/api';
import { formatCLP, normalizeRouteValuation } from '../../lib/pricingProfile';
import { VALUATION_MODULE_ENABLED } from '../../lib/valuationModule';
import type { RouteValuation } from '../../types/pricing';

export function RouteValuationPanel({
  routeId,
  canManage,
  refreshKey,
}: {
  routeId: string;
  canManage: boolean;
  /** Incrementar para recargar tras cambios en pedidos. */
  refreshKey?: number;
}) {
  const [valuation, setValuation] = useState<RouteValuation | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!VALUATION_MODULE_ENABLED) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Record<string, unknown>>(`/routes/${routeId}/valuation`);
      const normalized = normalizeRouteValuation(data);
      if (normalized.enabled === false) {
        setValuation(null);
      } else {
        setValuation(normalized);
      }
    } catch (err) {
      setValuation(null);
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar la valorización.');
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    if (!VALUATION_MODULE_ENABLED) {
      setLoading(false);
      return;
    }
    void load();
  }, [load, refreshKey]);

  if (!VALUATION_MODULE_ENABLED) return null;

  const handleCompute = async () => {
    setComputing(true);
    setError('');
    try {
      const data = await api.post<Record<string, unknown>>(
        `/routes/${routeId}/valuation/compute`,
        {},
      );
      setValuation(normalizeRouteValuation(data));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo calcular.');
    } finally {
      setComputing(false);
    }
  };

  if (loading) {
    return (
      <p className="text-xs text-stone-500 dark:text-stone-400 py-2" role="status">
        Calculando valorización…
      </p>
    );
  }

  if (!valuation) {
    if (error) {
      return <p className="text-xs text-stone-500 dark:text-stone-400">{error}</p>;
    }
    return (
      <p className="text-xs text-stone-500 dark:text-stone-400">
        Valorización desactivada. Actívala en Configuración → Valorización de rutas.
      </p>
    );
  }

  const clientLines = valuation.breakdown.filter((l) => l.side === 'client');
  const workerLines = valuation.breakdown.filter((l) => l.side === 'worker');

  return (
    <div className="rounded-xl border border-violet-200/80 dark:border-violet-900/50 bg-violet-50/40 dark:bg-violet-950/20 px-3 py-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Calculator size={16} className="text-violet-600 dark:text-violet-400 shrink-0" aria-hidden />
          <div>
            <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Valorización
            </h4>
            {valuation.preview ? (
              <p className="text-[11px] text-amber-700 dark:text-amber-400">Vista previa</p>
            ) : (
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Perfil v{valuation.profileVersion}
              </p>
            )}
          </div>
        </div>
        {canManage ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} aria-hidden />}
            loading={computing}
            onClick={() => void handleCompute()}
          >
            {valuation.preview ? 'Guardar' : 'Recalcular'}
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <ValuationStat label="Cobro cliente" amount={valuation.clientCharge} tone="client" />
        <ValuationStat label="Pago equipo" amount={valuation.workerPayTotal} tone="worker" />
        <ValuationStat
          label="Margen"
          amount={valuation.margin}
          tone={valuation.margin >= 0 ? 'margin' : 'negative'}
        />
      </div>

      {(valuation.driverPay > 0 || valuation.peonetaPay > 0) && (
        <p className="text-[11px] text-stone-600 dark:text-stone-400 tabular-nums">
          Chofer {formatCLP(valuation.driverPay)}
          {valuation.peonetaPay > 0 ? ` · Peoneta ${formatCLP(valuation.peonetaPay)}` : ''}
        </p>
      )}

      {valuation.stats ? (
        <p className="text-[10px] text-stone-500 dark:text-stone-400 tabular-nums">
          {valuation.stats.deliveredCount}/{valuation.stats.orderCount} entregados ·{' '}
          {valuation.stats.bultosDelivered} bultos
          {valuation.stats.km > 0 ? ` · ${valuation.stats.km} km` : ''}
        </p>
      ) : null}

      {clientLines.length > 0 || workerLines.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-violet-200/60 dark:border-violet-900/40">
          {clientLines.length > 0 ? (
            <BreakdownList title="Cobro" lines={clientLines} />
          ) : null}
          {workerLines.length > 0 ? (
            <BreakdownList title="Pago" lines={workerLines} />
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ValuationStat({
  label,
  amount,
  tone,
}: {
  label: string;
  amount: number;
  tone: 'client' | 'worker' | 'margin' | 'negative';
}) {
  return (
    <div
      className={clsx(
        'rounded-lg px-2 py-1.5 border',
        tone === 'client' && 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50',
        tone === 'worker' && 'bg-stone-100/90 dark:bg-stone-900/50 border-stone-200 dark:border-stone-700',
        tone === 'margin' && 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50',
        tone === 'negative' && 'bg-red-50/80 dark:bg-red-950/30 border-red-100 dark:border-red-900/50',
      )}
    >
      <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400">{label}</p>
      <p className="text-sm font-bold tabular-nums text-stone-900 dark:text-stone-50">
        {formatCLP(amount)}
      </p>
    </div>
  );
}

function BreakdownList({
  title,
  lines,
}: {
  title: string;
  lines: RouteValuation['breakdown'];
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 mb-1">
        {title}
      </p>
      <ul className="space-y-0.5">
        {lines.map((line, i) => (
          <li
            key={`${line.label}-${i}`}
            className="flex justify-between gap-2 text-[11px] text-stone-600 dark:text-stone-300"
          >
            <span className="truncate">{line.label}</span>
            <span className="font-medium tabular-nums shrink-0">{formatCLP(line.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
