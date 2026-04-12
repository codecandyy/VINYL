/**
 * useHandGesture — MediaPipe Hands 래퍼
 * CDN에서 WASM 로드, getUserMedia로 웹캠 연결.
 * gestureStore를 매 프레임 업데이트.
 */
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useGestureStore } from '../stores/gestureStore';

// ── MediaPipe를 CDN에서 로드 (번들러 이슈 없는 런타임 로드) ──────────────
function loadMediaPipeScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') { reject(new Error('no document')); return; }
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function loadMediaPipe(): Promise<{ Hands: any }> {
  const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240';
  await loadMediaPipeScript(`${CDN}/hands.js`);
  const win = window as any;
  if (!win.Hands) throw new Error('MediaPipe Hands not found on window');
  return { Hands: win.Hands };
}

export function useHandGesture(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const gestureEnabled = useGestureStore((s) => s.gestureEnabled);
  const gestureEnabledRef = useRef(gestureEnabled);

  useEffect(() => {
    gestureEnabledRef.current = gestureEnabled;
  }, [gestureEnabled]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!gestureEnabled) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let rafId: number | null = null;
    let handsInstance: any = null;

    const posHistory: { x: number; y: number; t: number }[] = [];
    let swipeResetTimer: ReturnType<typeof setTimeout> | null = null;

    async function setup() {
      const video = videoRef.current;
      if (!video) return;

      // 웹캠 스트림 획득
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        });
      } catch (err) {
        console.warn('[useHandGesture] webcam access denied:', err);
        return;
      }
      if (cancelled) { stream?.getTracks().forEach((t) => t.stop()); return; }

      video.srcObject = stream;
      video.muted = true;
      try { await video.play(); } catch {}
      if (cancelled) return;

      // MediaPipe 로드
      let Hands: any;
      try {
        ({ Hands } = await loadMediaPipe());
      } catch (err) {
        console.warn('[useHandGesture] MediaPipe load failed:', err);
        return;
      }
      if (cancelled) return;

      handsInstance = new Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${file}`,
      });

      handsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      handsInstance.onResults((results: any) => {
        if (cancelled) return;
        const { setGestureState } = useGestureStore.getState();

        if (!results.multiHandLandmarks?.length) {
          setGestureState({
            isDetected: false,
            handScreenPos: null,
            landmarks: [],
            isPinching: false,
            isOpen: false,
            isIndexOnly: false,
          });
          return;
        }

        const lm: { x: number; y: number; z: number }[] = results.multiHandLandmarks[0];

        // 손 위치: 검지 MCP(5번), CSS scaleX(-1) 미러에 맞춰 x 반전
        const handPos = { x: 1 - lm[5].x, y: lm[5].y };

        // 집기: 엄지 tip(4) ↔ 검지 tip(8) 거리 (320×240 기준)
        const pinchDist = Math.hypot(
          (lm[4].x - lm[8].x) * 320,
          (lm[4].y - lm[8].y) * 240,
        );
        const isPinching = pinchDist < 50;

        // 손가락 펼침: tip Y < PIP Y (화면 Y는 위가 0)
        const ext = (tip: number, pip: number) => lm[tip].y < lm[pip].y;
        const idxExt = ext(8, 6);
        const midExt = ext(12, 10);
        const rngExt = ext(16, 14);
        const pkyExt = ext(20, 18);
        const isOpen = idxExt && midExt && rngExt && pkyExt;
        const isIndexOnly = idxExt && !midExt && !rngExt && !pkyExt;

        // 스와이프 감지 (미러 후 X 기준 왼→오른 = x 증가)
        const now = Date.now();
        posHistory.push({ x: handPos.x, y: handPos.y, t: now });
        while (posHistory.length > 15) posHistory.shift();
        while (posHistory.length > 0 && now - posHistory[0].t > 500) posHistory.shift();

        const { swipeDirection: curSwipe } = useGestureStore.getState();
        let swipeDirection = curSwipe;

        if (isOpen && posHistory.length >= 5 && !swipeDirection) {
          const oldest = posHistory[0];
          const dx = handPos.x - oldest.x;
          const dt = now - oldest.t;
          if (dx > 0.25 && dt < 400) {
            swipeDirection = 'left-to-right';
            if (swipeResetTimer) clearTimeout(swipeResetTimer);
            swipeResetTimer = setTimeout(() => {
              useGestureStore.getState().setGestureState({ swipeDirection: null });
              posHistory.length = 0;
            }, 500);
          }
        }

        setGestureState({
          isDetected: true,
          handScreenPos: handPos,
          landmarks: lm,
          isPinching,
          isOpen,
          isIndexOnly,
          swipeDirection,
        });
      });

      // RAF 루프로 프레임 전송
      async function sendFrame() {
        if (cancelled || !handsInstance || !video || video.readyState < 2) {
          if (!cancelled) rafId = requestAnimationFrame(sendFrame);
          return;
        }
        try {
          await handsInstance.send({ image: video });
        } catch {
          // 일시적 오류 무시
        }
        if (!cancelled) rafId = requestAnimationFrame(sendFrame);
      }
      rafId = requestAnimationFrame(sendFrame);
    }

    setup().catch((e) => console.warn('[useHandGesture] setup error:', e));

    return () => {
      cancelled = true;
      if (rafId != null) cancelAnimationFrame(rafId);
      if (swipeResetTimer) clearTimeout(swipeResetTimer);
      stream?.getTracks().forEach((t) => t.stop());
      handsInstance?.close().catch(() => {});
      handsInstance = null;
      useGestureStore.getState().setGestureState({
        isDetected: false,
        handScreenPos: null,
        landmarks: [],
        isPinching: false,
        isOpen: false,
        isIndexOnly: false,
        swipeDirection: null,
      });
    };
  }, [gestureEnabled, videoRef]);
}
