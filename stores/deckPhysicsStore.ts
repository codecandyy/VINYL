import { create } from 'zustand';

/** 턴테이블 바늘 각도 → 0(외곽)~1(내곽), 드롭 시 곡 슬롯 계산용 */
type DeckPhysicsStore = {
  tonearmGrooveNorm: number;
  setTonearmGrooveNorm: (n: number) => void;
};

export const useDeckPhysicsStore = create<DeckPhysicsStore>((set) => ({
  tonearmGrooveNorm: 0,
  setTonearmGrooveNorm: (n) =>
    set({ tonearmGrooveNorm: Math.max(0, Math.min(1, n)) }),
}));
