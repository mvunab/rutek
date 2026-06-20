const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidV4(value: string): boolean {
  return UUID_V4.test(value.trim());
}

/** Convierte a UUID v4, null si está vacío, undefined si no se envió. */
export function normalizeOptionalUuid(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isUuidV4(trimmed) ? trimmed : null;
}
