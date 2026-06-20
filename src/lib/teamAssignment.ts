import type { User } from '../types';
import { isUuidV4 } from './uuid';

export type Assignee = { id: string; name: string };

export function resolveAssignee(
  draftId: string,
  roster: User[],
): Assignee | null {
  const trimmed = draftId.trim();
  if (!trimmed) return null;

  const byId = roster.find((u) => u.id === trimmed);
  if (byId?.id && isUuidV4(byId.id)) {
    return { id: byId.id, name: byId.name };
  }

  if (isUuidV4(trimmed)) {
    const match = roster.find((u) => u.id === trimmed);
    return { id: trimmed, name: match?.name ?? '' };
  }

  const byName = roster.find((u) => u.name === trimmed);
  if (byName?.id && isUuidV4(byName.id)) {
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
  if (match?.id && isUuidV4(match.id)) {
    return { id: match.id, plate: match.plate };
  }

  if (isUuidV4(trimmed)) {
    const byId = vehicles.find((v) => v.id === trimmed);
    return byId ? { id: trimmed, plate: byId.plate } : null;
  }

  return null;
}
