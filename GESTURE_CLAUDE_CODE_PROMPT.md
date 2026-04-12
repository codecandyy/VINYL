# VINYL — Hand Gesture Control System: Claude Code Implementation Prompt

## 미션

아래 지시를 완전히 구현하고, 구현 후 자가 검증 체크리스트를 전부 통과할 때까지 반복 수정한다.
**절대 중간에 멈추지 않는다. 모든 체크리스트 항목이 PASS가 될 때까지 스스로 코드를 점검·수정한다.**

---

## 현재 코드베이스 상태 (이미 구현된 것)

프로젝트 루트: `/Users/A/VINYL`

### 이미 존재하는 제스처 인프라

| 파일 | 내용 |
|------|------|
| `stores/gestureStore.ts` | Zustand 스토어: `isPinching`, `isOpen`, `isIndexOnly`, `swipeDirection('left-to-right'\|null)`, `gestureEnabled`, `heldLPId` |
| `components/gesture/GestureCamera.tsx` | 웹캠 + MediaPipe Hands CDN 로드 + 스켈레톤 오버레이. 제스처 분석 후 `gestureStore` 업데이트. 화면 좌상단 280×210 고정 PIP |
| `hooks/useHandGesture.ts` | 이전 버전 Hands 훅 (현재 GestureCamera.tsx가 대체) |
| `app/room.tsx` | GestureCamera 렌더, 제스처 토글 버튼, `swipeDirection === 'left-to-right'` → 다음 트랙 재생 이미 구현 |

### 핵심 연동 지점 (기존 드래그 시스템)

**파일: `components/scene/VinylShopScene.tsx`**

```typescript
// 타입
type DragState = { lp: LocalLP | undefined; albumData: AlbumData; sourceSlotIndex: number; };
type PendingLpPickup = { worldPos: [number,number,number]; startClientX: number; startClientY: number; lp: LocalLP|undefined; albumData: AlbumData; sourceSlotIndex: number; };

// 핵심 refs (컴포넌트 내부)
const dragTargetRef  = useRef(new THREE.Vector3(0, TT_DROP_Y_WORLD, 0));
const isDraggingRef  = useRef(false);
const isOverTtRef    = useRef(false);
const dragStateRef   = useRef<DragState | null>(null);
const pendingPickupRef = useRef<PendingLpPickup | null>(null);
const handleDropRef  = useRef(handleDrop);     // (clientX, clientY) => void
const cameraRef = useRef<THREE.Camera | null>(null);
const canvasRef = useRef<HTMLCanvasElement | null>(null);

// 픽업 함수 시그니처
handlePickupLP(worldPos, clientX, clientY, lp, albumData, shelfSlotIndex)

// window 레벨 이벤트 리스너
window.addEventListener('pointermove', onMove);  // isDraggingRef true이면 dragTargetRef 갱신
window.addEventListener('pointerup',   onUp);    // handleDrop 호출
window.addEventListener('pointercancel', onUp);

// onMove 내 e.buttons === 0 체크 (버튼 미입력 시 자동 드롭)
```

**R3F Canvas는 DOM pointer event를 그대로 수신해 내부 raycasting으로 Three.js 이벤트로 변환한다.**
→ `canvas.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true, clientX, clientY, pointerId:999, pressure:0.5}))` 를 호출하면
R3F가 raycasting → `LPSleeve.tsx`의 `handleLPPointerDown` → `handlePickupLP`가 호출된다.

---

## 구현해야 할 내용

### 1. `stores/gestureStore.ts` 수정

다음 필드를 추가/수정한다:

```typescript
// 수정: swipeDirection에 'right-to-left' 추가
swipeDirection: 'left-to-right' | 'right-to-left' | null;

// 추가: 주먹 쥠 (모든 손가락 굽힘)
isFist: boolean;

// 추가: 덱 모달 열기 요청 (GestureCamera → room.tsx)
openDeckRequest: number;  // 0이 아닌 숫자로 바뀔 때마다 덱 열기 (timestamp 사용)
```

초기값: `isFist: false`, `openDeckRequest: 0`

### 2. `components/gesture/GestureCamera.tsx` 수정

#### 2-A. `analyzeGesture` 함수에 `isFist` 추가

```typescript
function analyzeGesture(lm) {
  // 기존 코드 유지...
  const ext = (tip, pip) => lm[tip].y < lm[pip].y - 0.02;
  const idxExt = ext(8, 6);
  const midExt = ext(12, 10);
  const rngExt = ext(16, 14);
  const pkyExt = ext(20, 18);

  // 주먹: 4개 손가락 모두 굽힘 (이전에 isOpen이 아니고 isIndexOnly도 아닌 상태)
  const isFist = !idxExt && !midExt && !rngExt && !pkyExt;

  // 기존 pinch, isOpen, isIndexOnly 유지
  // ...
  return { isPinching, isOpen, isIndexOnly, isFist, handScreenPos };
}
```

#### 2-B. `drawHand` 함수에 `isFist` 라벨 추가

```typescript
const label = isFist ? '✊ FIST' : isPinching ? '🤌 PINCH' : isOpen ? '🖐 OPEN' : isIndexOnly ? '☝️ INDEX' : '· · ·';
const lineColor = isFist ? '#FF6B35' : isPinching ? '#FF2D78' : isOpen ? '#4ADE80' : 'rgba(255,255,255,0.85)';
```

#### 2-C. `onResults` 콜백에 isFist gestureStore 업데이트 추가

기존 `setGestureState` 호출에 `isFist` 포함.

#### 2-D. 오른→왼 스와이프 감지 (이전 곡)

기존 스와이프 감지 코드 (`delta < 0 ? 'left-to-right' : null`) 수정:

```typescript
if (isOpen && hist.length >= 10 && !swipeDirection) {
  const delta = hist[hist.length - 1] - hist[0];
  if (Math.abs(delta) > 0.25) {
    // mirrored x: 화면 왼→오른 이동 = delta 감소 (x 줄어듦) = 'left-to-right'
    //             화면 오른→왼 이동 = delta 증가 (x 늘어남) = 'right-to-left'
    swipeDirection = delta < 0 ? 'left-to-right' : 'right-to-left';
    posHistoryRef.current = [];
    if (swipeResetTimer) clearTimeout(swipeResetTimer);
    swipeResetTimer = setTimeout(() => {
      useGestureStore.getState().setGestureState({ swipeDirection: null });
    }, 600);
  }
}
```

#### 2-E. 주먹→LP 드래그 합성 포인터 이벤트

`GestureCameraInner` 컴포넌트에 다음 로직을 추가한다:

```typescript
// GestureCameraInner 안에 ref 추가
const prevIsFistRef = useRef(false);
const doubleTapCountRef = useRef(0);
const doubleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const indexOnlyFramesRef = useRef(0);

// onResults 함수 끝, setGestureState 호출 직후에 추가:
const { isFist, handScreenPos: hsp } = analyzeGesture(lm); // (이미 analyzeGesture 결과 사용 중)
const wasGripping = prevIsFistRef.current;

const gestureClientX = hsp.x * window.innerWidth;
const gestureClientY = hsp.y * window.innerHeight;

// --- LP 드래그 ---
if (!wasGripping && isFist) {
  // 주먹 시작 → pointerdown on R3F canvas
  const canvasEl = document.querySelector('canvas');
  if (canvasEl) {
    canvasEl.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, cancelable: true,
      clientX: gestureClientX,
      clientY: gestureClientY,
      pointerId: 999,
      pressure: 0.5,
      buttons: 1,
    }));
  }
} else if (wasGripping && isFist) {
  // 주먹 유지 → pointermove on window (기존 onMove 핸들러가 처리)
  window.dispatchEvent(new PointerEvent('pointermove', {
    bubbles: true, cancelable: true,
    clientX: gestureClientX,
    clientY: gestureClientY,
    pointerId: 999,
    buttons: 1,  // 반드시 1: onMove의 e.buttons===0 체크 통과
  }));
} else if (wasGripping && !isFist) {
  // 주먹 해제 → pointerup on window
  window.dispatchEvent(new PointerEvent('pointerup', {
    bubbles: true, cancelable: true,
    clientX: gestureClientX,
    clientY: gestureClientY,
    pointerId: 999,
    buttons: 0,
  }));
}
prevIsFistRef.current = isFist;

// --- 검지 더블탭 → 덱 모달 ---
// isIndexOnly 상태에서 손 Y 위치가 빠르게 아래→위→아래→위 (2회 탭 모션) 감지
// 구현 방법: isIndexOnly 연속 프레임 중 Y 속도 방향 전환 2회 = 더블탭
if (isIndexOnly) {
  indexOnlyFramesRef.current += 1;
  // 간단한 더블탭: isIndexOnly가 감지된 직후 0.3초 이내에 다시 isIndexOnly가 나타나면 더블탭
  // → doubleTapCountRef 로 관리
} else {
  if (indexOnlyFramesRef.current > 2 && indexOnlyFramesRef.current < 20) {
    // 짧은 탭 감지
    doubleTapCountRef.current += 1;
    if (doubleTapCountRef.current >= 2) {
      doubleTapCountRef.current = 0;
      useGestureStore.getState().setGestureState({
        openDeckRequest: Date.now(),
      });
    }
    if (doubleTapTimerRef.current) clearTimeout(doubleTapTimerRef.current);
    doubleTapTimerRef.current = setTimeout(() => {
      doubleTapCountRef.current = 0;
    }, 800);
  }
  indexOnlyFramesRef.current = 0;
}
```

**주의**: `onResults` 안의 `analyzeGesture` 호출 결과를 재사용해 `isFist` 등을 꺼낸다. 이미 구조분해되어 있으면 그 변수를 그대로 사용한다.

### 3. `app/room.tsx` 수정

#### 3-A. 이전 곡 스와이프 (`right-to-left`)

기존 `swipeDirection === 'left-to-right'` useEffect 아래에 추가:

```typescript
// 오른→왼 스와이프 → 이전 곡
useEffect(() => {
  if (!deckOpen) return;
  if (swipeDirection !== 'right-to-left') return;
  setGestureState({ swipeDirection: null });

  const ps = usePlayerStore.getState();
  const deck = ps.sideTracksForDeck;
  const nowIdx = ps.playingSideIndex;

  if (!deck || deck.length === 0) return;

  for (let i = nowIdx - 1; i >= 0; i--) {
    if (deck[i]?.previewUrl) {
      void playTrack(deck[i]!, { sideAlbumTracks: deck, initialSideIndex: i });
      setToast({ msg: '◀ 이전 곡', type: 'info' });
      return;
    }
  }
  setToast({ msg: '첫 번째 곡입니다', type: 'info' });
}, [swipeDirection, deckOpen, playTrack, setGestureState]);
```

#### 3-B. `openDeckRequest` 구독 (덱 모달 열기)

```typescript
const { gestureEnabled, swipeDirection, toggleGesture, setGestureState, openDeckRequest } = useGestureStore();

useEffect(() => {
  if (!openDeckRequest) return;
  setDeckOpen(true);
}, [openDeckRequest]);
```

`useGestureStore` 구독에 `openDeckRequest` 추가.

---

## 구현 후 자가 검증 체크리스트

아래 항목을 **코드 레벨**에서 직접 확인하고, 문제가 있으면 바로 수정한다.
전부 PASS될 때까지 반복한다.

### [CHECK-1] gestureStore 타입 일관성
- [ ] `swipeDirection` 타입이 `'left-to-right' | 'right-to-left' | null` 으로 선언됐는가?
- [ ] `isFist: boolean` 초기값 `false`로 선언됐는가?
- [ ] `openDeckRequest: number` 초기값 `0`으로 선언됐는가?
- [ ] `room.tsx`에서 `openDeckRequest` destructure 후 `useEffect` 구독이 있는가?

### [CHECK-2] GestureCamera 제스처 분류
- [ ] `analyzeGesture` 반환값에 `isFist` 포함됐는가?
- [ ] `isFist = !idxExt && !midExt && !rngExt && !pkyExt` 공식인가?
- [ ] `setGestureState({ ..., isFist })` 호출에 포함됐는가?
- [ ] 캔버스 라벨: `isFist` 일 때 `'✊ FIST'` 텍스트가 출력되는가?
- [ ] 스와이프 `delta > 0` → `'right-to-left'` 처리가 있는가?

### [CHECK-3] 합성 포인터 이벤트
- [ ] `prevIsFistRef` 선언이 컴포넌트 레벨(useEffect 바깥)에 있는가?
- [ ] 주먹 시작 시 `canvas.dispatchEvent(pointerdown)` 호출되는가?
- [ ] 주먹 유지 시 `window.dispatchEvent(pointermove { buttons:1 })` 호출되는가?
- [ ] 주먹 해제 시 `window.dispatchEvent(pointerup)` 호출되는가?
- [ ] `pointerId: 999` 로 세 이벤트가 통일됐는가?
- [ ] `pointermove`의 `buttons: 1` 이 설정됐는가? (없으면 VinylShopScene의 `e.buttons===0` 체크에서 드래그가 즉시 종료됨)

### [CHECK-4] 이전 곡 스와이프
- [ ] `room.tsx`에 `swipeDirection === 'right-to-left'` useEffect가 있는가?
- [ ] `deckOpen` 조건 체크 포함됐는가?
- [ ] `deck[i - 1]` 방향 루프 (`nowIdx - 1` 에서 `0`으로)인가?
- [ ] 스와이프 즉시 `setGestureState({ swipeDirection: null })`로 리셋하는가?

### [CHECK-5] 더블탭 → 덱 모달
- [ ] `doubleTapCountRef`, `doubleTapTimerRef`, `indexOnlyFramesRef` 세 ref가 선언됐는가?
- [ ] `indexOnlyFrames` 2~20 범위에서 탭 1회 카운트 되는가?
- [ ] 2회 누적 시 `openDeckRequest: Date.now()` 업데이트 되는가?
- [ ] 0.8초 타이머로 카운트 리셋이 되는가?

### [CHECK-6] TypeScript 린트 에러
- [ ] `npx tsc --noEmit` 실행 후 gesture 관련 파일에 에러 없는가?
  - 에러 있으면 바로 수정하고 재검증.

### [CHECK-7] 카메라 권한 거부 fallback
- [ ] `GestureCamera.tsx`의 `getUserMedia` 실패 시 콘솔 경고만 출력하고 앱이 정상 동작하는가?
- [ ] 제스처 없이 기존 마우스 드래그가 그대로 동작하는가?

### [CHECK-8] room.tsx 임포트 일관성
- [ ] `openDeckRequest`가 `useGestureStore` destructure에 포함됐는가?
- [ ] `useGestureStore`의 `swipeDirection` 타입이 `'right-to-left'` 포함 버전으로 업데이트됐는가?

---

## 자가 반복 지시

1. 위 모든 변경을 구현한다.
2. CHECK-1 ~ CHECK-8을 순서대로 확인한다.
3. 실패 항목이 있으면 즉시 해당 파일을 수정한다.
4. 수정 후 해당 CHECK를 다시 확인한다.
5. 전부 PASS되면 완료. 그 전까지 반복한다.
6. 최종적으로 수정된 파일 목록과 각 CHECK 결과를 요약해서 출력한다.

---

## 절대 하지 말 것

- `useHandGesture.ts` 파일 수정 금지 (사용되지 않는 구버전)
- `GestureCamera.tsx`의 기존 웹캠 스트리밍 / MediaPipe 로드 / 스켈레톤 그리기 로직 제거 금지
- `room.tsx`의 기존 next-track 스와이프 로직 제거 금지
- 플랜 파일(`GESTURE_CLAUDE_CODE_PROMPT.md`) 수정 금지
