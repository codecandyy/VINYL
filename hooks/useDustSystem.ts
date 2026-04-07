import { useEffect, useCallback } from 'react';
import { useRoomStore } from '../stores/roomStore';
import { useCollectionStore } from '../stores/collectionStore';
import { localCollection } from '../lib/localCollection';

const DUST_PER_DAY = 10;
const ROOM_STATE_KEY = 'vinyl_room_state_v1';

async function getRoomState() {
  try {
    const { Platform } = require('react-native');
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      raw = localStorage.getItem(ROOM_STATE_KEY);
    } else {
      const AS = require('@react-native-async-storage/async-storage').default;
      raw = await AS.getItem(ROOM_STATE_KEY);
    }
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

async function setRoomState(state: object) {
  try {
    const { Platform } = require('react-native');
    const val = JSON.stringify(state);
    if (Platform.OS === 'web') {
      localStorage.setItem(ROOM_STATE_KEY, val);
    } else {
      const AS = require('@react-native-async-storage/async-storage').default;
      await AS.setItem(ROOM_STATE_KEY, val);
    }
  } catch {}
}

export function useDustSystem() {
  const { dustLevel, setDustLevel, coinBalance, setCoinBalance } = useRoomStore();
  const { updateLP, lps } = useCollectionStore();

  useEffect(() => {
    initRoomState();
  }, []);

  const initRoomState = async () => {
    const saved = await getRoomState();
    const now = Date.now();

    if (saved) {
      const daysSince = (now - saved.lastVisited) / (1000 * 60 * 60 * 24);
      const newDust = Math.min(100, Math.floor((saved.dustLevel ?? 0) + daysSince * DUST_PER_DAY));
      setDustLevel(newDust);
      setCoinBalance(saved.coinBalance ?? 3);

      if (newDust >= 100 && (saved.dustLevel ?? 0) < 100) {
        applyRandomDamage();
      }
    } else {
      setDustLevel(0);
      setCoinBalance(3);
    }

    await setRoomState({
      dustLevel,
      coinBalance,
      lastVisited: now,
    });
  };

  const cleanRoom = useCallback(async () => {
    setDustLevel(0);
    const saved = await getRoomState();
    await setRoomState({ ...(saved ?? {}), dustLevel: 0, lastVisited: Date.now() });
  }, [setDustLevel]);

  const spendCoin = useCallback(async (amount = 1): Promise<boolean> => {
    if (coinBalance < amount) return false;
    const newBalance = coinBalance - amount;
    setCoinBalance(newBalance);
    const saved = await getRoomState();
    await setRoomState({ ...(saved ?? {}), coinBalance: newBalance });
    return true;
  }, [coinBalance, setCoinBalance]);

  const earnCoin = useCallback(async (amount = 1) => {
    const newBalance = coinBalance + amount;
    setCoinBalance(newBalance);
    const saved = await getRoomState();
    await setRoomState({ ...(saved ?? {}), coinBalance: newBalance });
  }, [coinBalance, setCoinBalance]);

  const applyRandomDamage = async () => {
    const undamaged = lps.filter(l => !l.isDamaged);
    if (undamaged.length === 0) return;
    const target = undamaged[Math.floor(Math.random() * undamaged.length)];
    updateLP(target.id, { isDamaged: true });
    await localCollection.markDamaged(target.id);
  };

  const dustParticleCount = Math.floor((dustLevel / 100) * 200);
  const showScratchOverlay = dustLevel >= 70;

  return { dustLevel, cleanRoom, dustParticleCount, showScratchOverlay, spendCoin, earnCoin };
}
