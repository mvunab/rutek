import { XCircle } from 'lucide-react';
import { TRACKING_BRAND } from '../../lib/trackingTheme';
import type { RouteProgressSnapshot } from '../../lib/routeTrackingReport';

const BX_BLUE = TRACKING_BRAND.blue;
const BX_LIGHT = TRACKING_BRAND.light;

interface RouteProgressWayProps {
  progress: RouteProgressSnapshot;
}

export function RouteProgressWay({ progress }: RouteProgressWayProps) {
  const { steps, activeIndex, allCancelled, headline, deliveryPct, total, delivered, inTransit } =
    progress;

  if (allCancelled) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-8 text-center">
        <XCircle className="size-12 text-red-500 mx-auto mb-3" aria-hidden />
        <p className="font-extrabold text-red-900">{headline.title}</p>
        <p className="text-sm text-red-700 mt-2 max-w-md mx-auto">{headline.subtitle}</p>
      </div>
    );
  }

  const lastIdx = steps.length - 1;

  return (
    <div className="space-y-4">
      <div className="w-full overflow-x-auto py-2">
        <ul
          className="flex min-w-[560px] w-full items-start justify-between gap-0 list-none m-0 p-0"
          role="list"
          aria-label="Avance de la ruta"
        >
          {steps.map((step, i) => {
            const done = activeIndex >= 0 && i <= activeIndex;
            const current = activeIndex >= 0 && i === activeIndex;
            const Icon = step.icon;

            return (
              <li
                key={step.id}
                className="flex flex-1 flex-col items-center min-w-0 relative"
                role="listitem"
                aria-current={current ? 'step' : undefined}
              >
                {i > 0 && (
                  <span
                    className="absolute top-[25px] right-1/2 w-full h-[3px] -z-0"
                    style={{ background: done ? BX_BLUE : BX_LIGHT }}
                    aria-hidden
                  />
                )}
                <div
                  className="relative z-10 flex size-[50px] shrink-0 items-center justify-center rounded-full transition-colors"
                  style={{
                    background: current ? BX_BLUE : done ? BX_LIGHT : '#fff',
                    border: `2px solid ${done || current ? BX_BLUE : BX_LIGHT}`,
                  }}
                >
                  <Icon
                    className="size-6"
                    style={{ color: current ? '#fff' : BX_BLUE }}
                    aria-hidden
                  />
                  {step.orderCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold tabular-nums text-white"
                      style={{ background: current ? '#1d4ed8' : BX_BLUE }}
                      aria-label={`${step.orderCount} pedidos en ${step.label}`}
                    >
                      {step.orderCount}
                    </span>
                  )}
                </div>
                <p
                  className="mt-2 text-center text-xs sm:text-sm font-extrabold leading-tight px-1"
                  style={{ color: current ? BX_BLUE : done ? '#1a1a1a' : '#9ca3af' }}
                >
                  {step.label}
                </p>
                {step.orderCount > 0 && (
                  <p className="mt-0.5 text-[10px] font-semibold text-stone-500 tabular-nums">
                    {step.orderCount} ped.
                  </p>
                )}
                {current && i === lastIdx && (
                  <p className="mt-1 text-center text-xs font-normal text-stone-600 max-w-[160px] leading-snug px-1 hidden sm:block">
                    {headline.subtitle}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl px-4 py-3" style={{ background: TRACKING_BRAND.dew }}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-sm font-bold text-stone-800">{headline.title}</p>
          <p className="text-xs font-bold tabular-nums" style={{ color: BX_BLUE }}>
            {deliveryPct}% entregados
          </p>
        </div>
        <div
          className="h-2.5 rounded-full overflow-hidden bg-white/80"
          role="progressbar"
          aria-valuenow={deliveryPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${delivered} de ${total} pedidos entregados`}
        >
          <div
            className="h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${deliveryPct}%`, background: BX_BLUE }}
          />
        </div>
        <p className="mt-2 text-xs text-stone-600">{headline.subtitle}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-stone-600">
          <span className="tabular-nums">
            <span className="text-stone-400 font-medium">Total:</span> {total}
          </span>
          <span className="tabular-nums">
            <span className="text-emerald-600 font-medium">Entregados:</span> {delivered}
          </span>
          <span className="tabular-nums">
            <span className="text-violet-600 font-medium">En ruta:</span> {inTransit}
          </span>
          <span className="tabular-nums">
            <span className="text-amber-600 font-medium">Pendientes:</span>{' '}
            {progress.pending + progress.confirmed}
          </span>
        </div>
      </div>
    </div>
  );
}
