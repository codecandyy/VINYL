import { create } from 'zustand';

type RoomStore = {
  dustLevel: number;
  playerSkin: string;
  roomTheme: string;
  coinBalance: number;
  lastVisitedAt: Date | null;
  setDustLevel: (v: number) => void;
  setPlayerSkin: (skin: string) => void;
  setRoomTheme: (theme: string) => void;
  setCoinBalance: (v: number) => void;
  setLastVisitedAt: (d: Date) => void;
};

export const useRoomStore = create<RoomStore>((set) => ({
  dustLevel: 0,
  playerSkin: 'classic-walnut',
  roomTheme: 'dark-library',
  coinBalance: 3,
  lastVisitedAt: null,
  setDustLevel: (v) => set({ dustLevel: v }),
  setPlayerSkin: (skin) => set({ playerSkin: skin }),
  setRoomTheme: (theme) => set({ roomTheme: theme }),
  setCoinBalance: (v) => set({ coinBalance: v }),
  setLastVisitedAt: (d) => set({ lastVisitedAt: d }),
}));
