import { create } from 'zustand';

interface NavTourStore {
  /** Incrementa para solicitar inicio manual del tour */
  startNonce: number;
  requestStart: () => void;
}

export const useNavTourStore = create<NavTourStore>((set) => ({
  startNonce: 0,
  requestStart: () => set((s) => ({ startNonce: s.startNonce + 1 })),
}));
