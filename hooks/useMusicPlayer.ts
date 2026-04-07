import { useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { audioEngine } from '../lib/audioEngine';
import { MusicTrack } from '../lib/music';
import { usePlayerStore } from '../stores/playerStore';

const VOL_STORAGE_KEY = 'vinyl_master_volume';

let volumeHydrated = false;

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

  const playTrack = useCallback(async (track: MusicTrack) => {
    if (!track.previewUrl) {
      console.warn('[useMusicPlayer] No preview URL for', track.title);
      setCurrentTrack(track);
      return;
    }

    setCurrentTrack(track);
    setIsPlaying(true);

    audioEngine.play(track.previewUrl, {
      onProgress: (pos, dur) => setProgress(pos, dur),
      onEnd: () => {
        setIsPlaying(false);
        setProgress(0, 0);
      },
    });
  }, [setCurrentTrack, setIsPlaying, setProgress]);

  const pause = useCallback(() => {
    audioEngine.pause();
    setIsPlaying(false);
  }, [setIsPlaying]);

  const resume = useCallback(() => {
    audioEngine.resume();
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
