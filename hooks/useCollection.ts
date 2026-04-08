import { useEffect, useCallback } from 'react';
import { localCollection, LocalLP } from '../lib/localCollection';
import { useCollectionStore } from '../stores/collectionStore';
import { MusicTrack, musicApi } from '../lib/music';

// ─── 기본 샘플 LP (컬렉션 비어있을 때) — 한국·글로벌 팝 앨범 + 실제 앨범 트랙 미리듣기 ──
const SAMPLE_ALBUM_QUERIES = [
  { query: 'BTS Proof', color: '#5C3D8C' },
  { query: 'BLACKPINK THE ALBUM', color: '#E91E8C' },
  { query: 'NewJeans Get Up', color: '#4A8FCF' },
  { query: 'IU Palette', color: '#D4A574' },
  { query: 'Taylor Swift 1989', color: '#B8860B' },
  { query: 'Ariana Grande thank u next', color: '#C4A8C8' },
];

async function buildSampleLPs(): Promise<LocalLP[]> {
  const results: LocalLP[] = [];
  for (let i = 0; i < SAMPLE_ALBUM_QUERIES.length; i++) {
    const { query, color } = SAMPLE_ALBUM_QUERIES[i];
    try {
      const albumTracks = await musicApi.searchAlbumTracks(query, 5);
      if (albumTracks.length === 0) continue;
      const first = albumTracks[0];
      results.push({
        id: `sample_${i + 1}`,
        trackId: first.id,
        source: first.source,
        title: first.title,
        artist: first.artist,
        album: first.album,
        albumId: first.albumId,
        albumTracks,
        artworkUrl: first.artworkUrl,
        previewUrl: first.previewUrl,
        labelColor: color,
        isDamaged: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        lastPlayedAt: null,
      });
    } catch {
      // 샘플 LP 로드 실패 시 스킵
    }
  }
  return results;
}

export function useCollection() {
  const { lps, setLPs, addLP, removeLP, updateLP, setLoading } = useCollectionStore();

  // 앱 시작 시 로컬 스토리지에서 불러오기 — 비어있으면 샘플 LP 초기화
  const loadCollection = useCallback(async () => {
    setLoading(true);
    try {
      const data = await localCollection.getAll();
      if (data.length === 0) {
        // 샘플 LP는 네트워크로 오래 걸릴 수 있음 — 그동안 LP샵에서 추가하면
        // 저장소에 LP가 생기므로, 완료 후 반드시 저장소를 다시 읽어 덮어쓰기 레이스 방지
        const samples = await buildSampleLPs();
        const after = await localCollection.getAll();
        setLPs(after.length > 0 ? after : samples);
      } else {
        setLPs(data);
      }
    } finally {
      setLoading(false);
    }
  }, [setLPs, setLoading]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  const addToCollection = async (
    track: MusicTrack,
    labelColor?: string
  ): Promise<LocalLP | null> => {
    try {
      const lp = await localCollection.add(track, labelColor);
      const stored = await localCollection.getAll();
      setLPs([...stored]);
      return lp;
    } catch (e) {
      console.error('addToCollection failed:', e);
      return null;
    }
  };

  const removeFromCollection = async (id: string) => {
    await localCollection.remove(id);
    removeLP(id);
  };

  const markPlayed = async (id: string) => {
    await localCollection.markPlayed(id);
    updateLP(id, { lastPlayedAt: new Date().toISOString() });
  };

  return { lps, addToCollection, removeFromCollection, markPlayed, loadCollection };
}
