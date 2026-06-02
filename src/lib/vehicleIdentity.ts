/** Patente canónica: mayúsculas, sin espacios ni guiones. */
export function normalizeVehiclePlate(plate: string): string {
  return plate.trim().toUpperCase().replace(/[\s-]+/g, '');
}

export function normalizeVehicleVin(vin?: string | null): string | null {
  if (vin === undefined || vin === null) return null;
  const t = vin.trim().toUpperCase();
  return t.length > 0 ? t : null;
}
