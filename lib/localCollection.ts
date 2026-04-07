import { Platform } from 'react-native';
import { getSanitizedArtworkUrl } from './albumTexture';
import { MusicTrack } from './music';

export type LocalLP = {
  id: string;
  trackId: string;
  source: 'deezer' | 'itunes';
  title: string;
  artist: string;
  album: string;
  artworkUrl: string | null;
  previewUrl: string | null;
  labelColor: string;
  isDamaged: boolean;
  createdAt: string;
  lastPlayedAt: string | null;
};

const COLLECTION_KEY = 'vinyl_collection_v1';

// ─── 플랫폼별 스토리지 어댑터 ──────────────────────────────────────────
async function get(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return AsyncStorage.getItem(key);
}

async function set(key: string, val: string): Promise<void> {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, val); } catch {}
    return;
  }
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return AsyncStorage.setItem(key, val);
}

function uid(): string {
  return `lp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── 컬렉션 CRUD ────────────────────────────────────────────────────────
export const localCollection = {
  getAll: async (): Promise<LocalLP[]> => {
    try {
      const raw = await get(COLLECTION_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw) as LocalLP[];
      let dirty = false;
      const next = list.map((lp) => {
        const clean = getSanitizedArtworkUrl(lp.artworkUrl);
        if (clean !== lp.artworkUrl) dirty = true;
        return { ...lp, artworkUrl: clean };
      });
      if (dirty) await set(COLLECTION_KEY, JSON.stringify(next));
      return next;
    } catch {
      return [];
    }
  },

  add: async (track: MusicTrack, labelColor = '#C87830'): Promise<LocalLP> => {
    const all = await localCollection.getAll();
    const existing = all.find(l => l.trackId === track.id && l.source === track.source);
    if (existing) return existing;

    const lp: LocalLP = {
      id: uid(),
      trackId: track.id,
      source: track.source,
      title: track.title,
      artist: track.artist,
      album: track.album,
      artworkUrl: track.artworkUrl,
      previewUrl: track.previewUrl,
      labelColor,
      isDamaged: false,
      createdAt: new Date().toISOString(),
      lastPlayedAt: null,
    };
    await set(COLLECTION_KEY, JSON.stringify([lp, ...all]));
    return lp;
  },

  remove: async (id: string): Promise<void> => {
    const all = await localCollection.getAll();
    await set(COLLECTION_KEY, JSON.stringify(all.filter(l => l.id !== id)));
  },

  markPlayed: async (id: string): Promise<void> => {
    const all = await localCollection.getAll();
    const updated = all.map(l =>
      l.id === id ? { ...l, lastPlayedAt: new Date().toISOString() } : l
    );
    await set(COLLECTION_KEY, JSON.stringify(updated));
  },

  markDamaged: async (id: string): Promise<void> => {
    const all = await localCollection.getAll();
    const updated = all.map(l => l.id === id ? { ...l, isDamaged: true } : l);
    await set(COLLECTION_KEY, JSON.stringify(updated));
  },

  repair: async (id: string): Promise<void> => {
    const all = await localCollection.getAll();
    const updated = all.map(l => l.id === id ? { ...l, isDamaged: false } : l);
    await set(COLLECTION_KEY, JSON.stringify(updated));
  },
};
