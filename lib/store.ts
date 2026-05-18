import { create } from "zustand";

interface AppState {
  address: string | null;
  jwt: string | null;
  setAddress: (address: string | null) => void;
  setJwt: (jwt: string | null) => void;
  disconnect: () => void;
}

export const useStore = create<AppState>((set) => ({
  address: null,
  jwt: null,
  setAddress: (address) => set({ address }),
  setJwt: (jwt) => set({ jwt }),
  disconnect: () => set({ address: null, jwt: null }),
}));
