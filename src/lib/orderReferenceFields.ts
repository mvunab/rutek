export type OrderReferenceFields = {
  numeroOc: string;
  factura: string;
  referencia: string;
};

const OC_RE = /(?:^|\s·\s)OC:\s*(.+?)(?=\s·\s|$)/i;
const FACTURA_RE = /(?:^|\s·\s)Factura:\s*(.+?)(?=\s·\s|$)/i;
const REF_RE = /(?:^|\s·\s)Ref:\s*(.+?)(?=\s·\s|$)/i;

/** Extrae OC, Factura y Referencia del formato generado por import Excel en `order.notes`. */
export function parseOrderReferenceFields(notes?: string | null): OrderReferenceFields | null {
  const raw = notes?.trim();
  if (!raw) return null;

  const numeroOc = raw.match(OC_RE)?.[1]?.trim() ?? '';
  const factura = raw.match(FACTURA_RE)?.[1]?.trim() ?? '';
  const referencia = raw.match(REF_RE)?.[1]?.trim() ?? '';

  if (!numeroOc && !factura && !referencia) return null;
  return { numeroOc, factura, referencia };
}

