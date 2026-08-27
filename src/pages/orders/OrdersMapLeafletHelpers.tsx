import { useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import type { Order } from '../../types';
import { SANTIAGO_CENTER } from './ordersMapConstants';

export function FitBounds({ points }: { points: LatLngExpression[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) {
      map.setView(SANTIAGO_CENTER, 11);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0]!, 14);
      return;
    }
    map.fitBounds(points as LatLngBoundsExpression, { padding: [40, 40], maxZoom: 14 });
  }, [map, points]);
  return null;
}

export function FlyToOrder({ order }: { order: Order | null }) {
  const map = useMap();
  const lat = order?.destination.coordinates?.lat;
  const lng = order?.destination.coordinates?.lng;
  useEffect(() => {
    if (lat == null || lng == null) return;
    map.flyTo([lat, lng], 15, { duration: 0.6 });
  }, [map, lat, lng]);
  return null;
}

export function FlyToDraft({ pin }: { pin: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!pin) return;
    map.flyTo([pin.lat, pin.lng], 16, { duration: 0.7 });
  }, [map, pin?.lat, pin?.lng]);
  return null;
}

export function MapClickToAdjustDraft({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
