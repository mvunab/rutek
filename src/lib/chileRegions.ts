export interface RegionSelectOption {
  value: string;
  label: string;
}

/** Regiones de Chile — valores alineados con pedidos y datos legacy. */
export const CHILE_REGION_OPTIONS: RegionSelectOption[] = [
  { value: 'Arica y Parinacota', label: 'Arica y Parinacota' },
  { value: 'Tarapacá', label: 'Tarapacá' },
  { value: 'Antofagasta', label: 'Antofagasta' },
  { value: 'Atacama', label: 'Atacama' },
  { value: 'Coquimbo', label: 'Coquimbo' },
  { value: 'Valparaíso', label: 'Valparaíso' },
  { value: 'Metropolitana', label: 'Región Metropolitana' },
  { value: "O'Higgins", label: "O'Higgins" },
  { value: 'Maule', label: 'Maule' },
  { value: 'Ñuble', label: 'Ñuble' },
  { value: 'Biobío', label: 'Biobío' },
  { value: 'Araucanía', label: 'La Araucanía' },
  { value: 'Los Ríos', label: 'Los Ríos' },
  { value: 'Los Lagos', label: 'Los Lagos' },
  { value: 'Aysén', label: 'Aysén' },
  { value: 'Magallanes', label: 'Magallanes' },
];

/**
 * Opciones para `<Select>` de región.
 * Si `current` no está en el catálogo (dato legacy), se incluye al inicio.
 */
export function chileRegionSelectOptions(current?: string): RegionSelectOption[] {
  const trimmed = current?.trim() ?? '';
  if (!trimmed || CHILE_REGION_OPTIONS.some((o) => o.value === trimmed)) {
    return CHILE_REGION_OPTIONS;
  }
  return [{ value: trimmed, label: trimmed }, ...CHILE_REGION_OPTIONS];
}
