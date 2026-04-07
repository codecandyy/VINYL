import { create } from 'zustand';
import { MusicTrack } from '../lib/music';

type PlayerStore = {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  /** 0 ~ 1 마스터 볼륨 (미리듣기 + 크랙클에 곱해짐) */
  volume: number;
  setCurrentTrack: (t: MusicTrack | null) => void;
  setIsPlaying: (v: boolean) => void;
  setProgress: (posMs: number, durMs: number) => void;
};

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentTrack: null,
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  volume: 0.85,
  setCurrentTrack: (t) => set({ currentTrack: t }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setProgress: (positionMs, durationMs) => set({ positionMs, durationMs }),
}));
