import { useEffect, useCallback } from 'react';
import { localCollection, LocalLP } from '../lib/localCollection';
import { useCollectionStore } from '../stores/collectionStore';
import { MusicTrack, musicApi } from '../lib/music';

// ─── 기본 샘플 LP — DEMO_ALBUMS 21개와 1:1 매칭 (albumTexture.ts의 순서와 동일) ──
const SAMPLE_ALBUM_QUERIES = [
  { query: 'Miles Davis Kind of Blue',                color: '#90E0EF' },
  { query: 'The Weeknd After Hours',                  color: '#E94560' },
  { query: 'Daft Punk Discovery',                     color: '#FFBE0B' },
  { query: 'Prince Purple Rain',                      color: '#FFD700' },
  { query: 'Frank Ocean Blonde',                      color: '#48CAE4' },
  { query: 'The Beatles Abbey Road',                  color: '#95D5B2' },
  { query: 'Amy Winehouse Back to Black',             color: '#F1FAEE' },
  { query: 'Michael Jackson Thriller',                color: '#FCBF49' },
  { query: 'Tame Impala Currents',                    color: '#E07A5F' },
  { query: 'Daft Punk Random Access Memories',        color: '#E040FB' },
  { query: 'Pink Floyd Dark Side of the Moon',        color: '#FAF0CA' },
  { query: 'Radiohead OK Computer',                   color: '#FB3640' },
  { query: 'Patti Smith Horses',                      color: '#FF85A1' },
  { query: 'Nirvana Nevermind',                       color: '#FF8C00' },
  { query: 'Talking Heads Remain in Light',           color: '#00A8E8' },
  { query: 'John Coltrane Blue Train',                color: '#A8DADC' },
  { query: 'David Bowie Ziggy Stardust',              color: '#B5179E' },
  { query: 'John Coltrane A Love Supreme',            color: '#00FF87' },
  { query: 'Miles Davis Bitches Brew',                color: '#FF9A3C' },
  { query: 'Blondie Parallel Lines',                  color: '#FF4DFF' },
  { query: 'The Clash London Calling',                color: '#FFD700' },
];

async function buildSampleLPs(): Promise<LocalLP[]> {
  // 병렬 요청으로 로딩 속도 대폭 단축
  const settled = await Promise.allSettled(
    SAMPLE_ALBUM_QUERIES.map(({ query }) => musicApi.searchAlbumTracks(query, 5))
  );

  const results: LocalLP[] = [];
  for (let i = 0; i < settled.length; i++) {
    const result = settled[i];
    if (result.status === 'rejected') continue;
    const albumTracks = result.value;
    if (albumTracks.length === 0) continue;
    const { color } = SAMPLE_ALBUM_QUERIES[i];
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
