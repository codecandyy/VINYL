import { useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { audioEngine } from '../lib/audioEngine';
import { MusicTrack } from '../lib/music';
import { usePlayerStore } from '../stores/playerStore';
import { useQueueStore } from '../stores/queueStore';

const VOL_STORAGE_KEY = 'vinyl_master_volume';

let volumeHydrated = false;

/** Howler가 duration 0을 줄 때 스토어의 유효 길이 유지 */
function applyProgress(posMs: number, durMs: number) {
  const ps = usePlayerStore.getState();
  let d = durMs;
  if (!Number.isFinite(d) || d <= 0) {
    d = ps.durationMs > 0 ? ps.durationMs : 0;
  }
  ps.setProgress(posMs, d);
}

export type PlayTrackOptions = {
  sideAlbumTracks?: MusicTrack[] | null;
  initialSideIndex?: number;
};

function defaultHintMs(track: MusicTrack): number {
  const s = track.duration;
  if (typeof s === 'number' && Number.isFinite(s) && s > 0) return Math.round(s * 1000);
  return 30_000;
}

/** Howl / expo-av 공통 — 큐 다음 곡 또는 정지 */
function getPlaybackCallbacks(): {
  onProgress: (posMs: number, durMs: number) => void;
  onEnd: () => void;
} {
  return {
    onProgress: applyProgress,
    onEnd: () => {
      const ps = usePlayerStore.getState();
      const deck = ps.sideTracksForDeck;
      const nowIdx = ps.playingSideIndex;

      // LP 감상 몰입감: 같은 앨범 SET LIST 안에 다음 미리듣기 곡이 있으면 우선 자동 진행
      if (deck && deck.length > 0) {
        const nextDeckIdx = (() => {
          for (let i = Math.max(0, nowIdx + 1); i < deck.length; i++) {
            if (deck[i]?.previewUrl) return i;
          }
          return -1;
        })();
        if (nextDeckIdx >= 0) {
          const nextDeckTrack = deck[nextDeckIdx]!;
          const hint = defaultHintMs(nextDeckTrack);
          ps.setCurrentTrack(nextDeckTrack);
          ps.setIsPlaying(true);
          ps.setSideDeck(deck, nextDeckIdx);
          applyProgress(0, hint);
          audioEngine.play(nextDeckTrack.previewUrl!, getPlaybackCallbacks(), { hintDurationMs: hint });
          return;
        }
      }

      const next = useQueueStore.getState().takeNextFromSlots();
      if (!next?.previewUrl) {
        ps.setIsPlaying(false);
        ps.setProgress(0, 0);
        ps.setSideDeck(null, 0);
        return;
      }

      const idx = deck?.findIndex((t) => t.id === next.id) ?? -1;
      const hint = defaultHintMs(next);
      ps.setCurrentTrack(next);
      ps.setIsPlaying(true);
      if (idx >= 0 && deck && deck.length > 0) {
        ps.setSideDeck(deck, idx);
      } else {
        ps.setSideDeck(null, 0);
      }
      applyProgress(0, hint);
      audioEngine.play(next.previewUrl, getPlaybackCallbacks(), { hintDurationMs: hint });
    },
  };
}

export function useMusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    volume,
    setCurrentTrack,
    setIsPlaying,
    setProgress,
  } = usePlayerStore();

  useEffect(() => {
    if (volumeHydrated) return;
    volumeHydrated = true;
    AsyncStorage.getItem(VOL_STORAGE_KEY).then((raw) => {
      if (raw == null) return;
      const v = parseFloat(raw);
      if (Number.isNaN(v)) return;
      const c = Math.max(0, Math.min(1, v));
      usePlayerStore.setState({ volume: c });
      audioEngine.setMasterVolume(c);
    });
  }, []);

  const setVolume = useCallback((v: number) => {
    const c = Math.max(0, Math.min(1, v));
    usePlayerStore.setState({ volume: c });
    audioEngine.setMasterVolume(c);
    void AsyncStorage.setItem(VOL_STORAGE_KEY, String(c));
  }, []);

  const playTrack = useCallback(
    async (track: MusicTrack, opts?: PlayTrackOptions) => {
      const provided = opts?.sideAlbumTracks;
      const store = usePlayerStore.getState();
      const existing = store.sideTracksForDeck;

      if (provided != null && provided.length > 0) {
        const displayList = provided.slice(0, 40);
        const i0 = opts?.initialSideIndex ?? 0;
        const idx = Math.max(0, Math.min(displayList.length - 1, i0));
        store.setSideDeck(displayList, idx);
      } else {
        const inDeck = existing?.findIndex((t) => t.id === track.id) ?? -1;
        if (inDeck >= 0 && existing && existing.length > 0) {
          store.setSideDeck(existing, inDeck);
        } else {
          store.setSideDeck(null, 0);
        }
      }

      if (!track.previewUrl) {
        console.warn('[useMusicPlayer] No preview URL for', track.title);
        setCurrentTrack(track);
        return;
      }

      const hint = defaultHintMs(track);
      setCurrentTrack(track);
      setIsPlaying(true);
      setProgress(0, hint);

      audioEngine.play(track.previewUrl, getPlaybackCallbacks(), { hintDurationMs: hint });
    },
    [setCurrentTrack, setIsPlaying, setProgress]
  );

  const pause = useCallback(() => {
    audioEngine.pause();
    setIsPlaying(false);
  }, [setIsPlaying]);

  const resume = useCallback(() => {
    audioEngine.resume(applyProgress);
    setIsPlaying(true);
  }, [setIsPlaying]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      if (currentTrack?.previewUrl) resume();
    }
  }, [isPlaying, currentTrack, pause, resume]);

  const stop = useCallback(() => {
    audioEngine.stop();
    setIsPlaying(false);
    setProgress(0, 0);
    usePlayerStore.getState().setSideDeck(null, 0);
  }, [setIsPlaying, setProgress]);

  return {
    playTrack,
    pause,
    resume,
    togglePlay,
    stop,
    currentTrack,
    isPlaying,
    volume,
    setVolume,
  };
}
