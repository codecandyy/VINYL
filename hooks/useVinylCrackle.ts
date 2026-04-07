import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { usePlayerStore } from '../stores/playerStore';

/**
 * LP 크랙클 루프. `soundUrl` 없으면 아무 것도 하지 않음.
 * 사용 예: `useVinylCrackle(require('../assets/crackle.mp3'))` (번들에 파일 추가 후)
 */
export function useVinylCrackle(soundUrl?: string) {
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const howlRef = useRef<Howl | null>(null);

  useEffect(() => {
    if (!soundUrl) return;
    const h = new Howl({
      src: [soundUrl],
      loop: true,
      volume: 0.07,
      html5: true,
    });
    howlRef.current = h;
    return () => {
      h.stop();
      h.unload();
      howlRef.current = null;
    };
  }, [soundUrl]);

  useEffect(() => {
    const h = howlRef.current;
    if (!h) return;
    if (isPlaying) {
      if (!h.playing()) h.play();
    } else {
      h.stop();
    }
  }, [isPlaying]);
}
