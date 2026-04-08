import { create } from 'zustand';
import { MusicTrack } from '../lib/music';

type PlayerStore = {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  /** 0 ~ 1 마스터 볼륨 (미리듣기 + 크랙클에 곱해짐) */
  volume: number;
  /** 같은 앨범 수록 전체(최대 40) — SET LIST·바늘 구역 */
  sideTracksForDeck: MusicTrack[] | null;
  /** sideTracksForDeck 중 현재 재생 인덱스 */
  playingSideIndex: number;
  setCurrentTrack: (t: MusicTrack | null) => void;
  setIsPlaying: (v: boolean) => void;
  setProgress: (posMs: number, durMs: number) => void;
  setSideDeck: (tracks: MusicTrack[] | null, playingIndex?: number) => void;
};

export const usePlayerStore = create<PlayerStore>((set) => ({
  currentTrack: null,
  isPlaying: false,
  positionMs: 0,
  durationMs: 0,
  volume: 0.85,
  sideTracksForDeck: null,
  playingSideIndex: 0,
  setCurrentTrack: (t) => set({ currentTrack: t }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setProgress: (positionMs, durationMs) => set({ positionMs, durationMs }),
  setSideDeck: (tracks, playingIndex = 0) => {
    const slice = tracks && tracks.length > 0 ? tracks.slice(0, 40) : null;
    const len = slice?.length ?? 0;
    set({
      sideTracksForDeck: slice,
      playingSideIndex: len > 0 ? Math.max(0, Math.min(len - 1, playingIndex)) : 0,
    });
  },
}));
