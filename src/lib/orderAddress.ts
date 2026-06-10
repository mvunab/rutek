import type { Address } from '../types';
import type { Client } from '../types';
import type { Tenant } from '../types';

/** Texto compacto ciudad + región (o calle si falta ciudad). */
export function formatAddressLabel(addr: Partial<Address> | undefined): string {
  if (!addr) return '—';
  const city = addr.city?.trim();
  const region = addr.region?.trim();
  if (city && region) return `${city}, ${region}`;
  if (city) return city;
  if (region) return region;
  const street = addr.street?.trim();
  return street || '—';
}

/** Línea completa: calle + ciudad/región. */
export function formatAddressFull(addr: Partial<Address> | undefined): string {
  if (!addr) return '—';
  const street = addr.street?.trim();
  const loc = formatAddressLabel(addr);
  if (street && loc !== '—') return `${street} · ${loc}`;
  return street || loc;
}

export function resolveDefaultPickupAddress(
  client?: Pick<Client, 'address' | 'city' | 'region'> | null,
  tenant?: Pick<Tenant, 'address' | 'city' | 'region'> | null,
): { street: string; city: string; region: string } {
  const from = (src?: { address?: string; city?: string; region?: string } | null) => {
    const city = src?.city?.trim();
    if (!city) return null;
    return {
      street: src?.address?.trim() ?? '',
      city,
      region: src?.region?.trim() || 'Metropolitana',
    };
  };
  return from(client) ?? from(tenant) ?? { street: '', city: '', region: 'Metropolitana' };
}
