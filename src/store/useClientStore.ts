import { create } from 'zustand';
import type { Client, ServiceHistory } from '../types';
import { api } from '../lib/api';
import type { DbClient } from '../types/api';

export interface ClientDeletionImpact {
  client_id: string;
  company_name: string;
  routes_count: number;
  orders_count: number;
  activities_count: number;
  requires_cascade: boolean;
}

function toClient(r: DbClient): Client {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    companyName: r.company_name,
    contactName: r.contact_name,
    email: r.email,
    phone: r.phone,
    rut: r.rut,
    address: r.address,
    city: r.city,
    region: r.region,
    active: r.active,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
  };
}

interface ClientStore {
  clients: Client[];
  serviceHistory: ServiceHistory[];
  selectedClient: Client | null;
  searchTerm: string;
  loading: boolean;
  fetchClients: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  selectClient: (client: Client | null) => void;
  addClient: (data: Omit<Client, 'id' | 'createdAt' | 'tenantId'>) => Promise<void>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string, options?: { cascade?: boolean }) => Promise<void>;
  getDeletionImpact: (id: string) => Promise<ClientDeletionImpact>;
  getClientHistory: (clientId: string) => ServiceHistory[];
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  serviceHistory: [],
  selectedClient: null,
  searchTerm: '',
  loading: false,

  fetchClients: async () => {
    set({ loading: true });
    try {
      const data = await api.get<DbClient[]>('/clients');
      set({
        clients: data
          .map(toClient)
          .filter((c) => c.companyName !== '__SIN_CUENTA__'),
      });
    } finally {
      set({ loading: false });
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),

  selectClient: (client) => set({ selectedClient: client }),

  addClient: async (data) => {
    const inserted = await api.post<DbClient>('/clients', {
      company_name: data.companyName,
      contact_name: data.contactName,
      email: data.email,
      phone: data.phone,
      rut: data.rut,
      address: data.address,
      city: data.city,
      region: data.region,
      active: data.active,
      notes: data.notes,
    });
    set((s) => ({ clients: [...s.clients, toClient(inserted)] }));
  },

  updateClient: async (id, data) => {
    const updated = await api.patch<DbClient>(`/clients/${id}`, {
      ...(data.companyName && { company_name: data.companyName }),
      ...(data.contactName && { contact_name: data.contactName }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.active !== undefined && { active: data.active }),
    });
    set((s) => ({
      clients: s.clients.map((c) => (c.id === id ? toClient(updated) : c)),
      selectedClient: s.selectedClient?.id === id ? toClient(updated) : s.selectedClient,
    }));
  },

  getDeletionImpact: async (id) => {
    return api.get<ClientDeletionImpact>(`/clients/${id}/deletion-impact`);
  },

  deleteClient: async (id, options) => {
    const cascade = options?.cascade ?? false;
    const qs = cascade ? '?cascade=true' : '';
    await api.del(`/clients/${id}${qs}`);
    set((s) => ({
      clients: s.clients.filter((c) => c.id !== id),
      selectedClient: s.selectedClient?.id === id ? null : s.selectedClient,
    }));
  },

  getClientHistory: (clientId) => {
    return get().serviceHistory.filter((h) => h.clientId === clientId);
  },
}));
