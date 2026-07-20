import type { Order } from '../types';

/**
 * Destinos de importación poco claros.
 *
 * Ejemplo:
 *   "Ripley arauco maipo - entrega fernando"
 *   → lugar: "Ripley Arauco Maipú"
 *   → ruido: "entrega fernando" (quién recibe, irrelevante para el mapa)
 *
 * Una sola consulta limpia (a lo más un fallback de tienda), no un listado largo.
 */

const CODE_NOISE =
  /\b(?:IMP|PED|ORD|RUTA|RT|GUIA|GUÍA|DESPACHO)[-\s.]?\d+[A-Z]?\b/gi;

const ONLY_CODE = /^(?:IMP|PED|ORD|RT)[-\s.]?\d+[A-Z]?$/i;

/** Comunas / topónimos frecuentes mal escritos en Excel. */
const PLACE_FIXES: Record<string, string> = {
  MAIPU: 'Maipú',
  MAIPO: 'Maipú',
  NUNOA: 'Ñuñoa',
  PENAFLOR: 'Peñaflor',
  PENALOLEN: 'Peñalolén',
  CONCEPCION: 'Concepción',
  VINA: 'Viña',
  'VINA DEL MAR': 'Viña del Mar',
  VALPARAISO: 'Valparaíso',
  CURICO: 'Curicó',
  MACHALI: 'Machalí',
  RENACA: 'Reñaca',
  CHILLAN: 'Chillán',
  TEMUCO: 'Temuco',
  PUCON: 'Pucón',
  CONCON: 'Concón',
  SANJOAQUIN: 'San Joaquín',
  'SAN JOAQUIN': 'San Joaquín',
  'LA REINA': 'La Reina',
  'LAS CONDES': 'Las Condes',
  PROVIDENCIA: 'Providencia',
  RECOLETA: 'Recoleta',
  INDEPENDENCIA: 'Independencia',
  ESTACION: 'Estación',
  'ESTACION CENTRAL': 'Estación Central',
  'PUERTO MONTT': 'Puerto Montt',
  'LOS ANGELES': 'Los Ángeles',
};

const STREET_HINT =
  /\b(?:av\.?|avenida|calle|pasaje|psje\.?|camino|ruta\s+\d+|km\.?\s*\d+)\b/i;

const PLACE_HINT =
  /\b(ripley|falabella|paris|jumbo|lider|líder|easy|sodimara|hites|abcdin|mall|arauco|costanera|parque|outlet|plaza|tienda|local|sucursal)\b/i;

const RECEIVER_PREFIX =
  /^(?:entrega|recibe|receptor|receptora|atiende|retir[ao]|sr\.?|sra\.?|srta\.?|don|doña|dña\.?)\b/i;

/** Tramo final tipo "… entrega fernando" sin separador. */
const INLINE_RECEIVER_TAIL =
  /\s+\b((?:entrega|recibe|receptor|receptora|atiende|retir[ao])\b[\s:]*[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.'\-]*(?:\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.'\-]+){0,2})\s*$/i;

export type PlaceQuerySuggestion = {
  query: string;
  reason: string;
  score: number;
  kind: 'poi' | 'address' | 'hybrid';
};

export type PlaceParseResult = {
  /** Texto limpio para buscar en el mapa. */
  place: string;
  /** Texto descartado (quién recibe, etc.). */
  noise: string | null;
};

function collapseSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

function stripNoise(raw: string): string {
  return collapseSpaces(
    raw
      .replace(CODE_NOISE, ' ')
      .replace(/[_/|]+/g, ' ')
      .replace(/\s*[,;]+\s*/g, ', ')
      .replace(/^[,.\-\s]+|[,.\-\s]+$/g, ''),
  );
}

function titleCaseWord(word: string): string {
  if (!word) return word;
  if (word.length <= 3) {
    const lower = word.toLowerCase();
    if (['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e'].includes(lower)) {
      return lower;
    }
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function humanizePlace(raw: string): string {
  const stripped = stripNoise(raw);
  if (!stripped) return '';

  let s = stripped.toUpperCase();
  const keys = Object.keys(PLACE_FIXES).sort((a, b) => b.length - a.length);
  for (const key of keys) {
    const re = new RegExp(`\\b${key.replace(/\s+/g, '\\s+')}\\b`, 'g');
    s = s.replace(re, PLACE_FIXES[key]!);
  }

  return collapseSpaces(
    s
      .split(/\s+/)
      .map((w) => (/[a-záéíóúñ]/.test(w) ? w : titleCaseWord(w)))
      .join(' '),
  );
}

/** ¿El fragmento entero parece “quién recibe”? */
export function looksLikeReceiverLabel(raw: string): boolean {
  const t = collapseSpaces(raw);
  if (!t) return false;
  if (PLACE_HINT.test(t) || STREET_HINT.test(t)) return false;
  if (/\d{2,}/.test(t)) return false;
  if (RECEIVER_PREFIX.test(t)) return true;

  const words = t.split(/\s+/);
  if (words.length >= 2 && words.length <= 3) {
    const onlyNames = words.every((w) => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ.'-]+$/.test(w));
    if (onlyNames && !PLACE_HINT.test(t)) return true;
  }
  return false;
}

/**
 * Separa lugar buscable vs texto irrelevante.
 *
 * "Ripley arauco maipo - entrega fernando"
 *   → place: Ripley Arauco Maipú, noise: entrega fernando
 */
export function splitPlaceAndNoise(raw: string): PlaceParseResult {
  const t = collapseSpaces(raw);
  if (!t) return { place: '', noise: null };

  // 1) Separadores: "lugar - entrega fernando"
  const parts = t
    .split(/\s*[-–—|/·;]\s*/)
    .map((p) => collapseSpaces(p))
    .filter(Boolean);

  if (parts.length >= 2) {
    const placeParts: string[] = [];
    const noiseParts: string[] = [];
    for (const p of parts) {
      if (looksLikeReceiverLabel(p)) noiseParts.push(p);
      else placeParts.push(p);
    }
    if (placeParts.length > 0) {
      return {
        place: humanizePlace(placeParts.join(' ')),
        noise: noiseParts.length ? collapseSpaces(noiseParts.join(' · ')) : null,
      };
    }
    if (noiseParts.length > 0) {
      return { place: '', noise: collapseSpaces(noiseParts.join(' · ')) };
    }
  }

  // 2) Mismo string sin guión: "RIPLEY ARAUCO MAIPU ENTREGA FERNANDO"
  const inline = t.match(INLINE_RECEIVER_TAIL);
  if (inline && inline.index != null && inline.index > 0) {
    const head = collapseSpaces(t.slice(0, inline.index));
    const tail = collapseSpaces(inline[1] ?? '');
    if (head && (PLACE_HINT.test(head) || STREET_HINT.test(head) || head.split(/\s+/).length >= 2)) {
      return { place: humanizePlace(head), noise: tail || null };
    }
  }

  // 3) Solo receptor
  if (looksLikeReceiverLabel(t)) {
    return { place: '', noise: t };
  }

  return { place: humanizePlace(t), noise: null };
}

export function destinationLooksLikeReceiver(order: Order): boolean {
  const parsed = splitPlaceAndNoise(order.destination.street ?? '');
  return !parsed.place && Boolean(parsed.noise);
}

/** Ruido detectado en el destino (para UI). */
export function extractDiscardedNoise(order: Order): string | null {
  return splitPlaceAndNoise(order.destination.street ?? '').noise;
}

export function extractReceiverHint(order: Order): string | null {
  const noise = extractDiscardedNoise(order);
  if (noise) {
    const name = collapseSpaces(noise.replace(RECEIVER_PREFIX, ''));
    if (name) return humanizePlace(name);
  }
  const notes = order.notes ?? '';
  const m = notes.match(/Receptor:\s*([^·|]+)/i);
  if (m?.[1]?.trim()) return collapseSpaces(m[1]);
  return null;
}

function placeKind(text: string): PlaceQuerySuggestion['kind'] {
  if (STREET_HINT.test(text)) return 'hybrid';
  if (PLACE_HINT.test(text)) return 'poi';
  return 'poi';
}

/**
 * Como máximo 1–2 sugerencias: el lugar limpio, y solo si falta, la tienda.
 */
export function suggestPlaceQueries(order: Order): PlaceQuerySuggestion[] {
  const clientRaw = order.clientName?.trim() ?? '';
  const client =
    clientRaw && !clientRaw.startsWith('__') ? humanizePlace(clientRaw) : '';
  const city = humanizePlace(order.destination.city?.trim() ?? '');

  const parsed = splitPlaceAndNoise(order.destination.street ?? '');
  const out: PlaceQuerySuggestion[] = [];

  if (parsed.place && !ONLY_CODE.test(parsed.place)) {
    let query = parsed.place;
    if (city && !query.toLowerCase().includes(city.toLowerCase())) {
      // Solo añade ciudad si el lugar no la trae ya (Maipú, etc.)
      const cityAlreadyInPlace = PLACE_FIXES[city.toUpperCase()]
        ? query.toLowerCase().includes(humanizePlace(city).toLowerCase())
        : false;
      if (!cityAlreadyInPlace && query.split(/\s+/).length <= 2) {
        query = `${query}, ${city}`;
      }
    }
    out.push({
      query,
      reason: parsed.noise
        ? `Lugar (se omitió «${parsed.noise}»)`
        : 'Lugar del destino',
      score: 95,
      kind: placeKind(query),
    });
    return out;
  }

  // Sin lugar usable → tienda/cliente como única pista
  if (client) {
    out.push({
      query: client,
      reason: parsed.noise
        ? `Tienda (destino era «${parsed.noise}», no un lugar)`
        : 'Tienda / cliente',
      score: 70,
      kind: 'poi',
    });
  }

  return out;
}

/** Query única para el input del mapa. */
export function bestPlaceQuery(order: Order): string {
  const list = suggestPlaceQueries(order);
  if (list[0]) return list[0].query;
  return '';
}

// ─── Similitud entre lugares (agrupar pedidos al mismo destino) ─────────────

function normalizeForMatch(s: string): string[] {
  return collapseSpaces(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2);
}

function tokenClose(a: string, b: string): boolean {
  if (a === b) return true;
  // Tolerancia a typos leves: maipu/maipo, arauko/arauco
  if (Math.abs(a.length - b.length) > 1) return false;
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  let diffs = 0;
  let i = 0;
  let j = 0;
  while (i < shorter.length && j < longer.length) {
    if (shorter[i] === longer[j]) {
      i++;
      j++;
      continue;
    }
    diffs++;
    if (diffs > 1) return false;
    if (shorter.length === longer.length) i++;
    j++;
  }
  return diffs + (longer.length - j) <= 1;
}

/**
 * Similitud 0–1 entre dos textos de lugar (coeficiente de Dice sobre tokens,
 * con tolerancia a 1 typo por palabra). "Ripley Arauco Maipú" vs
 * "RIPLEY ARAUCO MAIPO - entrega fernando" (ya limpiado) → 1.0.
 */
export function placeSimilarity(a: string, b: string): number {
  const ta = normalizeForMatch(a);
  const tb = normalizeForMatch(b);
  if (ta.length === 0 || tb.length === 0) return 0;

  const used = new Set<number>();
  let matches = 0;
  for (const wa of ta) {
    for (let k = 0; k < tb.length; k++) {
      if (used.has(k)) continue;
      if (tokenClose(wa, tb[k]!)) {
        used.add(k);
        matches++;
        break;
      }
    }
  }
  return (2 * matches) / (ta.length + tb.length);
}
