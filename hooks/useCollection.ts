import { useEffect, useCallback } from 'react';
import { localCollection, LocalLP } from '../lib/localCollection';
import { useCollectionStore } from '../stores/collectionStore';
import { MusicTrack } from '../lib/music';

export function useCollection() {
  const { lps, setLPs, addLP, removeLP, updateLP, setLoading } = useCollectionStore();

  // 앱 시작 시 로컬 스토리지에서 불러오기
  const loadCollection = useCallback(async () => {
    setLoading(true);
    try {
      const data = await localCollection.getAll();
      setLPs(data);
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
      // 이미 있으면 스토어에서 중복 추가 방지
      if (!lps.find(l => l.id === lp.id)) {
        addLP(lp);
      }
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
