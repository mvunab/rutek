import { CheckCircle2, MapPin, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import type { GeocodeResult } from '../../lib/geocode';
import type { PlaceQuerySuggestion } from '../../lib/placeQuerySuggest';
import type { Order } from '../../types';

export function OrderPinPlacementForm({
  similarUnmapped,
  querySuggestions,
  addressQuery,
  onAddressQueryChange,
  draftPin,
  geocodeHits,
  geocodeLabel,
  geocoding,
  savingPin,
  applyToSimilar,
  onApplyToSimilarChange,
  onSuggestionPick,
  onSearch,
  onGeocodeHitPick,
  onConfirm,
  onCancelDraft,
}: {
  similarUnmapped: Order[];
  querySuggestions: PlaceQuerySuggestion[];
  addressQuery: string;
  onAddressQueryChange: (value: string) => void;
  draftPin: { lat: number; lng: number } | null;
  geocodeHits: GeocodeResult[];
  geocodeLabel: string;
  geocoding: boolean;
  savingPin: boolean;
  applyToSimilar: boolean;
  onApplyToSimilarChange: (value: boolean) => void;
  onSuggestionPick: (query: string, reason: string) => void;
  onSearch: () => void;
  onGeocodeHitPick: (hit: GeocodeResult) => void;
  onConfirm: () => void;
  onCancelDraft: () => void;
}) {
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        void onSearch();
      }}
    >
      {!draftPin && similarUnmapped.length > 0 ? (
        <p className="text-[11px] leading-snug text-primary-800 dark:text-primary-200 bg-primary-50/80 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 rounded-md px-2 py-1.5">
          Hay {similarUnmapped.length} pedido
          {similarUnmapped.length !== 1 ? 's' : ''} más sin pin con este mismo lugar.
          Busca una vez y podrás confirmar la ubicación para todos.
        </p>
      ) : null}

      {querySuggestions.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
            Lugar detectado
          </p>
          <div className="flex flex-wrap gap-1.5">
            {querySuggestions.slice(0, 2).map((s) => (
              <button
                key={s.query}
                type="button"
                disabled={geocoding || savingPin}
                title={s.reason}
                onClick={() => onSuggestionPick(s.query, s.reason)}
                className={clsx(
                  'max-w-full truncate rounded-md border px-2 py-1 text-[11px] cursor-pointer transition-colors duration-200',
                  addressQuery.trim().toLowerCase() === s.query.trim().toLowerCase()
                    ? 'border-primary-400 bg-primary-50 text-primary-900 dark:bg-primary-950/40 dark:text-primary-100 dark:border-primary-700'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-200 dark:hover:bg-stone-800',
                )}
              >
                <MapPin
                  size={10}
                  className="inline -mt-0.5 mr-0.5 opacity-70"
                  aria-hidden
                />
                {s.query}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <label className="block space-y-1">
        <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
          Lugar o dirección a ubicar
        </span>
        <textarea
          value={addressQuery}
          onChange={(e) => onAddressQueryChange(e.target.value)}
          rows={2}
          placeholder="Ej. Ripley Arauco Maipú"
          disabled={geocoding || savingPin}
          className="w-full rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 px-2.5 py-2 text-xs text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 resize-y min-h-[56px]"
        />
      </label>
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        fullWidth
        loading={geocoding}
        disabled={savingPin || addressQuery.trim().length < 3}
        icon={<Search size={14} aria-hidden />}
      >
        Buscar en el mapa
      </Button>

      {geocodeHits.length > 1 ? (
        <ul className="space-y-1 max-h-28 overflow-y-auto">
          {geocodeHits.map((hit) => {
            const active =
              draftPin?.lat === hit.lat && draftPin?.lng === hit.lng;
            return (
              <li key={`${hit.lat},${hit.lng},${hit.displayName}`}>
                <button
                  type="button"
                  disabled={geocoding || savingPin}
                  onClick={() => onGeocodeHitPick(hit)}
                  className={clsx(
                    'w-full text-left rounded-md border px-2 py-1.5 text-[11px] cursor-pointer transition-colors duration-200',
                    active
                      ? 'border-amber-400 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100'
                      : 'border-stone-200 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-950 dark:hover:bg-stone-800',
                  )}
                >
                  {hit.displayName}
                </button>
              </li>
            );
          })}
        </ul>
      ) : geocodeLabel ? (
        <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-snug">
          Encontrado: {geocodeLabel}
        </p>
      ) : null}

      {draftPin && similarUnmapped.length > 0 ? (
        <div
          className="rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/80 dark:bg-primary-950/40 px-2.5 py-2 space-y-1.5"
          role="status"
        >
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToSimilar}
              disabled={savingPin || geocoding}
              onChange={(e) => onApplyToSimilarChange(e.target.checked)}
              className="mt-0.5 accent-primary-600 cursor-pointer"
            />
            <span className="text-[11px] leading-snug text-primary-900 dark:text-primary-100">
              <strong>
                {similarUnmapped.length} pedido
                {similarUnmapped.length !== 1 ? 's' : ''} más
              </strong>{' '}
              sin pin apunta{similarUnmapped.length !== 1 ? 'n' : ''} al mismo lugar
              (coincidencia ≥80%). Asignarles esta misma ubicación.
            </span>
          </label>
          <ul className="pl-5 space-y-0.5">
            {similarUnmapped.slice(0, 4).map((o) => (
              <li
                key={o.id}
                className="text-[11px] text-primary-800/80 dark:text-primary-200/80 truncate"
              >
                <span className="font-mono font-semibold">{o.code}</span>
                {' · '}
                {o.destination.street || 'sin calle'}
              </li>
            ))}
            {similarUnmapped.length > 4 ? (
              <li className="text-[11px] text-primary-800/70 dark:text-primary-200/70">
                +{similarUnmapped.length - 4} más
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {draftPin ? (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="primary"
            fullWidth
            loading={savingPin}
            disabled={geocoding}
            onClick={() => void onConfirm()}
            icon={<CheckCircle2 size={14} aria-hidden />}
          >
            {applyToSimilar && similarUnmapped.length > 0
              ? `Confirmar en ${similarUnmapped.length + 1} pedidos`
              : 'Confirmar ubicación'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={geocoding || savingPin}
            onClick={onCancelDraft}
          >
            Limpiar
          </Button>
        </div>
      ) : null}
    </form>
  );
}
