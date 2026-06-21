export type RangeAssignRule = {
  id: string;
  from: string;
  to: string;
  driverId: string;
  vehicleId: string;
  peonetaId?: string;
};

export type RangeAssignValues = {
  driverId?: string;
  vehicleId?: string;
  peonetaId?: string;
};

export function createEmptyRangeRule(total: number): RangeAssignRule {
  return {
    id: `r-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    from: '1',
    to: String(Math.max(1, total)),
    driverId: '',
    vehicleId: '',
    peonetaId: '',
  };
}

/** Aplica reglas 1-based sobre índices 0-based. Reglas posteriores pisan solapamientos. */
export function applyRangeRules(
  total: number,
  rules: RangeAssignRule[],
): Record<number, RangeAssignValues> {
  const result: Record<number, RangeAssignValues> = {};

  for (const rule of rules) {
    const from = Math.max(1, Math.floor(Number(rule.from.trim()) || 1));
    const to = Math.min(total, Math.floor(Number(rule.to.trim()) || total));
    if (to < from) continue;

    for (let idx1 = from; idx1 <= to; idx1++) {
      const i = idx1 - 1;
      const cur = result[i] ?? {};
      result[i] = {
        ...cur,
        ...(rule.driverId ? { driverId: rule.driverId } : {}),
        ...(rule.vehicleId ? { vehicleId: rule.vehicleId } : {}),
        ...(rule.peonetaId ? { peonetaId: rule.peonetaId } : {}),
      };
    }
  }

  return result;
}

/** Índices 0-based cubiertos por al menos una regla con chofer, peoneta o vehículo. */
export function indicesCoveredByRules(total: number, rules: RangeAssignRule[]): number[] {
  const applied = applyRangeRules(total, rules);
  return Object.entries(applied)
    .filter(([, v]) => Boolean(v.driverId || v.vehicleId || v.peonetaId))
    .map(([i]) => Number(i))
    .filter((i) => i >= 0 && i < total)
    .toSorted((a, b) => a - b);
}
