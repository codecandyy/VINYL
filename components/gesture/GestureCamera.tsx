/**
 * GestureCamera — 완전 자체 완결형
 * 웹캠 연결 + MediaPipe Hands + 랜드마크 오버레이 + gestureStore 업데이트
 *
 * 제스처 → 기능 매핑:
 *  FIST  (주먹 쥠)        : 책장 LP 집기 → 드래그 → 턴테이블 드롭
 *  OPEN  (손바닥 펼침)    : LP 놓기 (드롭)
 *  INDEX (검지만 폄)      : 더블탭 → 덱 모달 열기
 *  SWIPE left→right      : 덱 모달에서 다음 곡
 *  SWIPE right→left      : 덱 모달에서 이전 곡
 *
 * Platform.OS === 'web' + gestureEnabled 전용
 */
import React, { useRef, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useGestureStore } from '../../stores/gestureStore';

const W = 280;
const H = 210;

const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],          // 엄지
  [0, 5], [5, 6], [6, 7], [7, 8],          // 검지
  [0, 9], [9, 10], [10, 11], [11, 12],     // 중지
  [0, 13], [13, 14], [14, 15], [15, 16],   // 약지
  [0, 17], [17, 18], [18, 19], [19, 20],   // 소지
  [5, 9], [9, 13], [13, 17],               // 손바닥
];

// ── CDN에서 MediaPipe Hands.js 로드 ──────────────────────────────────
const MP_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands';

function injectScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`script load failed: ${src}`));
    document.head.appendChild(s);
  });
}

async function loadHandsClass(): Promise<any> {
  await injectScript(`${MP_CDN}/hands.js`);
  const H = (window as any).Hands;
  if (!H) throw new Error('window.Hands not found after script load');
  return H;
}

// ── 제스처 판별 ──────────────────────────────────────────────────────
function analyzeGesture(lm: { x: number; y: number; z: number }[]) {
  // 집기: 엄지 tip(4) ↔ 검지 tip(8) 정규화 거리
  const pinchDist = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
  const isPinching = pinchDist < 0.07;

  // 손가락 펼침: tip.y < pip.y - margin (화면 위가 y=0, 펼치면 tip이 pip보다 위)
  const ext = (tip: number, pip: number) => lm[tip].y < lm[pip].y - 0.02;
  const idxExt = ext(8, 6);
  const midExt = ext(12, 10);
  const rngExt = ext(16, 14);
  const pkyExt = ext(20, 18);

  const isOpen = idxExt && midExt && rngExt && pkyExt;
  const isIndexOnly = idxExt && !midExt && !rngExt && !pkyExt;
  // 주먹: 4개 손가락 모두 굽힘
  const isFist = !idxExt && !midExt && !rngExt && !pkyExt;

  // 손 위치: 손바닥 중심(9) 기준, 미러링(CSS scaleX(-1)에 맞춰 x 반전)
  // Y는 0.75 스케일로 화면 상단 쪽으로 보정 (웹캠 상단의 손이 화면 중하단으로 매핑되는 현상 방지)
  const handScreenPos = {
    x: 1 - lm[9].x,
    y: Math.max(0, Math.min(1, lm[9].y * 0.75)),
  };

  return { isPinching, isOpen, isIndexOnly, isFist, handScreenPos };
}

// ── 캔버스 그리기 ────────────────────────────────────────────────────
function drawHand(
  ctx: CanvasRenderingContext2D,
  lm: { x: number; y: number }[],
  isPinching: boolean,
  isOpen: boolean,
  isIndexOnly: boolean,
  isFist: boolean,
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const cw = ctx.canvas.width;
  const ch = ctx.canvas.height;

  // canvas는 scaleX(-1) CSS 적용 → 랜드마크 x를 그대로 사용
  const px = (i: number) => lm[i].x * cw;
  const py = (i: number) => lm[i].y * ch;

  const lineColor = isFist
    ? '#FF6B35'
    : isPinching
    ? '#FF2D78'
    : isOpen
    ? '#4ADE80'
    : 'rgba(255,255,255,0.85)';

  CONNECTIONS.forEach(([a, b]) => {
    const isIdxSeg = isIndexOnly && ([5, 6, 7, 8].includes(a) || [5, 6, 7, 8].includes(b));
    ctx.beginPath();
    ctx.moveTo(px(a), py(a));
    ctx.lineTo(px(b), py(b));
    ctx.strokeStyle = isIdxSeg ? '#FACC15' : lineColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // 집기 강조선 (pinch)
  if (isPinching) {
    ctx.beginPath();
    ctx.moveTo(px(4), py(4));
    ctx.lineTo(px(8), py(8));
    ctx.strokeStyle = '#FF2D78';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // 주먹 강조: 손목 원
  if (isFist) {
    ctx.beginPath();
    ctx.arc(px(0), py(0), 12, 0, Math.PI * 2);
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // 관절점
  for (let i = 0; i < lm.length; i++) {
    ctx.beginPath();
    ctx.arc(px(i), py(i), 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  // 제스처 라벨
  const label = isFist
    ? '✊ FIST'
    : isPinching
    ? '🤌 PINCH'
    : isOpen
    ? '🖐 OPEN'
    : isIndexOnly
    ? '☝️ INDEX'
    : '· · ·';
  ctx.font = '11px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText(label, cw - 8, 16);
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────
function GestureCameraInner({ deckOpen = false }: { deckOpen?: boolean }) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [trackFlash, setTrackFlash] = useState<string | null>(null);
  const trackFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 스와이프 감지용
  const posHistoryRef = useRef<number[]>([]);

  // 핀치 → 릴리즈 × 2 (덱 열기) 감지용
  const wasPinchingRef        = useRef(false);
  const pinchCycleCountRef    = useRef(0);
  const pinchCycleTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 양손 주먹 감지 (덱 열린 상태: 오른손=다음곡, 왼손=이전곡)
  const wasFistRightRef = useRef(false);
  const wasFistLeftRef  = useRef(false);

  // ── 트랙 이동 시 잠깐 레이블 표시 ──────────────────────────────────
  useEffect(() => {
    const unsub = useGestureStore.subscribe((state, prev) => {
      if (state.fistNextTrack !== prev.fistNextTrack && state.fistNextTrack) {
        setTrackFlash('▶▶ NEXT');
        if (trackFlashTimerRef.current) clearTimeout(trackFlashTimerRef.current);
        trackFlashTimerRef.current = setTimeout(() => setTrackFlash(null), 1200);
      }
      if (state.fistPrevTrack !== prev.fistPrevTrack && state.fistPrevTrack) {
        setTrackFlash('◀◀ PREV');
        if (trackFlashTimerRef.current) clearTimeout(trackFlashTimerRef.current);
        trackFlashTimerRef.current = setTimeout(() => setTrackFlash(null), 1200);
      }
    });
    return () => {
      unsub();
      if (trackFlashTimerRef.current) clearTimeout(trackFlashTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    let cancelled = false;
    let rafId: number | null = null;
    let stream: MediaStream | null = null;
    let handsInstance: any = null;
    let sending = false;

    let swipeResetTimer: ReturnType<typeof setTimeout> | null = null;

    // ── onResults 콜백 ──────────────────────────────────────────────
    function onResults(results: any) {
      if (cancelled) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const { setGestureState } = useGestureStore.getState();
      const allLm: { x: number; y: number; z: number }[][] =
        results.multiHandLandmarks ?? [];

      if (!allLm.length) {
        ctx?.clearRect(0, 0, W, H);
        setGestureState({
          isDetected: false,
          handScreenPos: null,
          landmarks: [],
          isPinching: false,
          isFist: false,
          isOpen: false,
          isIndexOnly: false,
        });
        posHistoryRef.current = [];
        wasPinchingRef.current = false;
        wasFistRightRef.current = false;
        wasFistLeftRef.current = false;
        return;
      }

      // 각 손 분석 — 여러 손을 모두 그림
      if (ctx) ctx.clearRect(0, 0, W, H);
      const analyzed = allLm.map((lm) => {
        const g = analyzeGesture(lm);
        if (ctx) drawHand(ctx, lm, g.isPinching, g.isOpen, g.isIndexOnly, g.isFist);
        return g;
      });

      // 주 손(index 0) — LP 잡기·스와이프·핀치 등에 계속 사용
      const primary = analyzed[0];
      const lm0 = allLm[0];
      const { isPinching, isOpen, isIndexOnly, isFist, handScreenPos } = primary;

      // ── 스와이프 감지 (손바닥 펼친 상태에서만) ──────────────────
      const hist = posHistoryRef.current;
      hist.push(handScreenPos.x);
      if (hist.length > 20) hist.shift();

      const { swipeDirection: curSwipe } = useGestureStore.getState();
      let swipeDirection = curSwipe;

      if (isOpen && hist.length >= 10 && !swipeDirection) {
        const delta = hist[hist.length - 1] - hist[0];
        if (Math.abs(delta) > 0.25) {
          swipeDirection = delta < 0 ? 'left-to-right' : 'right-to-left';
          posHistoryRef.current = [];
          if (swipeResetTimer) clearTimeout(swipeResetTimer);
          swipeResetTimer = setTimeout(() => {
            useGestureStore.getState().setGestureState({ swipeDirection: null });
          }, 600);
        }
      }

      // 핀치 × 2 → 덱 모달 열기는 비활성화
      // (덱 열기는 턴테이블 위에서 주먹 쥐기로만 가능 — VinylShopScene 제스처 구독에서 처리)
      wasPinchingRef.current = isPinching;

      // ── 양손 주먹 → 트랙 이동 (덱 열린 상태에서만) ─────────────
      // 미러링된 X 기준: raw lm[9].x (CSS scaleX(-1) 반영)
      //   x > 0.5 → 화면 오른쪽 = 사용자 오른손
      //   x ≤ 0.5 → 화면 왼쪽  = 사용자 왼손
      for (let i = 0; i < analyzed.length; i++) {
        const g = analyzed[i];
        const mirroredX = 1 - allLm[i][9].x;
        const isRightHand = mirroredX > 0.5;

        if (isRightHand) {
          if (g.isFist && !wasFistRightRef.current) {
            wasFistRightRef.current = true;
          } else if (!g.isFist && wasFistRightRef.current) {
            wasFistRightRef.current = false;
            useGestureStore.getState().setGestureState({ fistNextTrack: Date.now() });
          }
        } else {
          if (g.isFist && !wasFistLeftRef.current) {
            wasFistLeftRef.current = true;
          } else if (!g.isFist && wasFistLeftRef.current) {
            wasFistLeftRef.current = false;
            useGestureStore.getState().setGestureState({ fistPrevTrack: Date.now() });
          }
        }
      }

      setGestureState({
        isDetected: true,
        handScreenPos,
        landmarks: lm0,
        isPinching,
        isFist,
        isOpen,
        isIndexOnly,
        swipeDirection,
      });
    }

    // ── run: 웹캠 연결 + MediaPipe 초기화 ───────────────────────────
    async function run() {
      const video = videoRef.current;
      if (!video) return;

      // 1단계: 웹캠 연결 (제약 느슨하게 단계별 시도)
      const constraints: MediaStreamConstraints[] = [
        { video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false },
        { video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
        { video: true, audio: false },
      ];
      let lastErr: unknown;
      for (const c of constraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(c);
          break;
        } catch (err) {
          lastErr = err;
          stream = null;
        }
      }
      if (!stream) {
        console.error('[GestureCamera] 웹캠 접근 실패:', lastErr);
        return;
      }
      if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
      video.srcObject = stream;
      video.play().catch(() => {});

      // 2단계: MediaPipe 로드
      let HandsClass: any;
      try {
        HandsClass = await loadHandsClass();
        if (cancelled) return;
        console.info('[GestureCamera] MediaPipe Hands 로딩 성공');
      } catch (err) {
        console.warn('[GestureCamera] MediaPipe 로드 실패 (제스처 없이 동작):', err);
        return;
      }

      // 3단계: Hands 초기화
      handsInstance = new HandsClass({
        locateFile: (file: string) => `${MP_CDN}/${file}`,
      });
      handsInstance.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });
      handsInstance.onResults(onResults);

      // 4단계: RAF 감지 루프
      function detect() {
        if (cancelled) return;
        if (!sending && video && video.readyState >= 2 && handsInstance) {
          sending = true;
          handsInstance
            .send({ image: video })
            .then(() => { sending = false; })
            .catch(() => { sending = false; });
        }
        rafId = requestAnimationFrame(detect);
      }
      rafId = requestAnimationFrame(detect);
    }

    run().catch((e) => console.warn('[GestureCamera] run error:', e));

    return () => {
      cancelled = true;
      if (rafId != null) cancelAnimationFrame(rafId);
      if (swipeResetTimer) clearTimeout(swipeResetTimer);
      if (pinchCycleTimerRef.current) clearTimeout(pinchCycleTimerRef.current);
      stream?.getTracks().forEach((t) => t.stop());
      if (handsInstance) {
        try { handsInstance.close(); } catch {}
        handsInstance = null;
      }
      const video = videoRef.current;
      if (video) { video.srcObject = null; }
      useGestureStore.getState().setGestureState({
        isDetected: false,
        handScreenPos: null,
        landmarks: [],
        isPinching: false,
        isFist: false,
        isOpen: false,
        isIndexOnly: false,
        swipeDirection: null,
      });
    };
  }, []); // 마운트 시 1회

  return (
    <div
      style={{
        position: 'fixed' as const,
        top: 16,
        left: 16,
        width: W,
        height: H,
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.15)',
        backgroundColor: '#111',
        zIndex: 9999,
      }}
    >
      {/* 웹캠 영상 — autoPlay + muted + playsInline 필수 */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width={W}
        height={H}
        style={{
          display: 'block',
          width: W,
          height: H,
          objectFit: 'cover',
          transform: 'scaleX(-1)', // 좌우 미러링
        }}
      />
      {/* 랜드마크 캔버스 — video 위 absolute, 동일 미러링 */}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{
          position: 'absolute' as const,
          top: 0,
          left: 0,
          width: W,
          height: H,
          transform: 'scaleX(-1)', // video와 동일하게 미러링
          pointerEvents: 'none' as const,
        }}
      />
      {/* 좌하단 안내 레이블 */}
      <div
        style={{
          position: 'absolute' as const,
          bottom: 6,
          left: 8,
          fontFamily: 'monospace',
          fontSize: 9,
          color: 'rgba(255,255,255,0.35)',
          pointerEvents: 'none' as const,
          userSelect: 'none' as const,
        }}
      >
        {deckOpen
          ? '✊R next · ✊L prev · swipe↔track'
          : '🖐open · ✊grip · ↓drop · ✊ deck'}
      </div>
      {/* 트랙 이동 플래시 */}
      {trackFlash && (
        <div
          style={{
            position: 'absolute' as const,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            fontFamily: 'monospace',
            fontSize: 14,
            fontWeight: 'bold',
            color: '#fff',
            background: 'rgba(0,0,0,0.65)',
            padding: '4px 10px',
            borderRadius: 6,
            pointerEvents: 'none' as const,
            userSelect: 'none' as const,
            whiteSpace: 'nowrap' as const,
          }}
        >
          {trackFlash}
        </div>
      )}
    </div>
  );
}

export function GestureCamera({ deckOpen = false }: { deckOpen?: boolean }) {
  const gestureEnabled = useGestureStore((s) => s.gestureEnabled);
  if (Platform.OS !== 'web') return null;
  if (!gestureEnabled) return null;
  return <GestureCameraInner deckOpen={deckOpen} />;
}
