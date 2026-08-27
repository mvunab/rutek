import { Link } from 'react-router-dom';
import {
  destinationLooksLikeReceiver,
  extractDiscardedNoise,
  extractReceiverHint,
} from '../../lib/placeQuerySuggest';
import type { Order } from '../../types';
import { OrderListItem } from './OrderListItem';
import { OrderPinPlacementForm } from './OrderPinPlacementForm';
import type { useOrdersMapPlacement } from './useOrdersMapPlacement';

type Placement = ReturnType<typeof useOrdersMapPlacement>;

export function OrdersMapSidebar({
  filtered,
  unmapped,
  withCoords,
  selected,
  selectedId,
  needsPlacement,
  placement,
  onSelect,
}: {
  filtered: Order[];
  unmapped: Order[];
  withCoords: Order[];
  selected: Order | null;
  selectedId: string | null;
  needsPlacement: boolean;
  placement: Placement;
  onSelect: (order: Order) => void;
}) {
  return (
    <aside className="rounded-xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900 overflow-hidden flex flex-col max-h-[min(70vh,640px)]">
      <div className="px-3 py-2.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-100">
          Pedidos
        </h2>
        <span className="text-xs text-stone-500 tabular-nums">{filtered.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-stone-500 text-center">Sin resultados</p>
        ) : (
          <>
            {unmapped.length > 0 ? (
              <div>
                <div className="sticky top-0 z-10 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-100 dark:border-amber-900/40">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
                    Sin ubicar ({unmapped.length})
                  </p>
                </div>
                <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                  {unmapped.map((o) => (
                    <OrderListItem
                      key={o.id}
                      order={o}
                      selected={selectedId === o.id}
                      onSelect={onSelect}
                    />
                  ))}
                </ul>
              </div>
            ) : null}
            {withCoords.length > 0 ? (
              <div>
                <div className="sticky top-0 z-10 px-3 py-1.5 bg-stone-50 dark:bg-stone-900/90 border-b border-stone-100 dark:border-stone-800">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                    En mapa ({withCoords.length})
                  </p>
                </div>
                <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                  {withCoords.map((o) => (
                    <OrderListItem
                      key={o.id}
                      order={o}
                      selected={selectedId === o.id}
                      onSelect={onSelect}
                    />
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
      {selected ? (
        <div className="border-t border-stone-200 dark:border-stone-800 px-3 py-3 text-xs space-y-2.5 bg-stone-50/80 dark:bg-stone-900/80 shrink-0">
          <div>
            <p className="font-medium text-stone-800 dark:text-stone-100">
              Seleccionado: <span className="font-mono">{selected.code}</span>
            </p>
            <p className="text-stone-500 mt-0.5">
              {selected.destination.street || 'Sin calle'}, {selected.destination.city || '—'}
            </p>
            {needsPlacement && (destinationLooksLikeReceiver(selected) || extractDiscardedNoise(selected)) ? (
              <p
                className="text-[11px] text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-md px-2 py-1.5 mt-1.5"
                role="status"
              >
                {(() => {
                  const noise = extractDiscardedNoise(selected);
                  if (noise) {
                    return (
                      <>
                        Texto omitido del destino: <strong>{noise}</strong> (quién recibe). Se
                        usa solo el lugar para el mapa.
                      </>
                    );
                  }
                  const who = extractReceiverHint(selected);
                  return (
                    <>
                      Destino raro: parece «quién recibe»
                      {who ? ` (${who})` : ''}, no el local.
                    </>
                  );
                })()}
              </p>
            ) : null}
          </div>

          {needsPlacement ? (
            <OrderPinPlacementForm
              similarUnmapped={placement.similarUnmapped}
              querySuggestions={placement.querySuggestions}
              addressQuery={placement.addressQuery}
              onAddressQueryChange={placement.setAddressQuery}
              draftPin={placement.draftPin}
              geocodeHits={placement.geocodeHits}
              geocodeLabel={placement.geocodeLabel}
              geocoding={placement.geocoding}
              savingPin={placement.savingPin}
              applyToSimilar={placement.applyToSimilar}
              onApplyToSimilarChange={placement.setApplyToSimilar}
              onSuggestionPick={placement.pickSuggestion}
              onSearch={placement.searchAddress}
              onGeocodeHitPick={placement.applyGeocodeHit}
              onConfirm={placement.confirmPin}
              onCancelDraft={placement.cancelDraft}
            />
          ) : null}

          {placement.pinMsg ? (
            <p className="text-stone-600 dark:text-stone-300" role="status">
              {placement.pinMsg}
            </p>
          ) : null}
          {selected.routeId ? (
            <Link
              to="/rutas"
              className="text-primary-700 dark:text-primary-300 underline block cursor-pointer"
            >
              Ver en rutas
            </Link>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
