import { create } from 'zustand';
import type { Client, ServiceHistory } from '../types';
import { mockClients, mockServiceHistory } from '../data/mockData';

interface ClientStore {
  clients: Client[];
  selectedClient: Client | null;
  serviceHistory: ServiceHistory[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectClient: (client: Client | null) => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'tenantId'>) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientHistory: (clientId: string) => ServiceHistory[];
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: mockClients,
  selectedClient: null,
  serviceHistory: mockServiceHistory,
  searchTerm: '',

  setSearchTerm: (term) => set({ searchTerm: term }),

  selectClient: (client) => set({ selectedClient: client }),

  addClient: (data) => {
    const newClient: Client = {
      ...data,
      id: `client-${Date.now()}`,
      tenantId: 'tenant-001',
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ clients: [...state.clients, newClient] }));
  },

  updateClient: (id, data) => {
    set((state) => ({
      clients: state.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
      selectedClient: state.selectedClient?.id === id
        ? { ...state.selectedClient, ...data }
        : state.selectedClient,
    }));
  },

  deleteClient: (id) => {
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
      selectedClient: state.selectedClient?.id === id ? null : state.selectedClient,
    }));
  },

  getClientHistory: (clientId) => {
    return get().serviceHistory.filter((h) => h.clientId === clientId);
  },
}));
