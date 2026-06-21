import type { User } from '../types';
import { isUuid } from './uuid';

export type Assignee = { id: string; name: string };

export function resolveAssignee(
  draftId: string,
  roster: User[],
): Assignee | null {
  const trimmed = draftId.trim();
  if (!trimmed) return null;

  const byId = roster.find((u) => u.id === trimmed);
  if (byId?.id && isUuid(byId.id)) {
    return { id: byId.id, name: byId.name };
  }

  if (isUuid(trimmed)) {
    const match = roster.find((u) => u.id === trimmed);
    return { id: trimmed, name: match?.name ?? '' };
  }

  const byName = roster.find((u) => u.name === trimmed);
  if (byName?.id && isUuid(byName.id)) {
    return { id: byName.id, name: byName.name };
  }

  return null;
}

export function resolveVehicle(
  draftId: string,
  vehicles: { id: string; plate: string }[],
): { id: string; plate: string } | null {
  const trimmed = draftId.trim();
  if (!trimmed) return null;

  const match = vehicles.find((v) => v.id === trimmed);
  if (match?.id && isUuid(match.id)) {
    return { id: match.id, plate: match.plate };
  }

  if (isUuid(trimmed)) {
    const byId = vehicles.find((v) => v.id === trimmed);
    return byId ? { id: trimmed, plate: byId.plate } : null;
  }

  return null;
}

/** Arma payload parcial para PATCH assign-driver (solo campos con valor en el formulario). */
export function buildPartialTeamAssignPayload(input: {
  driverDraft: string;
  peonetaDraft: string;
  vehicleDraft: string;
  driver: Assignee | null;
  peoneta: Assignee | null;
  vehicle: { id: string; plate: string } | null;
  orderIds?: string[];
}): {
  driverId?: string | null;
  driverName?: string | null;
  peonetaId?: string | null;
  peonetaName?: string | null;
  vehicleId?: string | null;
  vehiclePlate?: string | null;
  orderIds?: string[];
} {
  const payload: ReturnType<typeof buildPartialTeamAssignPayload> = {};

  if (input.driverDraft.trim()) {
    payload.driverId = input.driver?.id ?? null;
    payload.driverName = input.driver?.name ?? null;
  }
  if (input.peonetaDraft.trim()) {
    payload.peonetaId = input.peoneta?.id ?? null;
    payload.peonetaName = input.peoneta?.name ?? null;
  }
  if (input.vehicleDraft.trim()) {
    payload.vehicleId = input.vehicle?.id ?? null;
    payload.vehiclePlate = input.vehicle?.plate ?? null;
  }
  if (input.orderIds?.length) payload.orderIds = input.orderIds;

  return payload;
}
