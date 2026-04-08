// ─── 공통 트랙 타입 (Deezer / iTunes 통합) ───────────────────────────────
export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  previewUrl: string | null;   // 30초 MP3 미리듣기
  artworkUrl: string | null;   // 고화질 앨범아트 (1000+ px)
  duration: number;            // 초 단위 (보통 30)
  source: 'deezer' | 'itunes';
  externalUrl: string;
};

// ─── Deezer Public API ──────────────────────────────────────────────────
// API 키 불필요, CORS 허용 (access-control-allow-origin: *)

async function fetchDeezer(path: string): Promise<any> {
  const res = await fetch(`https://api.deezer.com${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Deezer ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message ?? 'Deezer error');
  return data;
}

function deezerTrackToMusicTrack(t: any): MusicTrack {
  return {
    id: String(t.id),
    title: t.title ?? t.title_short ?? '',
    artist: t.artist?.name ?? '',
    artistId: String(t.artist?.id ?? ''),
    album: t.album?.title ?? '',
    albumId: String(t.album?.id ?? ''),
    previewUrl: t.preview || null,
    artworkUrl: t.album?.cover_xl ?? t.album?.cover_big ?? t.album?.cover ?? null,
    duration: t.duration ?? 30,
    source: 'deezer',
    externalUrl: t.link ?? `https://www.deezer.com/track/${t.id}`,
  };
}

// ─── iTunes Search API (fallback) ──────────────────────────────────────
// 완전 공개 API, CORS 허용

async function fetchITunes(query: string, limit: number): Promise<MusicTrack[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes ${res.status}`);
  const data = await res.json();
  return (data.results ?? []).map((t: any): MusicTrack => ({
    id: String(t.trackId),
    title: t.trackName ?? '',
    artist: t.artistName ?? '',
    artistId: String(t.artistId ?? ''),
    album: t.collectionName ?? '',
    albumId: String(t.collectionId ?? ''),
    previewUrl: t.previewUrl || null,
    // 100x100bb → 3000x3000bb 로 교체
    artworkUrl: (t.artworkUrl100 ?? '').replace('100x100bb', '3000x3000bb') || null,
    duration: Math.floor((t.trackTimeMillis ?? 30000) / 1000),
    source: 'itunes',
    externalUrl: t.trackViewUrl ?? '',
  }));
}

// Deezer 장르 ID 맵
const DEEZER_GENRE_IDS: Record<string, number> = {
  pop: 132, rock: 152, jazz: 129, classical: 98, 'hip-hop': 116,
  electronic: 106, 'r-n-b': 165, soul: 165, blues: 231, folk: 169,
  indie: 152, metal: 464, latin: 197, reggae: 144, country: 84,
};

// ─── 통합 musicApi ──────────────────────────────────────────────────────
export const musicApi = {
  /**
   * 트랙 검색 — Deezer 우선, 실패 시 iTunes fallback
   */
  search: async (query: string, limit = 20): Promise<MusicTrack[]> => {
    // Deezer 시도
    try {
      const data = await fetchDeezer(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      const tracks: MusicTrack[] = (data.data ?? []).map(deezerTrackToMusicTrack);
      if (tracks.length > 0) return tracks;
    } catch {}

    // iTunes fallback
    try {
      return await fetchITunes(query, limit);
    } catch {
      return [];
    }
  },

  /**
   * Deezer 앨범 ID로 미리듣기 있는 트랙만 최대 limit곡
   */
  getDeezerAlbumTracks: async (
    albumId: string,
    limit = 5,
    albumMeta?: { title?: string; artist?: string; artworkUrl?: string | null }
  ): Promise<MusicTrack[]> => {
    try {
      const data = await fetchDeezer(`/album/${albumId}/tracks?limit=${limit * 3}`);
      const rows: any[] = data.data ?? [];
      const out: MusicTrack[] = [];
      for (const t of rows) {
        if (out.length >= limit) break;
        const mt = deezerTrackToMusicTrack({
          ...t,
          album: {
            id: albumId,
            title: albumMeta?.title ?? t.album?.title,
            cover_xl: albumMeta?.artworkUrl ?? t.album?.cover_xl,
            cover_big: t.album?.cover_big,
            cover: t.album?.cover,
          },
        });
        if (mt.previewUrl) out.push(mt);
      }
      return out;
    } catch {
      return [];
    }
  },

  /**
   * 앨범 전체 수록(미리듣기 없는 곡 포함) — SET LIST·LP 수집용
   */
  getDeezerAlbumTracklistForLp: async (
    albumId: string,
    limit = 40,
    albumMeta?: { title?: string; artist?: string; artworkUrl?: string | null }
  ): Promise<MusicTrack[]> => {
    try {
      const data = await fetchDeezer(`/album/${albumId}/tracks?limit=${limit}`);
      const rows: any[] = data.data ?? [];
      return rows.slice(0, limit).map((t) =>
        deezerTrackToMusicTrack({
          ...t,
          album: {
            id: albumId,
            title: albumMeta?.title ?? t.album?.title,
            cover_xl: albumMeta?.artworkUrl ?? t.album?.cover_xl,
            cover_big: t.album?.cover_big,
            cover: t.album?.cover,
          },
        })
      );
    } catch {
      return [];
    }
  },

  /**
   * 앨범 검색 → 첫 앨범의 트랙 미리듣기 (최대 5)
   */
  searchAlbumTracks: async (query: string, limit = 5): Promise<MusicTrack[]> => {
    try {
      const data = await fetchDeezer(
        `/search/album?q=${encodeURIComponent(query)}&limit=3`
      );
      const albums: any[] = data.data ?? [];
      if (albums.length === 0) return [];
      const a = albums[0];
      const art = a.cover_xl ?? a.cover_big ?? a.cover_medium ?? null;
      return await musicApi.getDeezerAlbumTracks(String(a.id), limit, {
        title: a.title,
        artist: a.artist?.name,
        artworkUrl: art,
      });
    } catch {
      return [];
    }
  },

  /**
   * iTunes 컬렉션(album) ID로 미리듣기 있는 곡만 최대 limit곡
   */
  getITunesAlbumTracks: async (collectionId: string, limit = 40): Promise<MusicTrack[]> => {
    try {
      const url = `https://itunes.apple.com/lookup?id=${encodeURIComponent(collectionId)}&entity=song&limit=${Math.min(200, limit + 20)}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      const rows: any[] = data.results ?? [];
      const out: MusicTrack[] = [];
      for (const t of rows) {
        if (t.kind !== 'song') continue;
        out.push({
          id: String(t.trackId),
          title: t.trackName ?? '',
          artist: t.artistName ?? '',
          artistId: String(t.artistId ?? ''),
          album: t.collectionName ?? '',
          albumId: String(t.collectionId ?? collectionId),
          previewUrl: t.previewUrl || null,
          artworkUrl: (t.artworkUrl100 ?? '').replace('100x100bb', '3000x3000bb') || null,
          duration: Math.floor((t.trackTimeMillis ?? 30000) / 1000),
          source: 'itunes',
          externalUrl: t.trackViewUrl ?? '',
        });
        if (out.length >= limit) break;
      }
      return out;
    } catch {
      return [];
    }
  },

  /**
   * 장르별 랜덤 추천 트랙 (자판기용)
   */
  getRecommendation: async (genre: string): Promise<MusicTrack | null> => {
    const genreId = DEEZER_GENRE_IDS[genre.toLowerCase()] ?? 132;

    try {
      const data = await fetchDeezer(`/chart/${genreId}/tracks?limit=25`);
      const tracks: any[] = data.data ?? [];
      if (tracks.length === 0) throw new Error('empty');
      const track = tracks[Math.floor(Math.random() * Math.min(tracks.length, 15))];
      return deezerTrackToMusicTrack(track);
    } catch {}

    // iTunes fallback
    try {
      const results = await fetchITunes(`${genre} music`, 15);
      if (results.length === 0) return null;
      return results[Math.floor(Math.random() * results.length)];
    } catch {
      return null;
    }
  },
};
