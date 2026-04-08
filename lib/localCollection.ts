import { Platform } from 'react-native';
import { getSanitizedArtworkUrl } from './albumTexture';
import { MusicTrack, musicApi } from './music';

/** LP에 저장·SET LIST·바늘 구역에 쓰는 최대 수록곡 수 */
export const ALBUM_LP_MAX_TRACKS = 40;

/** LocalLP → MusicTrack (턴테이블 드롭·큐용) */
export function localLPToTrack(lp: LocalLP): MusicTrack {
  return {
    id: lp.trackId,
    title: lp.title,
    artist: lp.artist,
    artistId: '',
    album: lp.album,
    albumId: lp.albumId ?? '',
    previewUrl: lp.previewUrl,
    artworkUrl: lp.artworkUrl,
    duration: 30,
    source: lp.source,
    externalUrl: '',
  };
}

/** 큐·자판기 등: 앨범 미리듣기가 있으면 첫 곡, 없으면 LP 대표 트랙 */
export function lpToQueueTrack(lp: LocalLP): MusicTrack {
  const previews = (lp.albumTracks ?? []).filter((t) => t.previewUrl);
  if (previews.length > 0) return previews[0];
  return localLPToTrack(lp);
}

/** 덱 SET LIST·sideTracksForDeck — 미리듣기 없는 수록도 제목 표시 */
export function getDeckSetListTracks(lp: LocalLP): MusicTrack[] {
  const list = lp.albumTracks?.slice(0, ALBUM_LP_MAX_TRACKS);
  if (list && list.length > 0) return list;
  return [localLPToTrack(lp)];
}

/** 바늘 홈 구역·비닐 홈 링 — 미리듣기 있는 트랙만 */
export function filterDeckPreviewTracks(tracks: MusicTrack[] | null | undefined): MusicTrack[] {
  return (tracks ?? []).filter((t) => t.previewUrl);
}

/**
 * 바늘 위치(0=외곽·1=내곽) → 수록 슬롯. 전체 수록 기준 홈이며, 미리듣기 없으면 가장 가까운 미리듣기 곡.
 */
export function pickTrackForGroove(
  lp: LocalLP,
  grooveNorm: number
): { track: MusicTrack; sideTracks: MusicTrack[]; sideIndex: number } | null {
  const all = getDeckSetListTracks(lp);
  const playable = filterDeckPreviewTracks(all);
  if (playable.length === 0) return null;

  if (all.length <= 1) {
    const t = playable[0];
    return { track: t, sideTracks: all, sideIndex: 0 };
  }

  const u = Math.max(0, Math.min(1, grooveNorm));
  let idx = Math.min(all.length - 1, Math.floor(u * all.length + 1e-9));
  let track = all[idx];

  if (!track.previewUrl) {
    let bestIdx = -1;
    let bestD = Infinity;
    for (const p of playable) {
      const pi = all.findIndex((t) => t.id === p.id);
      if (pi >= 0) {
        const d = Math.abs(pi - idx);
        if (d < bestD) {
          bestD = d;
          bestIdx = pi;
        }
      }
    }
    if (bestIdx >= 0) {
      idx = bestIdx;
      track = all[idx];
    } else {
      track = playable[0];
      const fi = all.findIndex((t) => t.id === track.id);
      idx = fi >= 0 ? fi : 0;
    }
  }

  return { track, sideTracks: all, sideIndex: idx };
}

export type LocalLP = {
  id: string;
  trackId: string;
  source: 'deezer' | 'itunes';
  title: string;
  artist: string;
  album: string;
  albumId?: string;
  /** 같은 앨범 수록(미리듣기 없는 곡 포함, 최대 ALBUM_LP_MAX_TRACKS) */
  albumTracks?: MusicTrack[];
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
    let existing: LocalLP | undefined;
    if (track.albumId) {
      existing = all.find((l) => l.albumId === track.albumId && l.source === track.source);
    }
    if (!existing) {
      existing = all.find((l) => l.trackId === track.id && l.source === track.source);
    }
    if (existing) return existing;

    let albumTracks: MusicTrack[] | undefined;
    try {
      if (track.source === 'deezer' && track.albumId) {
        const list = await musicApi.getDeezerAlbumTracklistForLp(track.albumId, ALBUM_LP_MAX_TRACKS, {
          title: track.album,
          artist: track.artist,
          artworkUrl: track.artworkUrl,
        });
        if (list.length > 0) albumTracks = list;
      } else if (track.source === 'itunes' && track.albumId) {
        const list = await musicApi.getITunesAlbumTracks(track.albumId, ALBUM_LP_MAX_TRACKS);
        if (list.length > 0) albumTracks = list;
      }
    } catch {
      albumTracks = undefined;
    }

    const lp: LocalLP = {
      id: uid(),
      trackId: track.id,
      source: track.source,
      title: track.title,
      artist: track.artist,
      album: track.album,
      albumId: track.albumId || undefined,
      albumTracks,
      artworkUrl: getSanitizedArtworkUrl(track.artworkUrl),
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
