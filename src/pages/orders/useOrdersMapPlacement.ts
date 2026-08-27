import { useCallback, useState } from 'react';
import { geocodeChilePlaces, type GeocodeResult } from '../../lib/geocode';
import {
  bestPlaceQuery,
  destinationLooksLikeReceiver,
  extractDiscardedNoise,
  extractReceiverHint,
  placeSimilarity,
  splitPlaceAndNoise,
  suggestPlaceQueries,
  type PlaceQuerySuggestion,
} from '../../lib/placeQuerySuggest';
import { useOrderStore } from '../../store/useOrderStore';
import type { Order } from '../../types';
import { SIMILARITY_THRESHOLD } from './ordersMapConstants';

export function useOrdersMapPlacement(
  selected: Order | null,
  needsPlacement: boolean,
  unmapped: Order[],
) {
  const { updateOrder } = useOrderStore();

  const [addressQuery, setAddressQuery] = useState('');
  const [querySuggestions, setQuerySuggestions] = useState<PlaceQuerySuggestion[]>([]);
  const [draftPin, setDraftPin] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodeLabel, setGeocodeLabel] = useState('');
  const [geocodeHits, setGeocodeHits] = useState<GeocodeResult[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [pinMsg, setPinMsg] = useState('');
  const [applyToSimilar, setApplyToSimilar] = useState(false);

  const similarUnmapped = (() => {
    if (!selected || !needsPlacement) return [] as Order[];
    const reference = addressQuery.trim() || bestPlaceQuery(selected);
    if (reference.length < 3) return [] as Order[];
    return unmapped.filter((o) => {
      if (o.id === selected.id) return false;
      const otherPlace = splitPlaceAndNoise(o.destination.street ?? '').place;
      if (!otherPlace || otherPlace.length < 3) return false;
      return placeSimilarity(reference, otherPlace) >= SIMILARITY_THRESHOLD;
    });
  })();

  const resetPlacement = useCallback((order: Order | null) => {
    setDraftPin(null);
    setGeocodeLabel('');
    setGeocodeHits([]);
    setPinMsg('');
    setGeocoding(false);
    setApplyToSimilar(true);
    if (order && !order.destination.coordinates) {
      const suggestions = suggestPlaceQueries(order);
      setQuerySuggestions(suggestions);
      setAddressQuery(bestPlaceQuery(order));
      const noise = extractDiscardedNoise(order);
      const receiver = extractReceiverHint(order);
      if (noise) {
        setPinMsg(
          `Se omitió texto irrelevante («${noise}»). Busca el lugar y confirma el pin.`,
        );
      } else if (destinationLooksLikeReceiver(order)) {
        setPinMsg(
          receiver
            ? `«${order.destination.street}» parece quien recibe (${receiver}), no la dirección. Usa la tienda o escribe el local.`
            : 'El destino parece nombre de quien recibe. Escribe el local o elige la tienda.',
        );
      } else if (suggestions[0]) {
        setPinMsg(`Listo para buscar «${suggestions[0].query}». Confirma el pin en el mapa.`);
      } else {
        setPinMsg('Escribe el lugar o dirección, búscala y confirma el pin.');
      }
    } else {
      setAddressQuery('');
      setQuerySuggestions([]);
    }
  }, []);

  const applyGeocodeHit = useCallback((hit: GeocodeResult) => {
    setDraftPin({ lat: hit.lat, lng: hit.lng });
    setGeocodeLabel(hit.displayName);
    setPinMsg('Revisa el pin en el mapa. Si está bien, confirma la ubicación.');
  }, []);

  const searchAddress = useCallback(async () => {
    if (!selected || !needsPlacement) return;
    const q = addressQuery.trim();
    if (q.length < 3) {
      setPinMsg('Escribe un lugar o dirección más completa (ej. Ripley Arauco Maipú).');
      return;
    }
    setGeocoding(true);
    setPinMsg('Buscando en el mapa…');
    setGeocodeHits([]);
    try {
      const results = await geocodeChilePlaces(q, 5);
      if (results.length === 0) {
        setDraftPin(null);
        setGeocodeLabel('');
        setPinMsg(
          'No encontramos ese lugar. Prueba otra sugerencia o «Marca + mall + comuna».',
        );
        return;
      }
      setGeocodeHits(results);
      applyGeocodeHit(results[0]!);
      if (results.length > 1) {
        setPinMsg(
          `Encontramos ${results.length} coincidencias. Elige la correcta abajo o confirma la primera.`,
        );
      }
    } catch {
      setPinMsg('No se pudo buscar. Intenta de nuevo.');
    } finally {
      setGeocoding(false);
    }
  }, [selected, needsPlacement, addressQuery, applyGeocodeHit]);

  const pinPersisted = useCallback((orderId: string) => {
    const row = useOrderStore.getState().orders.find((o) => o.id === orderId);
    return Boolean(row?.destination.coordinates);
  }, []);

  const confirmPin = useCallback(async () => {
    if (!selected || !draftPin) return;
    const bulkTargets = applyToSimilar ? similarUnmapped : [];
    setSavingPin(true);
    setPinMsg(
      bulkTargets.length > 0
        ? `Guardando ubicación en ${bulkTargets.length + 1} pedidos…`
        : 'Guardando ubicación…',
    );
    try {
      const street =
        addressQuery.trim() ||
        selected.destination.street ||
        geocodeLabel.split(',')[0]?.trim() ||
        selected.destination.street;
      await updateOrder(selected.id, {
        destination: {
          ...selected.destination,
          street: street || selected.destination.street,
          city: selected.destination.city || '',
          coordinates: { lat: draftPin.lat, lng: draftPin.lng },
        },
      });
      if (!pinPersisted(selected.id)) {
        setPinMsg('No se pudo guardar (sin conexión con el servidor). Intenta de nuevo.');
        return;
      }

      let bulkOk = 0;
      let bulkFail = 0;
      const bulkResults = await Promise.allSettled(
        bulkTargets.map(async (order) => {
          await updateOrder(order.id, {
            destination: {
              ...order.destination,
              city: order.destination.city || '',
              coordinates: { lat: draftPin.lat, lng: draftPin.lng },
            },
          });
          if (!pinPersisted(order.id)) {
            throw new Error('pin-not-persisted');
          }
        }),
      );
      for (const result of bulkResults) {
        if (result.status === 'fulfilled') bulkOk++;
        else bulkFail++;
      }

      setDraftPin(null);
      setGeocodeLabel('');
      setGeocodeHits([]);
      setQuerySuggestions([]);
      setAddressQuery('');
      if (bulkTargets.length === 0) {
        setPinMsg('Ubicación guardada.');
      } else if (bulkFail === 0) {
        setPinMsg(`Ubicación guardada en ${bulkOk + 1} pedidos con el mismo destino.`);
      } else {
        setPinMsg(
          `Ubicación guardada en ${bulkOk + 1} pedidos; ${bulkFail} fallaron. Reintenta con esos.`,
        );
      }
    } catch {
      setPinMsg('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSavingPin(false);
    }
  }, [
    selected,
    draftPin,
    addressQuery,
    geocodeLabel,
    updateOrder,
    applyToSimilar,
    similarUnmapped,
    pinPersisted,
  ]);

  const cancelDraft = useCallback(() => {
    setDraftPin(null);
    setGeocodeLabel('');
    setGeocodeHits([]);
    setPinMsg('Elige una sugerencia o edita la búsqueda, luego ubica y confirma.');
  }, []);

  const adjustDraftPin = useCallback((lat: number, lng: number) => {
    setDraftPin({ lat, lng });
    setPinMsg('Pin ajustado. Confirma la ubicación si está correcta.');
  }, []);

  const pickSuggestion = useCallback((query: string, reason: string) => {
    setAddressQuery(query);
    setPinMsg(reason);
  }, []);

  return {
    addressQuery,
    setAddressQuery,
    querySuggestions,
    draftPin,
    geocodeLabel,
    geocodeHits,
    geocoding,
    savingPin,
    pinMsg,
    applyToSimilar,
    setApplyToSimilar,
    similarUnmapped,
    resetPlacement,
    applyGeocodeHit,
    searchAddress,
    confirmPin,
    cancelDraft,
    adjustDraftPin,
    pickSuggestion,
  };
}
