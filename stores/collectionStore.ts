import { create } from 'zustand';
import { LocalLP } from '../lib/localCollection';

type CollectionStore = {
  lps: LocalLP[];
  isLoading: boolean;
  setLPs: (lps: LocalLP[]) => void;
  addLP: (lp: LocalLP) => void;
  removeLP: (id: string) => void;
  updateLP: (id: string, updates: Partial<LocalLP>) => void;
  setLoading: (v: boolean) => void;
};

export const useCollectionStore = create<CollectionStore>((set) => ({
  lps: [],
  isLoading: false,
  setLPs: (lps) => set({ lps }),
  addLP: (lp) => set((s) => ({ lps: [lp, ...s.lps] })),
  removeLP: (id) => set((s) => ({ lps: s.lps.filter((l) => l.id !== id) })),
  updateLP: (id, updates) =>
    set((s) => ({ lps: s.lps.map((l) => (l.id === id ? { ...l, ...updates } : l)) })),
  setLoading: (v) => set({ isLoading: v }),
}));
