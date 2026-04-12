import { create } from 'zustand';

interface GestureState {
  // 손 감지 상태
  isDetected: boolean;
  handScreenPos: { x: number; y: number } | null; // 0~1 정규화
  landmarks: any[];

  // 제스처 상태
  isPinching: boolean;      // 엄지+검지 tip 거리 < 0.07 (정규화)
  isFist: boolean;          // 4개 손가락 모두 굽힘 → LP 잡기
  isOpen: boolean;          // 손가락 4개 펼쳐진 상태
  isIndexOnly: boolean;     // 검지만 펼쳐진 상태
  swipeDirection: 'left-to-right' | 'right-to-left' | null;

  // LP 드래그 상태
  heldLPId: string | null;
  gestureEnabled: boolean;

  // 덱 모달 열기 요청 (GestureCamera → room.tsx)
  openDeckRequest: number;  // Date.now() 로 업데이트할 때마다 트리거

  // 양손 주먹 → 트랙 이동 (덱 열린 상태에서만)
  fistNextTrack: number;    // 오른손 주먹 쥐었다 폄 → 다음 곡
  fistPrevTrack: number;    // 왼손 주먹 쥐었다 폄 → 이전 곡

  // 액션
  setGestureState: (s: Partial<GestureState>) => void;
  setHeldLP: (id: string | null) => void;
  toggleGesture: () => void;
}

export const useGestureStore = create<GestureState>((set) => ({
  isDetected: false,
  handScreenPos: null,
  landmarks: [],
  isPinching: false,
  isFist: false,
  isOpen: false,
  isIndexOnly: false,
  swipeDirection: null,
  heldLPId: null,
  gestureEnabled: true,
  openDeckRequest: 0,
  fistNextTrack: 0,
  fistPrevTrack: 0,
  setGestureState: (s) => set(s),
  setHeldLP: (id) => set({ heldLPId: id }),
  toggleGesture: () => set((state) => ({ gestureEnabled: !state.gestureEnabled })),
}));
