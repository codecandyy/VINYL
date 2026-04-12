/**
 * GestureCursor — 메인 씬 위에 손 위치를 표시하는 커서
 * gestureStore의 handScreenPos(0~1)를 실제 화면 좌표로 변환해 렌더한다.
 * 제스처 상태에 따라 외관이 달라진다:
 *   isFist    → 주황 채워진 원 (✊ 집는 중)
 *   isOpen    → 초록 열린 링 (🖐 놓기 가능)
 *   isIndexOnly → 노란 작은 점 (☝️ 탭 모드)
 *   idle       → 흰색 반투명 링
 */
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useGestureStore } from '../../stores/gestureStore';

export function GestureCursor() {
  if (Platform.OS !== 'web') return null;
  return <GestureCursorInner />;
}

function GestureCursorInner() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef   = useRef<HTMLDivElement>(null);
  const dotRef    = useRef<HTMLDivElement>(null);
  const labelRef  = useRef<HTMLDivElement>(null);

  // 마지막 렌더 상태를 추적 (React 리렌더 없이 직접 DOM 조작 → 60fps 추적)
  useEffect(() => {
    const unsubscribe = useGestureStore.subscribe((state) => {
      const el    = cursorRef.current;
      const ring  = ringRef.current;
      const dot   = dotRef.current;
      const label = labelRef.current;
      if (!el || !ring || !dot || !label) return;

      const { isDetected, handScreenPos, isFist, isOpen, isIndexOnly, gestureEnabled } = state;

      if (!gestureEnabled || !isDetected || !handScreenPos) {
        el.style.opacity = '0';
        return;
      }

      // 화면 좌표로 변환
      const x = handScreenPos.x * window.innerWidth;
      const y = handScreenPos.y * window.innerHeight;
      el.style.transform = `translate(${x - 24}px, ${y - 24}px)`;
      el.style.opacity = '1';

      // 제스처별 스타일
      if (isFist) {
        ring.style.border = '2.5px solid #FF6B35';
        ring.style.background = 'rgba(255, 107, 53, 0.18)';
        ring.style.boxShadow = '0 0 18px 4px rgba(255,107,53,0.45)';
        dot.style.background = '#FF6B35';
        dot.style.transform = 'translate(-50%, -50%) scale(1.4)';
        label.textContent = '✊';
        label.style.color = '#FF6B35';
      } else if (isOpen) {
        ring.style.border = '2.5px solid #4ADE80';
        ring.style.background = 'rgba(74, 222, 128, 0.10)';
        ring.style.boxShadow = '0 0 14px 2px rgba(74,222,128,0.35)';
        dot.style.background = '#4ADE80';
        dot.style.transform = 'translate(-50%, -50%) scale(0.7)';
        label.textContent = '🖐';
        label.style.color = '#4ADE80';
      } else if (isIndexOnly) {
        ring.style.border = '2px solid #FACC15';
        ring.style.background = 'rgba(250, 204, 21, 0.10)';
        ring.style.boxShadow = '0 0 10px 2px rgba(250,204,21,0.3)';
        dot.style.background = '#FACC15';
        dot.style.transform = 'translate(-50%, -50%) scale(0.5)';
        label.textContent = '☝️';
        label.style.color = '#FACC15';
      } else {
        ring.style.border = '1.5px solid rgba(255,255,255,0.55)';
        ring.style.background = 'rgba(255,255,255,0.04)';
        ring.style.boxShadow = '0 0 8px 1px rgba(255,255,255,0.15)';
        dot.style.background = 'rgba(255,255,255,0.7)';
        dot.style.transform = 'translate(-50%, -50%) scale(1)';
        label.textContent = '';
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div
      ref={cursorRef}
      style={{
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: 48,
        height: 48,
        pointerEvents: 'none' as const,
        zIndex: 9998,
        opacity: 0,
        // GPU 합성 레이어로 이동 (매 프레임 smooth)
        willChange: 'transform, opacity',
      }}
    >
      {/* 외곽 링 */}
      <div
        ref={ringRef}
        style={{
          position: 'absolute' as const,
          inset: 0,
          borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.55)',
          background: 'rgba(255,255,255,0.04)',
          transition: 'border-color 0.12s, background 0.12s, box-shadow 0.12s',
        }}
      />
      {/* 중앙 점 */}
      <div
        ref={dotRef}
        style={{
          position: 'absolute' as const,
          top: '50%',
          left: '50%',
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.7)',
          transform: 'translate(-50%, -50%)',
          transition: 'background 0.12s, transform 0.12s',
        }}
      />
      {/* 제스처 이모지 라벨 */}
      <div
        ref={labelRef}
        style={{
          position: 'absolute' as const,
          bottom: -18,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 13,
          lineHeight: '1',
          whiteSpace: 'nowrap' as const,
          userSelect: 'none' as const,
          pointerEvents: 'none' as const,
        }}
      />
    </div>
  );
}
