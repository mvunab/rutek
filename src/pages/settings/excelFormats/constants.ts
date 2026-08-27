import type { ExcelColumnMapping, ExcelFormatConfig } from '../../../types';

export const SYSTEM_FIELDS: { key: keyof ExcelColumnMapping; label: string; hint: string }[] = [
  { key: 'clientName', label: 'Destinatario / Tienda', hint: 'Ej. RIPLEY, FALABELLA…' },
  { key: 'entrega', label: 'Entrega / Local', hint: 'Descripción del punto de entrega' },
  { key: 'numeroOC', label: 'N° Documento / OC', hint: 'Código de documento u orden' },
  { key: 'factura', label: 'Factura / Cód. Tienda', hint: 'Número de factura o código interno' },
  { key: 'refFactura', label: 'Ref. Factura', hint: 'Referencia adicional de factura' },
  { key: 'tipo', label: 'Tipo de entrega', hint: 'G, N, etc.' },
  { key: 'cajas', label: 'Cajas / Bultos', hint: 'Número entero' },
  { key: 'unidades', label: 'Unidades', hint: 'Número entero' },
];

export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const colLetter = (idx: number) => LETTERS[idx] ?? String(idx);

export type RawHeadersResult = { rows: (string | null)[][]; sheetName: string };

export function emptyFormat(): Omit<ExcelFormatConfig, 'id'> {
  return {
    name: '',
    active: false,
    headerRow: 1,
    dataStartRow: 2,
    detection: null,
    columns: {},
    metadata: null,
  };
}
