import type { ExcelColumnMapping, ExcelFormatConfig } from '../types';

/** Normaliza claves snake_case del API a camelCase del editor. */
function normalizeColumns(raw: Record<string, unknown> | null | undefined): ExcelColumnMapping {
  if (!raw || typeof raw !== 'object') return {};
  const pick = (camel: keyof ExcelColumnMapping, snake: string) => {
    const v = raw[camel] ?? raw[snake];
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : parseInt(String(v), 10);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  return {
    clientName: pick('clientName', 'client_name'),
    entrega: pick('entrega', 'entrega'),
    numeroOC: pick('numeroOC', 'numero_oc'),
    factura: pick('factura', 'factura'),
    refFactura: pick('refFactura', 'ref_factura'),
    tipo: pick('tipo', 'tipo'),
    cajas: pick('cajas', 'cajas'),
    unidades: pick('unidades', 'unidades'),
  };
}

function normalizeCellPos(raw: unknown): { row: number; col: number } | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const row = typeof o.row === 'number' ? o.row : parseInt(String(o.row), 10);
  const col = typeof o.col === 'number' ? o.col : parseInt(String(o.col), 10);
  if (!Number.isFinite(row) || !Number.isFinite(col) || row < 0 || col < 0) return null;
  return { row, col };
}

/** Acepta respuesta cruda del API y devuelve `ExcelFormatConfig` consistente. */
export function normalizeExcelFormat(raw: Record<string, unknown>): ExcelFormatConfig {
  const headerRow =
    typeof raw.headerRow === 'number'
      ? raw.headerRow
      : typeof raw.header_row === 'number'
        ? raw.header_row
        : 0;
  const dataStartRow =
    typeof raw.dataStartRow === 'number'
      ? raw.dataStartRow
      : typeof raw.data_start_row === 'number'
        ? raw.data_start_row
        : headerRow + 1;

  const detectionRaw = raw.detection;
  let detection: ExcelFormatConfig['detection'] = null;
  if (detectionRaw && typeof detectionRaw === 'object') {
    const d = detectionRaw as Record<string, unknown>;
    const row = typeof d.row === 'number' ? d.row : parseInt(String(d.row), 10);
    const col = typeof d.col === 'number' ? d.col : parseInt(String(d.col), 10);
    const value = typeof d.value === 'string' ? d.value : String(d.value ?? '');
    if (Number.isFinite(row) && Number.isFinite(col) && value) {
      detection = { row, col, value };
    }
  }

  const metaRaw = raw.metadata;
  let metadata: ExcelFormatConfig['metadata'] = null;
  if (metaRaw && typeof metaRaw === 'object') {
    const m = metaRaw as Record<string, unknown>;
    metadata = {
      routeNumber: normalizeCellPos(m.routeNumber ?? m.route_number),
      date: normalizeCellPos(m.date),
      driver: normalizeCellPos(m.driver),
    };
  }

  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    active: Boolean(raw.active),
    headerRow,
    dataStartRow,
    detection,
    columns: normalizeColumns((raw.columns as Record<string, unknown>) ?? {}),
    metadata,
  };
}

export function normalizeExcelFormatsList(data: unknown): ExcelFormatConfig[] {
  if (!Array.isArray(data)) return [];
  const result: ExcelFormatConfig[] = [];
  for (const row of data) {
    if (row == null || typeof row !== 'object') continue;
    const f = normalizeExcelFormat(row);
    if (f.id && f.name) result.push(f);
  }
  return result;
}

/** Índice máximo de columna mapeada (para reconstruir selects sin Excel de muestra). */
export function maxMappedColumnIndex(columns: ExcelColumnMapping): number {
  const vals = Object.values(columns).filter(
    (v): v is number => typeof v === 'number' && v >= 0,
  );
  return vals.length ? Math.max(...vals) : -1;
}
