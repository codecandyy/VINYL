import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { VinylRecord } from './VinylRecord';
import { AlbumData } from '../../lib/albumTexture';
import { MusicTrack } from '../../lib/music';
import { usePlayerStore } from '../../stores/playerStore';
import { filterDeckPreviewTracks } from '../../lib/localCollection';
import { useDeckPhysicsStore } from '../../stores/deckPhysicsStore';
import { audioEngine } from '../../lib/audioEngine';
import { haptics } from '../../lib/haptics';

// 바늘암 Y 회전 범위 (바깥쪽 홈 → 안쪽 홈)
const SCRUB_OUTER = 0.0;         // 곡 시작 (외주 홈)
const SCRUB_INNER = 0.48;        // 곡 끝 (내주 홈)
const SCRUB_SENSITIVITY = 0.0042; // px → 라디안 (모달·웹에서 드래그 잡기 쉽게)
const HAPTIC_TICK_ANGLE = 0.04;  // 이 각도마다 틱 햅틱 (≈2.3°)

type Props = {
  currentAlbum: AlbumData | null;
  isPlaying: boolean;
  position?: [number, number, number];
  isDropTarget?: boolean;
  /** 본체/플래터 클릭 시 덱 UI (미니 프리뷰에서는 생략) */
  onOpenDeck?: () => void;
  /** 멀티 트랙 LP에서 바늘 놓을 때 해당 미리듣기 재생 */
  onPlayGrooveTrack?: (track: MusicTrack, grooveIndex: number) => void;
  /**
   * 덱 모달 탑다운 등: 재생 중이 아니어도 로드된 트랙이 있으면 톤암으로 시크 허용
   */
  tonearmScrubWhenStopped?: boolean;
  /** 앨범 없음 placeholder — 라벨·비닐 대비만 살짝 올림 */
  placeholderVinyl?: boolean;
  /** 바늘 끝을 클릭(드래그 아닌 단순 탭)했을 때 호출 */
  onNeedleTipClick?: () => void;
};

export function Turntable({
  currentAlbum,
  isPlaying,
  position = [0, 0, 0],
  isDropTarget = false,
  onOpenDeck,
  onPlayGrooveTrack,
  tonearmScrubWhenStopped = false,
  placeholderVinyl = false,
  onNeedleTipClick,
}: Props) {
  const tonearmRef    = useRef<THREE.Group>(null);
  const vinylGroupRef = useRef<THREE.Group>(null);
  const wobblePhase   = useRef(0);
  const prevIsPlaying = useRef(false);

  // LP 착지 애니메이션
  const landingYRef      = useRef(0);
  const prevAlbumTitle   = useRef<string | null>(null);

  // ── 스크러빙 상태 ─────────────────────────────────────────────────────
  const [isScrubbing, setIsScrubbing]   = useState(false);
  const isScrubbingRef    = useRef(false);    // window 핸들러용 (stale-closure 방지)
  const scrubAngleRef     = useRef(SCRUB_OUTER);
  const scrubStartXRef    = useRef(0);
  const scrubStartAngle   = useRef(SCRUB_OUTER);
  const lastHapticAngle   = useRef(SCRUB_OUTER);
  const scrubPointerIdRef = useRef<number | null>(null);

  const { gl } = useThree();

  // 재생 위치 — 객체 리터럴 셀렉터는 매 스냅샷마다 새 참조라 React 19 + Zustand에서 무한 루프 유발
  const positionMs = usePlayerStore((s) => s.positionMs);
  const durationMs = usePlayerStore((s) => s.durationMs);
  const playingSideIndex = usePlayerStore((s) => s.playingSideIndex);
  const sideTracksForDeck = usePlayerStore((s) => s.sideTracksForDeck);
  const playableCount = filterDeckPreviewTracks(sideTracksForDeck ?? undefined).length;

  const onPlayGrooveRef = useRef(onPlayGrooveTrack);
  onPlayGrooveRef.current = onPlayGrooveTrack;

  // ── 바늘 착지 햅틱 (재생 시작 순간 한 번) ─────────────────────────────
  useEffect(() => {
    if (isPlaying && !prevIsPlaying.current) {
      // 바늘 내려오는 애니메이션(~400ms) 후 햅틱
      const id = setTimeout(() => haptics.needle(), 420);
      return () => clearTimeout(id);
    }
    if (!isPlaying && prevIsPlaying.current) {
      if (!tonearmScrubWhenStopped) {
        const sides = usePlayerStore.getState().sideTracksForDeck;
        const playN = filterDeckPreviewTracks(sides ?? undefined).length;
        const multiSlots = (sides?.length ?? 0) > 1;
        if (!sides || playN <= 1 || !multiSlots) scrubAngleRef.current = SCRUB_OUTER;
      }
    }
    prevIsPlaying.current = isPlaying;
  }, [isPlaying, tonearmScrubWhenStopped]);

  // ── useFrame: LP 착지 + 바늘암 애니메이션 ────────────────────────────
  useFrame((_, delta) => {
    if (!tonearmRef.current) return;

    // LP 착지 감지 — 새 앨범 드롭 시 위에서 내려오는 애니메이션
    const title = currentAlbum?.title ?? null;
    if (title !== prevAlbumTitle.current) {
      if (title !== null) landingYRef.current = 0.38;
      prevAlbumTitle.current = title;
    }
    if (vinylGroupRef.current) {
      if (landingYRef.current > 0.001) {
        landingYRef.current = THREE.MathUtils.lerp(landingYRef.current, 0, delta * 11);
        vinylGroupRef.current.position.y = landingYRef.current;
      } else {
        landingYRef.current = 0;
        vinylGroupRef.current.position.y = 0;
      }
    }

    // Z: 바늘 올림/내림 (isPlaying)
    const targetZ = isPlaying ? -0.30 : 0;
    tonearmRef.current.rotation.z +=
      (targetZ - tonearmRef.current.rotation.z) * Math.min(1, delta * 4.0);

    // X: 재생 중 미세 흔들림
    if (isPlaying) {
      wobblePhase.current += delta;
      tonearmRef.current.rotation.x =
        Math.sin(wobblePhase.current * 48) * 0.008 +
        Math.sin(wobblePhase.current * 11) * 0.003;
    } else {
      tonearmRef.current.rotation.x *= 0.92;
    }

    // LP 드롭 시 바늘 각도 읽기 — 값 변화가 클 때만 store write (불필요한 60fps 갱신 방지)
    const span = SCRUB_INNER - SCRUB_OUTER;
    const grooveNorm = span > 0 ? (scrubAngleRef.current - SCRUB_OUTER) / span : 0;
    const prevGrooveNorm = useDeckPhysicsStore.getState().tonearmGrooveNorm;
    if (Math.abs(grooveNorm - prevGrooveNorm) > 0.005) {
      useDeckPhysicsStore.getState().setTonearmGrooveNorm(grooveNorm);
    }

    // Y: 단일 트랙=진행도, 멀티=현재 슬롯 중앙, 정지·단일만 외곽 리셋
    if (!isScrubbingRef.current) {
      const sides = usePlayerStore.getState().sideTracksForDeck;
      const playable = filterDeckPreviewTracks(sides ?? undefined);
      const grooveMulti = playable.length > 1;

      if (isPlaying && grooveMulti && sides && sides.length > 1) {
        const n = sides.length;
        const u = (playingSideIndex + 0.5) / n;
        const targetY = SCRUB_OUTER + u * span;
        scrubAngleRef.current = THREE.MathUtils.lerp(
          scrubAngleRef.current,
          targetY,
          Math.min(1, delta * 5)
        );
      } else if (isPlaying && durationMs > 0) {
        const progress = Math.min(1, positionMs / durationMs);
        const targetY = SCRUB_OUTER + progress * span;
        scrubAngleRef.current = THREE.MathUtils.lerp(
          scrubAngleRef.current,
          targetY,
          delta * 2.0
        );
      } else if (
        !grooveMulti &&
        tonearmScrubWhenStopped &&
        durationMs > 0
      ) {
        const progress = Math.min(1, positionMs / durationMs);
        const targetY = SCRUB_OUTER + progress * span;
        scrubAngleRef.current = THREE.MathUtils.lerp(
          scrubAngleRef.current,
          targetY,
          delta * 4.0
        );
      } else if (!grooveMulti) {
        scrubAngleRef.current = THREE.MathUtils.lerp(
          scrubAngleRef.current,
          SCRUB_OUTER,
          delta * 3.0
        );
      }

      tonearmRef.current.rotation.y = scrubAngleRef.current;
    }
  });

  // ── 바늘 tip 클릭 vs 드래그 판별 ────────────────────────────────────
  const tipClickStartX = useRef(0);
  const tipClickStartY = useRef(0);
  const tipClickPending = useRef(false);
  const NEEDLE_CLICK_THRESHOLD_PX = 5;

  const onNeedleTipClickRef = useRef(onNeedleTipClick);
  onNeedleTipClickRef.current = onNeedleTipClick;

  // ── 스크러빙 포인터다운 ───────────────────────────────────────────────
  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    const sides = usePlayerStore.getState().sideTracksForDeck;
    const playN = filterDeckPreviewTracks(sides ?? undefined).length;
    const grooveMulti = playN > 1 && (sides?.length ?? 0) > 1;
    const dur = audioEngine.getDuration();
    const scrubWhenStopped =
      tonearmScrubWhenStopped && dur > 0 && !grooveMulti;
    // 멀티터치 무시
    if (e.nativeEvent.pointerType === 'touch' && !e.nativeEvent.isPrimary) return;
    e.stopPropagation();

    // 클릭 감지 초기화 (scrub 가능 여부와 무관하게 항상 기록)
    tipClickStartX.current = e.nativeEvent.clientX;
    tipClickStartY.current = e.nativeEvent.clientY;
    tipClickPending.current = true;

    if (!isPlaying && !grooveMulti && !scrubWhenStopped) return;

    const pid = e.nativeEvent.pointerId;
    scrubPointerIdRef.current = pid;
    try {
      gl.domElement.setPointerCapture(pid);
    } catch {
      /* 일부 브라우저/환경 */
    }

    isScrubbingRef.current = true;
    setIsScrubbing(true);
    scrubStartXRef.current    = e.nativeEvent.clientX;
    scrubStartAngle.current   = scrubAngleRef.current;
    lastHapticAngle.current   = scrubAngleRef.current;

    if (typeof document !== 'undefined') document.body.style.cursor = 'ew-resize';
    audioEngine.pauseForScrub();
  }, [isPlaying, tonearmScrubWhenStopped, gl]);

  // ── 스크러빙 window 이벤트 (포인터 이탈 후에도 동작) ─────────────────
  useEffect(() => {
    if (!isScrubbing) return;

    const handleMove = (e: PointerEvent) => {
      // 이동 거리가 임계값 초과하면 클릭 판별 취소
      if (tipClickPending.current) {
        const dx = e.clientX - tipClickStartX.current;
        const dy = e.clientY - tipClickStartY.current;
        if (Math.sqrt(dx * dx + dy * dy) >= NEEDLE_CLICK_THRESHOLD_PX) {
          tipClickPending.current = false;
        }
      }
      if (!isScrubbingRef.current || !tonearmRef.current) return;

      const deltaX   = e.clientX - scrubStartXRef.current;
      const newAngle = Math.max(
        SCRUB_OUTER,
        Math.min(SCRUB_INNER, scrubStartAngle.current + deltaX * SCRUB_SENSITIVITY)
      );
      scrubAngleRef.current = newAngle;
      tonearmRef.current.rotation.y = newAngle;

      const sides = usePlayerStore.getState().sideTracksForDeck;
      const playable = filterDeckPreviewTracks(sides ?? undefined);
      const grooveMulti = playable.length > 1 && (sides?.length ?? 0) > 1;
      if (!grooveMulti) {
        const dur = audioEngine.getDuration();
        if (dur > 0) {
          const progress = (newAngle - SCRUB_OUTER) / (SCRUB_INNER - SCRUB_OUTER);
          audioEngine.seekTo(progress * dur);
        }
      }

      if (Math.abs(newAngle - lastHapticAngle.current) > HAPTIC_TICK_ANGLE) {
        haptics.scrubTick();
        lastHapticAngle.current = newAngle;
      }
    };

    const handleUp = (e: PointerEvent) => {
      // 바늘 tip 클릭 감지: 이동 없이 up 된 경우
      if (tipClickPending.current) {
        tipClickPending.current = false;
        const dx = e.clientX - tipClickStartX.current;
        const dy = e.clientY - tipClickStartY.current;
        if (Math.sqrt(dx * dx + dy * dy) < NEEDLE_CLICK_THRESHOLD_PX) {
          // 실제 클릭 — scrub 중이면 정리 후 groove view 열기
          if (isScrubbingRef.current) {
            const pid = scrubPointerIdRef.current;
            scrubPointerIdRef.current = null;
            if (pid != null) { try { gl.domElement.releasePointerCapture(pid); } catch { /**/ } }
            isScrubbingRef.current = false;
            setIsScrubbing(false);
            if (typeof document !== 'undefined') document.body.style.cursor = 'default';
            audioEngine.resumeFromScrub();
          }
          onNeedleTipClickRef.current?.();
          return;
        }
      }

      if (!isScrubbingRef.current) return;
      const pid = scrubPointerIdRef.current;
      scrubPointerIdRef.current = null;
      if (pid != null) {
        try {
          gl.domElement.releasePointerCapture(pid);
        } catch {
          /* */
        }
      }
      isScrubbingRef.current = false;
      setIsScrubbing(false);
      if (typeof document !== 'undefined') document.body.style.cursor = 'default';

      const sides = usePlayerStore.getState().sideTracksForDeck;
      const playable = filterDeckPreviewTracks(sides ?? undefined);
      const grooveMulti = playable.length > 1 && (sides?.length ?? 0) > 1;
      if (grooveMulti && sides && sides.length > 0) {
        const span = SCRUB_INNER - SCRUB_OUTER;
        const u =
          span > 0
            ? (scrubAngleRef.current - SCRUB_OUTER) / span
            : 0;
        const n = sides.length;
        let slotIdx = Math.min(n - 1, Math.max(0, Math.floor(u * n + 1e-9)));
        let t = sides[slotIdx];
        if (!t.previewUrl) {
          let best = playable[0];
          let bestD = Infinity;
          for (const p of playable) {
            const pi = sides.findIndex((s) => s.id === p.id);
            if (pi >= 0) {
              const d = Math.abs(pi - slotIdx);
              if (d < bestD) {
                bestD = d;
                best = p;
              }
            }
          }
          t = best;
          slotIdx = Math.max(0, sides.findIndex((s) => s.id === t.id));
        }
        if (t?.previewUrl && onPlayGrooveRef.current) {
          onPlayGrooveRef.current(t, slotIdx);
        } else {
          audioEngine.resumeFromScrub();
        }
      } else {
        audioEngine.resumeFromScrub();
      }
      haptics.needle();
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isScrubbing, gl]);

  const handleOpenDeck = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!onOpenDeck) return;
      e.stopPropagation();
      onOpenDeck();
    },
    [onOpenDeck]
  );

  const blockDeckOpen = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
  }, []);

  return (
    <group position={position}>
      {/* ── 본체 — 매트 블랙 ── */}
      <mesh onClick={handleOpenDeck}>
        <boxGeometry args={[0.88, 0.07, 0.7]} />
        <meshStandardMaterial color="#0D0D0D" roughness={0.88} metalness={0.05} />
      </mesh>

      {/* 상판 — 딥 블랙 */}
      <mesh position={[0, 0.04, 0]} onClick={handleOpenDeck}>
        <boxGeometry args={[0.88, 0.006, 0.7]} />
        <meshStandardMaterial color="#111111" roughness={0.72} metalness={0.08} />
      </mesh>

      {/* 금속 엣지 트림 — 크롬 실버 */}
      {([-0.44, 0.44] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <boxGeometry args={[0.005, 0.078, 0.705]} />
          <meshStandardMaterial color="#C0C0C8" metalness={0.92} roughness={0.08} />
        </mesh>
      ))}

      {/* ── 플래터 ── */}
      <mesh position={[0, 0.046, 0]} onClick={handleOpenDeck}>
        <cylinderGeometry args={[0.265, 0.265, 0.01, 48]} />
        <meshStandardMaterial color="#111" roughness={0.55} metalness={0.45} />
      </mesh>

      {/* 플래터 외곽 링 — 실버 (토러스 기본 XY → XZ로 눕힘) */}
      <mesh position={[0, 0.052, 0]} rotation={[Math.PI / 2, 0, 0]} onClick={handleOpenDeck}>
        <torusGeometry args={[0.258, 0.005, 8, 56]} />
        <meshStandardMaterial color="#C0C0C8" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* ── LP판 — 드롭 시 위에서 착지 애니메이션 ── */}
      <group ref={vinylGroupRef} position={[0, 0.058, 0]} onClick={handleOpenDeck}>
        <VinylRecord
          album={currentAlbum}
          isPlaying={isPlaying}
          placeholderDisc={placeholderVinyl}
          grooveMode={playableCount > 1}
          grooveSegmentCount={
            playableCount > 1
              ? Math.min(sideTracksForDeck?.length ?? 0, 36)
              : 0
          }
        />
      </group>

      {/* ── 스핀들 — 크롬 ── */}
      <mesh position={[0, 0.088, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.038, 12]} />
        <meshStandardMaterial color="#D0D0D8" metalness={0.96} roughness={0.04} />
      </mesh>

      {/* ── 바늘 암 (Tonearm) — 스크러빙 가능 / 덱 열기 이벤트는 여기서 차단 ── */}
      <group
        ref={tonearmRef}
        position={[0.32, 0.058, -0.22]}
        onClick={blockDeckOpen}
        onPointerOver={(e) => {
          const sides = usePlayerStore.getState().sideTracksForDeck;
          const playN = filterDeckPreviewTracks(sides ?? undefined).length;
          const grooveMulti = playN > 1 && (sides?.length ?? 0) > 1;
          const dur = audioEngine.getDuration();
          const canHoverScrub =
            isPlaying ||
            grooveMulti ||
            (tonearmScrubWhenStopped && dur > 0 && !grooveMulti);
          if (canHoverScrub) {
            e.stopPropagation();
            if (!isScrubbingRef.current && typeof document !== 'undefined')
              document.body.style.cursor = 'ew-resize';
          }
        }}
        onPointerOut={() => {
          if (!isScrubbingRef.current && typeof document !== 'undefined')
            document.body.style.cursor = 'default';
        }}
      >
        {/* 바늘 끝 전용 히트 영역 — tip 위치에만 작은 구체, 드래그 스크럽·클릭 공용 */}
        <group rotation={[0, -0.78, 0]}>
          <mesh
            position={[-0.37, -0.028, 0]}
            onPointerDown={handlePointerDown}
          >
            <sphereGeometry args={[0.032, 10, 10]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>
        {/* 피벗 볼 */}
        <mesh>
          <sphereGeometry args={[0.015, 16, 16]} />
          <meshStandardMaterial color="#C0C0C8" metalness={0.92} roughness={0.08} />
        </mesh>
        {/* 암 튜브 */}
        <group rotation={[0, -0.78, 0]}>
          <mesh position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.005, 0.003, 0.37, 8]} />
            <meshStandardMaterial color="#C8C8D0" metalness={0.90} roughness={0.10} />
          </mesh>
          {/* 헤드셸 */}
          <mesh position={[-0.36, -0.012, 0]}>
            <boxGeometry args={[0.04, 0.009, 0.02]} />
            <meshStandardMaterial color="#B0B0B8" metalness={0.75} roughness={0.25} />
          </mesh>
          {/* 바늘 — 크기·발광으로 가시성 */}
          <mesh position={[-0.37, -0.028, 0]}>
            <coneGeometry args={[0.0028, 0.022, 8]} />
            <meshStandardMaterial
              color="#FFF8E8"
              metalness={0.75}
              roughness={0.12}
              emissive="#FFE8A0"
              emissiveIntensity={isPlaying ? 0.55 : 0.28}
            />
          </mesh>
        </group>

        <pointLight
          color="#FFE8C0"
          position={[-0.34, -0.02, 0]}
          intensity={isPlaying ? 0.85 : 0.45}
          distance={0.55}
          decay={2}
        />
        {/* 스크러빙 중 글로우 */}
        {isScrubbing && (
          <pointLight color="#FFD070" intensity={1.5} distance={0.6} decay={3} />
        )}
      </group>

      {/* ── 드롭 타겟 링 (LP 드래그 hover 시) ── */}
      {isDropTarget && (
        <>
          <mesh position={[0, 0.058, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.27, 0.012, 8, 64]} />
            <meshBasicMaterial color="#FFD070" transparent opacity={0.85} />
          </mesh>
          <pointLight color="#FFD070" intensity={4} distance={1.8} decay={2} position={[0, 0.3, 0]} />
        </>
      )}

      {/* ── 전원 LED (덱 열기와 분리) ── */}
      <mesh position={[0.36, 0.047, 0.28]} onClick={blockDeckOpen}>
        <cylinderGeometry args={[0.011, 0.011, 0.004, 16]} />
        <meshStandardMaterial
          color={isPlaying ? '#00FF40' : '#0A1A0A'}
          emissive={isPlaying ? '#00FF40' : '#000000'}
          emissiveIntensity={isPlaying ? 1.5 : 0}
        />
      </mesh>

      {/* ── 속도 노브 — 크롬 ── */}
      {([-0.28, -0.16] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.047, 0.28]} onClick={blockDeckOpen}>
          <cylinderGeometry args={[0.017, 0.017, 0.007, 20]} />
          <meshStandardMaterial color="#C0C0C8" metalness={0.88} roughness={0.12} />
        </mesh>
      ))}
    </group>
  );
}
