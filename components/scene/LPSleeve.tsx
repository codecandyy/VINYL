/**
 * LPSleeve — 앨범 케이스 + LP판 3D 컴포넌트
 *
 * 애니메이션 순서:
 * 1. 클릭 → 케이스 전체가 앞으로 당겨짐 (sleeveRef z += 0.12)
 * 2. 앞면 커버가 왼쪽 엣지 피벗으로 열림 (rotation.y → -130°)
 * 3. LP판 visible = true, 오른쪽+앞으로 슬라이드
 * 4. LP판 누른 채 움직임(임계 px 이상) → onPickupLP → 씬에서 드래그 시작
 *
 * LP 방향:
 * CylinderGeometry 기본값 = Y축 원기둥
 * rotation.x = Math.PI/2 → Z 방향 원판 = 정면에서 원형으로 보임 ✓
 * 케이스 안 z = LP_CLOSED_Z (-0.005, 커버 뒷면 뒤에 완전히 숨김)
 * 드래그 시작 → VinylShopScene에서 CylinderGeometry 수평 LP로 교체
 */
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Platform } from 'react-native';
import { AlbumData, createAlbumTexture, loadAlbumTexture } from '../../lib/albumTexture';
import { LocalLP } from '../../lib/localCollection';
import { getShelfCoverSize } from './ShelfUnit';

/** 정사각 앨범 커버 — 칸은 3:4, 커버는 정사각 */
const { w: SLV_W, h: SLV_H } = getShelfCoverSize();
const LP_RADIUS = SLV_W * 0.455;

// 케이스 z 오프셋 기준
const COVER_Z        =  0.007;  // 앞면 커버 중심 z
const COVER_HALF_T   =  0.006;  // 커버 두께 절반 (0.012 / 2)
const COVER_BACK_Z   = COVER_Z - COVER_HALF_T; // 0.001

// LP 위치
const LP_CLOSED_Z    = -0.006;  // 커버 뒷면(0.001)보다 뒤 → 완전히 숨김
const LP_OPEN_Z      =  0.17;   // 열렸을 때 케이스 앞으로 돌출
const LP_OPEN_X      =  0.08;   // 오른쪽으로 살짝 슬라이드

// 케이스 전체 앞으로 당기기
const SLEEVE_OPEN_Z  =  0.12;

type Props = {
  albumData: AlbumData;
  position: [number, number, number];
  isOpen: boolean;
  lp?: LocalLP;
  shelfSlotIndex: number;
  /** true면 슬리브 안 디스크 숨김(드래그 중·공중 유실·턴테이블에 꽂힘) */
  hidePhysicalLp: boolean;
  /** 이 슬롯 커버가 열려 있고, 커버로 연 상태에서만 디스크 집기 가능 */
  pickupAllowed: boolean;
  onToggle: () => void;
  onPickupLP: (
    worldPos: [number, number, number],
    clientX: number,
    clientY: number,
    lp: LocalLP | undefined,
    albumData: AlbumData,
    shelfSlotIndex: number
  ) => void;
};

export function LPSleeve({
  albumData,
  position,
  isOpen,
  lp,
  shelfSlotIndex,
  hidePhysicalLp,
  pickupAllowed,
  onToggle,
  onPickupLP,
}: Props) {
  const sleeveRef      = useRef<THREE.Group>(null);  // 케이스 전체 앞뒤 이동
  const coverPivotRef  = useRef<THREE.Group>(null);  // 커버 피벗 (왼쪽 엣지)
  const lpGroupRef     = useRef<THREE.Group>(null);  // LP 디스크 그룹
  const lpMeshRef      = useRef<THREE.Mesh>(null);   // LP 본체 (world position용)

  const [hovered, setHovered]     = useState(false);
  const [lpHovered, setLpHovered] = useState(false);
  /** 첫 프레임부터 절차적 커버 표시 → 네트워크 로드 후 실제 아트로 교체(새로고침 시 흰 면 방지) */
  const [texture, setTexture]     = useState<THREE.Texture | null>(() =>
    typeof document !== 'undefined' ? createAlbumTexture(albumData) : null
  );
  const [px, py, pz] = position;

  const albumTextureKey = useMemo(
    () =>
      [
        albumData.coverUrl ?? '',
        albumData.title,
        albumData.artist,
        albumData.bg,
        albumData.accent,
      ].join('\0'),
    [
      albumData.coverUrl,
      albumData.title,
      albumData.artist,
      albumData.bg,
      albumData.accent,
    ]
  );

  // ── 텍스처 로드 ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setTexture((prev) => {
      const procedural = createAlbumTexture(albumData);
      if (prev && prev !== procedural) prev.dispose();
      return procedural;
    });
    loadAlbumTexture(albumData, (t) => {
      if (!cancelled) {
        setTexture((prev) => {
          if (prev && prev !== t) prev.dispose();
          return t;
        });
      } else {
        t.dispose();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [albumTextureKey]);

  // ── 닫힐 때 위치 즉시 리셋 (반복 열림/닫힘 시 누적 방지) ─────────────
  useEffect(() => {
    if (!isOpen) {
      if (sleeveRef.current)   sleeveRef.current.position.z    = 0;
      if (lpGroupRef.current)  {
        lpGroupRef.current.position.z = LP_CLOSED_Z;
        lpGroupRef.current.position.x = 0;
      }
    }
  }, [isOpen]);

  // ── 애니메이션 ────────────────────────────────────────────────────────
  useFrame((_, delta) => {
    const k = Math.min(1, delta * 9);

    // Fix 3: 케이스 전체 앞으로 당기기
    if (sleeveRef.current) {
      const target = isOpen ? SLEEVE_OPEN_Z : 0;
      sleeveRef.current.position.z +=
        (target - sleeveRef.current.position.z) * k;
    }

    // 커버 피벗 Y 회전 (왼쪽으로 열림)
    if (coverPivotRef.current) {
      const target = isOpen ? -Math.PI * 0.72 : 0;
      const diff = target - coverPivotRef.current.rotation.y;
      if (Math.abs(diff) > 0.001)
        coverPivotRef.current.rotation.y += diff * k;
    }

    // LP 슬라이드: 앞으로(Z) + 오른쪽(X)
    if (lpGroupRef.current) {
      const targetZ = isOpen ? LP_OPEN_Z : LP_CLOSED_Z;
      const targetX = isOpen ? LP_OPEN_X : 0;
      const diffZ = targetZ - lpGroupRef.current.position.z;
      const diffX = targetX - lpGroupRef.current.position.x;
      if (Math.abs(diffZ) > 0.0005)
        lpGroupRef.current.position.z += diffZ * Math.min(1, delta * 8);
      if (Math.abs(diffX) > 0.0005)
        lpGroupRef.current.position.x += diffX * Math.min(1, delta * 7);
    }
  });

  const handleCoverClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onToggle();
  }, [onToggle]);

  // 커버로 연 슬롯(pickupAllowed) + 열림 + 실제 LP만 집기 (데모 슬롯은 디스크 드래그 불가)
  const handleLPPointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!pickupAllowed || !isOpen || !lp || hidePhysicalLp || !lpMeshRef.current) return;
      e.stopPropagation();
      const worldPos = new THREE.Vector3();
      lpMeshRef.current.getWorldPosition(worldPos);
      onPickupLP(
        [worldPos.x, worldPos.y, worldPos.z],
        e.nativeEvent.clientX,
        e.nativeEvent.clientY,
        lp,
        albumData,
        shelfSlotIndex
      );
    },
    [pickupAllowed, isOpen, lp, hidePhysicalLp, onPickupLP, albumData, shelfSlotIndex]
  );

  const tooltipLabel = useMemo(
    () => `${albumData.title} - ${albumData.artist}`,
    [albumData.title, albumData.artist]
  );

  const accent = albumData.accent ?? '#C87830';
  const showLpTooltip = lpHovered && isOpen && !hidePhysicalLp && Platform.OS === 'web';

  return (
    <group position={[px, py, pz]}>
      {/* ── 케이스 전체 (앞뒤 이동 애니메이션) ── */}
      <group ref={sleeveRef}>

        {/* ── 슬리브 뒷판 (속지 — 크림 종이 색) ── */}
        <mesh position={[0, 0, -0.013]}>
          <boxGeometry args={[SLV_W, SLV_H, 0.012]} />
          <meshStandardMaterial color="#D8CBB8" roughness={0.96} />
        </mesh>

        {/* ── LP 디스크 그룹 ── */}
        {/*
          Fix 1+2: LP는 케이스 안에서 세워진 상태 (정면을 향함)
          CylinderGeometry + rotation.x = Math.PI/2
          → 원판이 Z 방향을 향해 정면에서 원형으로 보임 ✓

          Fix 2: z = LP_CLOSED_Z 로 커버 뒷면보다 뒤에 완전히 숨겨짐
          Fix 3: isOpen 시 Z+X 방향으로 슬라이드
        */}
        <group
          ref={lpGroupRef}
          position={[0, 0, LP_CLOSED_Z]}
          visible={isOpen && !hidePhysicalLp}
        >
          {/*
            모든 메시를 CylinderGeometry + rotation.x=PI/2 로 통일
            → 정면에서 봤을 때 깔끔한 원형 레이어 구조
            → TorusGeometry 완전 제거 (radialSegments 부족 시 삼각형 덩어리로 보이는 버그)
            정면 레이어 순서 (z 오프셋 순):
              0.000  LP 본체 (검정 비닐)
              0.004  홈 영역 (메탈릭 다크)
              0.006  중앙 라벨 (앨범 컬러)
              0.008  스핀들 홀 (다크)
          */}

          {/* ① LP 본체 — 검정 비닐 디스크 */}
          <mesh
            ref={lpMeshRef}
            rotation={[Math.PI / 2, 0, 0]}
            onPointerDown={handleLPPointerDown}
            onPointerOver={(e) => {
              if (!isOpen || hidePhysicalLp) return;
              e.stopPropagation();
              setLpHovered(true);
              if (typeof document !== 'undefined') {
                document.body.style.cursor =
                  pickupAllowed && lp ? 'grab' : 'default';
              }
            }}
            onPointerOut={() => {
              setLpHovered(false);
              if (typeof document !== 'undefined') document.body.style.cursor = 'default';
            }}
          >
            <cylinderGeometry args={[LP_RADIUS, LP_RADIUS, 0.006, 48]} />
            <meshStandardMaterial color="#0D0D0D" roughness={0.14} metalness={0.86} />
          </mesh>

          {/* ② 홈 영역 — 메탈릭 서클 (비닐 홈 반사감), LP_RADIUS의 64% */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.004]}>
            <cylinderGeometry args={[LP_RADIUS * 0.64, LP_RADIUS * 0.64, 0.001, 48]} />
            <meshStandardMaterial color="#1E1E1E" roughness={0.04} metalness={0.94} />
          </mesh>

          {/* ③ 중앙 라벨 — 앨범 액센트 컬러 서클 */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.006]}>
            <cylinderGeometry args={[LP_RADIUS * 0.32, LP_RADIUS * 0.32, 0.001, 36]} />
            <meshStandardMaterial
              color={albumData.accent}
              roughness={0.65}
              emissive={lpHovered ? albumData.accent : '#000'}
              emissiveIntensity={lpHovered ? 0.45 : 0}
            />
          </mesh>

          {/* ④ 스핀들 홀 */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.008]}>
            <cylinderGeometry args={[0.007, 0.007, 0.001, 16]} />
            <meshStandardMaterial color="#1A1A1A" metalness={0.5} roughness={0.5} />
          </mesh>

          {/* hover 글로우 */}
          <pointLight
            color={lpHovered ? '#FFD070' : '#C87830'}
            intensity={lpHovered ? 0.7 : 0.12}
            distance={0.4}
            decay={3}
          />

          {showLpTooltip && (
            <Html
              position={[0, LP_RADIUS + 0.02, 0]}
              center={false}
              distanceFactor={6.2}
              style={{
                pointerEvents: 'none',
                transform: 'translate(-50%, calc(-100% - 2px))',
              }}
              zIndexRange={[200, 0]}
              occlude={false}
            >
              <div
                style={{
                  position: 'relative',
                  background: '#0a0a0a',
                  border: `1px solid ${accent}`,
                  borderRadius: 6,
                  padding: '1px 7px 3px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                  whiteSpace: 'nowrap',
                  maxWidth: 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
                    fontSize: 16,
                    fontWeight: 700,
                    color: accent,
                    letterSpacing: 0.2,
                    lineHeight: 1.1,
                    display: 'inline-block',
                  }}
                >
                  {tooltipLabel}
                </span>
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: -6,
                    marginLeft: -4,
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: `6px solid ${accent}`,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: -4,
                    marginLeft: -3,
                    width: 0,
                    height: 0,
                    borderLeft: '3px solid transparent',
                    borderRight: '3px solid transparent',
                    borderTop: '5px solid #0a0a0a',
                  }}
                />
              </div>
            </Html>
          )}
        </group>

        {/* ── 앞면 커버 — 왼쪽 엣지 피벗 ── */}
        {/*
          Fix 4: pivot group을 왼쪽 엣지(-SLV_W/2)에 놓고
          mesh를 중앙(+SLV_W/2)으로 오프셋 → 왼쪽 엣지 기준으로 열림
        */}
        <group ref={coverPivotRef} position={[-SLV_W / 2, 0, COVER_Z]}>
          <mesh
            position={[SLV_W / 2, 0, 0]}
            onClick={handleCoverClick}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(true);
              if (typeof document !== 'undefined' && !isOpen)
                document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
              setHovered(false);
              if (typeof document !== 'undefined') document.body.style.cursor = 'default';
            }}
          >
            <boxGeometry args={[SLV_W, SLV_H, 0.012]} />
            {/* Fix 5: 앨범 커버 — emissive 완전 제거, 조명만 받음 */}
            <meshStandardMaterial
              map={texture ?? undefined}
              color={texture ? '#ffffff' : albumData.bg}
              roughness={texture ? 0.88 : 0.66}
              metalness={0.02}
              emissive="#000000"
              emissiveIntensity={0}
            />
          </mesh>
        </group>

      </group>
    </group>
  );
}
