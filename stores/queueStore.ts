import { create } from 'zustand';
import { MusicTrack } from '../lib/music';

export const QUEUE_SLOT_COUNT = 10;

type QueueStore = {
  slots: (MusicTrack | null)[];
  /** 웹: 큐 + 로 고른 뒤 책장에서 LP를 넣을 슬롯 인덱스 */
  webPendingSlotIndex: number | null;
  setWebPendingSlot: (index: number | null) => void;
  setSlot: (index: number, track: MusicTrack | null) => void;
  takeNextFromSlots: () => MusicTrack | null;
  clearAll: () => void;
};

const emptySlots = (): (MusicTrack | null)[] =>
  Array.from({ length: QUEUE_SLOT_COUNT }, () => null);

export const useQueueStore = create<QueueStore>((set, get) => ({
  slots: emptySlots(),
  webPendingSlotIndex: null,
  setWebPendingSlot: (index) => set({ webPendingSlotIndex: index }),
  setSlot: (index, track) => {
    if (index < 0 || index >= QUEUE_SLOT_COUNT) return;
    set((s) => {
      const next = [...s.slots];
      next[index] = track;
      return { slots: next };
    });
  },
  /** 재생 순서: 슬롯 인덱스 0 → 끝 (왼쪽부터 채우면 “먼저 넣은 칸”이 먼저 나감) */
  takeNextFromSlots: () => {
    const { slots } = get();
    for (let i = 0; i < slots.length; i++) {
      if (slots[i]) {
        const t = slots[i]!;
        set((s) => {
          const next = [...s.slots];
          next[i] = null;
          return { slots: next };
        });
        return t;
      }
    }
    return null;
  },
  clearAll: () => set({ slots: emptySlots(), webPendingSlotIndex: null }),
}));
