/**
 * Geocodificación vía Nominatim (OpenStreetMap).
 * Uso razonable: 1 req/s.
 */

export type GeocodeResult = {
  lat: number;
  lng: number;
  displayName: string;
  street?: string;
  city?: string;
  region?: string;
};

type NominatimItem = {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    pedestrian?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    region?: string;
  };
};

function buildStreet(addr: NominatimItem['address']): string | undefined {
  if (!addr) return undefined;
  const road = addr.road || addr.pedestrian;
  if (!road) return undefined;
  return addr.house_number ? `${road} ${addr.house_number}` : road;
}

function buildCity(addr: NominatimItem['address']): string | undefined {
  if (!addr) return undefined;
  return addr.city || addr.town || addr.village || addr.municipality;
}

function mapItem(item: NominatimItem): GeocodeResult | null {
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat,
    lng,
    displayName: item.display_name,
    street: buildStreet(item.address),
    city: buildCity(item.address),
    region: item.address?.state || item.address?.region,
  };
}

async function nominatimSearch(
  query: string,
  limit: number,
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const params = new URLSearchParams({
    q,
    format: 'json',
    addressdetails: '1',
    limit: String(limit),
    countrycodes: 'cl',
  });

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Geocoding failed (${res.status})`);
  }

  const data = (await res.json()) as NominatimItem[];
  return data.map(mapItem).filter((x): x is GeocodeResult => Boolean(x));
}

/**
 * Varias coincidencias (útil para "Ripley Arauco Maipú" vs homónimos).
 * Si la query parece POI, también prueba variantes con ", Chile".
 */
export async function geocodeChilePlaces(
  query: string,
  limit = 5,
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const primary = await nominatimSearch(q, limit);
  if (primary.length > 0) return primary;

  // Segunda pasada: forzar contexto Chile si no venía
  if (!/,?\s*chile\s*$/i.test(q)) {
    return nominatimSearch(`${q}, Chile`, limit);
  }
  return [];
}
