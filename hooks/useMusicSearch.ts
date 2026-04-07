import { useState, useCallback } from 'react';
import { musicApi, MusicTrack } from '../lib/music';

export function useMusicSearch() {
  const [results, setResults] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const tracks = await musicApi.search(query, 20);
      setResults(tracks);
    } catch (e: any) {
      setError(e.message ?? 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = () => { setResults([]); setError(null); };

  return { results, isLoading, error, search, clear };
}
