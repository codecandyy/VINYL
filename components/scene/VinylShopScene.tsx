import React, { Suspense, useRef, useCallback, useEffect, useLayoutEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Platform, StyleSheet, View } from 'react-native';
import * as THREE from 'three';

import {
  pickTrackForGroove,
  lpToQueueTrack,
  getDeckSetListTracks,
  LocalLP,
} from '../../lib/localCollection';
import { orderLpsForShelf, shelfMaxPage, shelfSlotLpArrayForPage } from '../../lib/shelfPagination';
import { QUEUE_SLOT_COUNT, useQueueStore } from '../../stores/queueStore';

import { RoomStructure } from './RoomStructure';
import { WallPosters } from './WallPosters';
import { ShelfAnimatedGroup } from './ShelfAnimatedGroup';
import { ShelfPagerControls } from './ShelfPagerControls';
import { Turntable } from './Turntable';
import { DeckCoverStand } from './DeckCoverStand';
import { DeskLamp } from './DeskLamp';
import { Amplifier, BeerBottle, SmallSpeaker, LPStack } from './Props';
import { VendingMachine3D } from './VendingMachine3D';
import { VinylPostFX } from '../postprocessing/VinylPostFX';
import { AlbumData } from '../../lib/albumTexture';
import { MusicTrack } from '../../lib/music';
import type { PlayTrackOptions } from '../../hooks/useMusicPlayer';
import { usePlayerStore } from '../../stores/playerStore';
import { useDeckPhysicsStore } from '../../stores/deckPhysicsStore';
import { haptics } from '../../lib/haptics';

// ─── 상수 ────────────────────────────────────────────────────────────
const TT_CENTER_X = 0;
const TT_CENTER_Z = -1.35;
const TT_DROP_Y   = 1.35;
const TT_RADIUS   = 0.62; // 스케일된 턴테이블 플래터에 맞춘 월드 반경

/** 책장·앨범 그리드 공통 위치 */
const SHELF_POSITION = [0, 0.44, -3.2] as const;

/** 루트 Y 오프셋 — 책장이 너무 위로 붙지 않게 살짝 내림 */
const SCENE_ROOT_Y = -0.40;
/** 드래그 평면·공중 LP — 씬 그룹 오프셋 반영 월드 Y */
const TT_DROP_Y_WORLD = TT_DROP_Y + SCENE_ROOT_Y;

/** 플래터 위 VinylRecord(r=0.235) × 턴테이블 그룹 스케일 1.6 과 드래그 메시 반지름 0.28 정합 */
const VINYL_RECORD_MESH_R = 0.235;
const TT_GROUP_SCALE = 1.6;
const DRAG_VINYL_MESH_R = 0.28;
const TARGET_DRAG_SCALE_RAW = (VINYL_RECORD_MESH_R * TT_GROUP_SCALE) / DRAG_VINYL_MESH_R;
/** 시각적 점프 완화 — 이론값보다 낮게 캡 */
const TARGET_DRAG_SCALE = Math.min(TARGET_DRAG_SCALE_RAW, 1.12);
/** 드래그 스케일 lerp — z가 이쪽(덱)일수록 TARGET에 가깝게 (구간 약간 넓힘) */
const DRAG_Z_SHELF = -3.35;
const DRAG_Z_DECK = -1.28;
const DRAG_SCALE_AT_SHELF = 0.94;

// ─── 드래그 상태 ─────────────────────────────────────────────────────
type DragState = {
  lp: LocalLP | undefined; // 데모 앨범은 undefined
  albumData: AlbumData;
  /** 책장 슬롯 인덱스 — 무효 드롭 시 커버 닫으면 이 슬롯으로 복귀 */
  sourceSlotIndex: number;
};

/** 턴테이블에 안 올린 채 놓친 LP — 해당 슬롯 커버를 닫으면 슬리브로 복귀 */
type OrphanShelfLp = {
  slotIndex: number;
  albumData: AlbumData;
  lp: LocalLP;
};

// ─── 드래그 중인 LP 메시 ─────────────────────────────────────────────
const DraggingLP = React.memo(function DraggingLP({
  albumData,
  targetRef,
  isOverTurntable,
  freezePosition,
}: {
  albumData: AlbumData;
  targetRef: React.MutableRefObject<THREE.Vector3>;
  isOverTurntable: boolean;
  /** true면 드래그 종료 후 공중 고정(포인터 미따름) */
  freezePosition?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const tiltGroupRef = useRef<THREE.Group>(null);
  const discGroupRef = useRef<THREE.Group>(null);
  /** PI/2 = 책장에서 세로로 든 판, 0 = 플래터에 눕힌 판(실린더 기본축 Y → 수평) */
  const discPitchRef = useRef(Math.PI / 2);
  const carryTilt = useRef(0.44);
  const smoothScaleRef = useRef(DRAG_SCALE_AT_SHELF);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const z = targetRef.current.z;
    const depthRaw = THREE.MathUtils.smoothstep(z, DRAG_Z_SHELF, DRAG_Z_DECK);
    const depthT = Math.pow(depthRaw, 0.58);
    const targetS = THREE.MathUtils.lerp(DRAG_SCALE_AT_SHELF, TARGET_DRAG_SCALE, depthT);
    smoothScaleRef.current += (targetS - smoothScaleRef.current) * Math.min(1, delta * 10);
    groupRef.current.scale.setScalar(smoothScaleRef.current);

    const targetPitch = isOverTurntable ? 0 : Math.PI / 2;
    discPitchRef.current +=
      (targetPitch - discPitchRef.current) * Math.min(1, delta * 18);
    if (discGroupRef.current) {
      discGroupRef.current.rotation.set(discPitchRef.current, 0, 0);
    }

    if (isOverTurntable) {
      carryTilt.current = 0;
    } else {
      carryTilt.current += (0.44 - carryTilt.current) * Math.min(1, delta * 8);
    }
    if (tiltGroupRef.current) tiltGroupRef.current.rotation.x = carryTilt.current;

    if (freezePosition) {
      groupRef.current.position.copy(targetRef.current);
    } else {
      groupRef.current.position.lerp(targetRef.current, Math.min(1, delta * 14));
    }
    groupRef.current.rotation.y = 0;
    groupRef.current.rotation.z = 0;
    groupRef.current.rotation.x = 0;
  });

  const accentColor = albumData.accent ?? '#CC2020';

  return (
    <group ref={groupRef} position={[targetRef.current.x, TT_DROP_Y_WORLD, targetRef.current.z]}>
      {/* carryTilt: 들고 있을 때 살짝 기울임 → 플래터 위에서 0으로 눕힘 */}
      <group ref={tiltGroupRef}>
        {/* discPitchRef: 세로(PI/2) ↔ 플래터 위 수평(0) */}
        <group ref={discGroupRef}>
        {/* 넓은 후광 — 어두운 배경에서 실루엣 */}
        <mesh position={[0, -0.002, 0]}>
          <cylinderGeometry args={[0.38, 0.38, 0.006, 56]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={isOverTurntable ? 1.15 : 0.72}
            transparent
            opacity={0.32}
            depthWrite={false}
            roughness={1}
            metalness={0}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0.001, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.005, 56]} />
          <meshStandardMaterial
            color="#FFE8C8"
            emissive="#FFD8A0"
            emissiveIntensity={isOverTurntable ? 0.55 : 0.38}
            transparent
            opacity={0.26}
            depthWrite={false}
            roughness={1}
            metalness={0}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[0, 0.0025, 0]}>
          <cylinderGeometry args={[0.312, 0.312, 0.004, 56]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={isOverTurntable ? 0.95 : 0.5}
            transparent
            opacity={0.22}
            depthWrite={false}
            roughness={1}
            metalness={0}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* 비닐 본체 — 완전 흑에 가깝지 않게 + 은은한 에지 시어 */}
        <mesh position={[0, 0.004, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.007, 48]} />
          <meshStandardMaterial
            color="#141820"
            emissive="#4a5870"
            emissiveIntensity={0.11}
            roughness={0.22}
            metalness={0.72}
          />
        </mesh>
        <mesh position={[0, 0.0085, 0]}>
          <cylinderGeometry args={[0.10, 0.10, 0.002, 32]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={isOverTurntable ? 0.85 : 0.38}
            roughness={0.55}
          />
        </mesh>
      </group>
      </group>
      <pointLight
        color={accentColor}
        intensity={isOverTurntable ? 5.2 : 3.2}
        distance={isOverTurntable ? 3.2 : 2.4}
        decay={2}
      />
      <pointLight
        color="#F5EDD8"
        position={[0, 0.15, 0]}
        intensity={isOverTurntable ? 2.4 : 1.8}
        distance={3.4}
        decay={2}
      />
      <pointLight
        color="#FFFFFF"
        position={[0, 0.28, 0]}
        intensity={isOverTurntable ? 1.2 : 0.85}
        distance={2.2}
        decay={2}
      />
    </group>
  );
});

/** 턴테이블 위에서 드래그 지점을 스핀들 쪽으로 매 프레임 당김 */
function DragPlatterMagnet({
  dragTargetRef,
  isDraggingRef,
  isOverTtRef,
}: {
  dragTargetRef: React.MutableRefObject<THREE.Vector3>;
  isDraggingRef: React.MutableRefObject<boolean>;
  isOverTtRef: React.MutableRefObject<boolean>;
}) {
  useFrame((_, dt) => {
    if (!isDraggingRef.current || !isOverTtRef.current) return;
    const t = dragTargetRef.current;
    const k = Math.min(1, dt * 14);
    t.x += (TT_CENTER_X - t.x) * k;
    t.z += (TT_CENTER_Z - t.z) * k;
  });
  return null;
}

// ─── Camera ref 캡처 (Canvas 안에서만 useThree 가능) ─────────────────
function CameraCapture({
  cameraRef,
  canvasRef,
}: {
  cameraRef: React.MutableRefObject<THREE.Camera | null>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}) {
  const { camera, gl } = useThree();
  useEffect(() => {
    cameraRef.current = camera;
    canvasRef.current = gl.domElement;
  }, [camera, gl, cameraRef, canvasRef]);
  return null;
}

// ─── 카메라 브리딩 ────────────────────────────────────────────────────
function CameraBreathing() {
  const { camera } = useThree();
  const t = useRef(0);
  const lastUpdate = useRef(0);

  useEffect(() => {
    // lookAt Y 높임 → 뒷벽·천장 쪽이 프레임에 더 들어와 책장 상단 여백 확보
    camera.position.set(0, 1.76, 4.05);
    camera.lookAt(0, 0.98, -0.44);
  }, []);

  useFrame((_, delta) => {
    lastUpdate.current += delta;
    if (lastUpdate.current < 0.5) return;
    lastUpdate.current = 0;
    t.current += 0.5 * 0.16;
    camera.position.y = 1.76 + Math.sin(t.current) * 0.003;
    camera.position.x = Math.sin(t.current * 0.6) * 0.0012;
    camera.position.z = 4.05;
    camera.lookAt(0, 0.98, -0.44);
  });
  return null;
}

/** 천장에서 덱(턴테이블) 쪽으로 비추는 소프트 스포트 */
function CeilingDeckSpotlight({ isPlaying }: { isPlaying: boolean }) {
  const spotRef = useRef<THREE.SpotLight>(null);
  const { scene } = useThree();

  useLayoutEffect(() => {
    const sp = spotRef.current;
    if (!sp) return;
    const tgt = sp.target;
    tgt.position.set(TT_CENTER_X, 1.12, TT_CENTER_Z);
    scene.add(tgt);
    return () => {
      scene.remove(tgt);
    };
  }, [scene]);

  return (
    <spotLight
      ref={spotRef}
      position={[0.22, 4.94, -1.12]}
      angle={0.4}
      penumbra={0.62}
      intensity={isPlaying ? 10.5 : 7.2}
      color="#FFF4E6"
      distance={22}
      decay={2}
    />
  );
}

// ─── 조명 ────────────────────────────────────────────────────────────
const SceneLighting = React.memo(function SceneLighting({ isPlaying }: { isPlaying: boolean }) {
  return (
    <>
      <CeilingDeckSpotlight isPlaying={isPlaying} />
      {/* 중성 + 소량 웜 — 앨범 커버 원색이 덜 누렇게 치이도록 */}
      <ambientLight intensity={0.48} color="#E8E4DE" />
      <ambientLight intensity={0.26} color="#C4A078" />
      <hemisphereLight color="#ECD8B8" groundColor="#4A3428" intensity={0.38} />
      <pointLight position={[0, 4.6, -1.5]} color="#FFD9A0" intensity={12.5} decay={2} distance={26} />
      <pointLight
        position={[0, 2.2, -1.2]}
        color="#E87840"
        intensity={isPlaying ? 6.2 : 4.0}
        decay={2.5}
        distance={8}
      />
      {/* 책장 — 백열/엷은 앰버 (차가운 보조광 제거) */}
      <pointLight position={[0, 2.75, -1.85]} color="#FFF0D8" intensity={5.4} decay={2} distance={9} />
      <pointLight position={[-2.2, 2.5, -2.35]} color="#F5E0C8" intensity={3.25} decay={2} distance={8} />
      <pointLight position={[2.2, 2.5, -2.35]} color="#F5E0C8" intensity={3.25} decay={2} distance={8} />
      <pointLight position={[-3.5, 2.4, -2.8]} color="#68C8A0" intensity={1.35} decay={2} distance={8} />
      <pointLight position={[3.8, 2.6, -1.8]} color="#F0A860" intensity={2.15} decay={2} distance={8} />
    </>
  );
});

// ─── 씬 내부 ─────────────────────────────────────────────────────────
type SceneProps = {
  slotLps: (LocalLP | undefined)[];
  shelfPage: number;
  shelfMaxPage: number;
  onShelfPrev: () => void;
  onShelfNext: () => void;
  easelAlbum: AlbumData | null;
  showDeckEasel: boolean;
  currentAlbum: AlbumData | null;
  isPlaying: boolean;
  dragState: DragState | null;
  orphanShelfLp: OrphanShelfLp | null;
  deckOccupiedSlotIndex: number | null;
  dragTargetRef: React.MutableRefObject<THREE.Vector3>;
  orphanPosRef: React.MutableRefObject<THREE.Vector3>;
  isOverTurntable: boolean;
  onPickupLP: (
    worldPos: [number, number, number],
    lp: LocalLP | undefined,
    albumData: AlbumData,
    shelfSlotIndex: number
  ) => void;
  onShelfCoverClosed: (slotIndex: number) => void;
  isVendOpen: boolean;
  onOpenVending: () => void;
  onShare: () => void;
  onOpenDeck?: () => void;
  onPlayGrooveTrack?: (track: MusicTrack, grooveIndex: number) => void;
  cameraRef: React.MutableRefObject<THREE.Camera | null>;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  shelfFlipTarget: number | null;
  onShelfFlipMid: (page: number) => void;
  onShelfFlipDone: () => void;
  isDraggingRef: React.MutableRefObject<boolean>;
  isOverTtRef: React.MutableRefObject<boolean>;
};

const ShopScene = React.memo(function ShopScene({
  slotLps,
  shelfPage,
  shelfMaxPage,
  onShelfPrev,
  onShelfNext,
  easelAlbum,
  showDeckEasel,
  currentAlbum, isPlaying,
  dragState, orphanShelfLp, deckOccupiedSlotIndex,
  dragTargetRef, orphanPosRef, isOverTurntable,
  onPickupLP,
  onShelfCoverClosed,
  isVendOpen, onOpenVending, onShare, onOpenDeck, onPlayGrooveTrack,
  cameraRef, canvasRef,
  shelfFlipTarget,
  onShelfFlipMid,
  onShelfFlipDone,
  isDraggingRef,
  isOverTtRef,
}: SceneProps) {
  const shelfPos = SHELF_POSITION;
  return (
    <>
      <color attach="background" args={['#140e0b']} />
      <fog attach="fog" args={['#1e1814', 12, 22]} />
      <CameraCapture cameraRef={cameraRef} canvasRef={canvasRef} />
      <CameraBreathing />
      <DragPlatterMagnet
        dragTargetRef={dragTargetRef}
        isDraggingRef={isDraggingRef}
        isOverTtRef={isOverTtRef}
      />

      {(dragState || orphanShelfLp) && (
        <DraggingLP
          albumData={(dragState ?? orphanShelfLp)!.albumData}
          targetRef={dragState ? dragTargetRef : orphanPosRef}
          isOverTurntable={!!dragState && isOverTurntable}
          freezePosition={!dragState && !!orphanShelfLp}
        />
      )}

      <group position={[0, SCENE_ROOT_Y, 0]}>
        <SceneLighting isPlaying={isPlaying} />
        <RoomStructure />
        <WallPosters />

        <ShelfAnimatedGroup
          shelfPosition={[...shelfPos]}
          slotLps={slotLps}
          shelfPage={shelfPage}
          flipTargetPage={shelfFlipTarget}
          onFlipMid={onShelfFlipMid}
          onFlipDone={onShelfFlipDone}
          onPickupLP={onPickupLP}
          onShelfCoverClosed={onShelfCoverClosed}
          dragSourceSlotIndex={dragState?.sourceSlotIndex ?? null}
          orphanSlotIndex={orphanShelfLp?.slotIndex ?? null}
          deckOccupiedSlotIndex={deckOccupiedSlotIndex}
        />

        <ShelfPagerControls
          shelfPosition={[...shelfPos]}
          page={shelfPage}
          maxPage={shelfMaxPage}
          onPrev={onShelfPrev}
          onNext={onShelfNext}
          locked={!!dragState || !!orphanShelfLp || shelfFlipTarget != null}
        />

        <group
          position={[0, 1.055, TT_CENTER_Z]}
          scale={[1.6, 1.6, 1.6]}
          rotation={[-0.08, 0, 0]}
        >
          <DeckCoverStand album={easelAlbum} visible={showDeckEasel} />
          <Turntable
            currentAlbum={currentAlbum}
            isPlaying={isPlaying}
            isDropTarget={isOverTurntable}
            onOpenDeck={onOpenDeck}
            onPlayGrooveTrack={onPlayGrooveTrack}
            position={[0, 0, 0]}
          />
        </group>

        <DeskLamp position={[1.8, 1.02, -1.5]} intensity={1.28} />
        <Amplifier position={[-1.6, 1.1, -1.4]} isPlaying={isPlaying} />
        <SmallSpeaker position={[1.1, 1.1, -1.4]} />
        <BeerBottle position={[1.55, 1.1, -1.5]} />
        <LPStack position={[-0.85, 1.1, -1.4]} count={5} />
        <BeerBottle position={[-2.1, 1.1, -1.55]} />

        <VendingMachine3D
          position={[-3.1, 0.78, -2.1]}
          rotation={[0, 0.38, 0]}
          isActive={isVendOpen}
          onPress={onOpenVending}
        />

        <VinylPostFX />
      </group>
    </>
  );
});

// ─── 빈티지 CSS 오버레이 (세피아 틴트 + 스캔라인 + 필름 그레인) ───────
function VintageOverlay() {
  if (Platform.OS !== 'web') return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* 따뜻한 세피아/염화 은 느낌 */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {
          // @ts-ignore
          backgroundImage:
            'linear-gradient(180deg, rgba(255,220,170,0.04) 0%, rgba(120,80,50,0.025) 45%, rgba(40,28,20,0.06) 100%)',
        }]}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {
          // @ts-ignore
          backgroundImage: 'radial-gradient(ellipse at 50% 46%, transparent 28%, rgba(45,32,22,0.28) 100%)',
        }]}
      />
      {/* 아주 옅은 CRT 스캔라인 */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {
          opacity: 0.22,
          // @ts-ignore
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.045) 2px, rgba(0,0,0,0.045) 3px)',
        }]}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {
          opacity: 0.048,
          // @ts-ignore
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.78\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundSize: '180px 180px',
        }]}
      />
    </View>
  );
}

// ─── 메인 export ──────────────────────────────────────────────────────
type Props = {
  lps: LocalLP[];
  onPlayTrack: (track: MusicTrack, opts?: PlayTrackOptions) => void;
  isVendOpen?: boolean;
  onOpenVending?: () => void;
  onShare?: () => void;
  onOpenDeck?: () => void;
  /** 턴테이블에 LP 올려 재생 시작 시 — 덱 UI 자동 오픈 등 */
  onTurntableLpPlaced?: () => void;
  /** 웹: 큐 + 로 슬롯 지정 후 책장에서 LP 고른 뒤 — 덱·큐 다시 펼침 */
  onWebQueuePickDone?: () => void;
};

export function VinylShopScene({
  lps,
  onPlayTrack,
  isVendOpen = false,
  onOpenVending = () => {},
  onShare = () => {},
  onOpenDeck,
  onTurntableLpPlaced,
  onWebQueuePickDone,
}: Props) {
  const { currentTrack, isPlaying } = usePlayerStore();

  const [shelfPage, setShelfPage] = useState(0);
  const orderedLps = useMemo(() => orderLpsForShelf(lps), [lps]);
  const shelfMaxPageVal = useMemo(() => shelfMaxPage(orderedLps), [orderedLps]);
  const slotLps = useMemo(
    () => shelfSlotLpArrayForPage(orderedLps, shelfPage),
    [orderedLps, shelfPage]
  );

  useEffect(() => {
    setShelfPage((p) => Math.min(p, shelfMaxPageVal));
  }, [shelfMaxPageVal]);

  const prevLpLenRef = useRef(lps.length);
  useEffect(() => {
    if (lps.length > prevLpLenRef.current) setShelfPage(0);
    prevLpLenRef.current = lps.length;
  }, [lps.length]);

  const [shelfFlipTarget, setShelfFlipTarget] = useState<number | null>(null);

  const onShelfPrev = useCallback(() => {
    if (shelfFlipTarget != null) return;
    const np = Math.max(0, shelfPage - 1);
    if (np === shelfPage) return;
    setShelfFlipTarget(np);
  }, [shelfFlipTarget, shelfPage]);

  const onShelfNext = useCallback(() => {
    if (shelfFlipTarget != null) return;
    const np = Math.min(shelfMaxPageVal, shelfPage + 1);
    if (np === shelfPage) return;
    setShelfFlipTarget(np);
  }, [shelfFlipTarget, shelfMaxPageVal, shelfPage]);

  const onShelfFlipMid = useCallback((page: number) => {
    setShelfPage(page);
  }, []);

  const onShelfFlipDone = useCallback(() => {
    setShelfFlipTarget(null);
  }, []);

  // ── 드래그 상태 ──
  const [dragState, setDragState]             = useState<DragState | null>(null);
  const [orphanShelfLp, setOrphanShelfLp]     = useState<OrphanShelfLp | null>(null);
  const [deckOccupiedSlotIndex, setDeckOccupiedSlotIndex] = useState<number | null>(null);
  /** 책장에서 턴테이블에 올린 LP — 라벨 색·거치대 커버용 */
  const [deckPlatterLp, setDeckPlatterLp] = useState<LocalLP | null>(null);
  const [isOverTurntable, setIsOverTurntable] = useState(false);
  const dragTargetRef  = useRef(new THREE.Vector3(0, TT_DROP_Y_WORLD, 0));
  const orphanPosRef   = useRef(new THREE.Vector3(0, TT_DROP_Y_WORLD, 0));
  const isDraggingRef  = useRef(false);
  const isOverTtRef    = useRef(false);
  const dragStateRef   = useRef<DragState | null>(null);

  // ── Camera / Canvas ref (Canvas 안 CameraCapture가 채워줌) ──
  const cameraRef = useRef<THREE.Camera | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── Raycaster (한 번만 생성) ──
  const raycaster  = useRef(new THREE.Raycaster());
  const dragPlane  = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), -TT_DROP_Y_WORLD));
  const ndcVec     = useRef(new THREE.Vector2());
  const hitVec     = useRef(new THREE.Vector3());

  const handlePlayGroove = useCallback(
    (t: MusicTrack, idx: number) => {
      let s = usePlayerStore.getState().sideTracksForDeck;
      if ((!s || s.length === 0) && deckPlatterLp) {
        s = getDeckSetListTracks(deckPlatterLp);
      }
      if (s && s.length > 0) {
        onPlayTrack(t, { sideAlbumTracks: s, initialSideIndex: idx });
      } else {
        onPlayTrack(t);
      }
    },
    [onPlayTrack, deckPlatterLp]
  );

  const easelAlbum = useMemo((): AlbumData | null => {
    if (!deckPlatterLp) return null;
    return {
      bg: deckPlatterLp.labelColor,
      accent: deckPlatterLp.labelColor,
      labelColor: deckPlatterLp.labelColor,
      title: deckPlatterLp.title,
      artist: deckPlatterLp.artist,
      coverUrl: deckPlatterLp.artworkUrl ?? undefined,
    };
  }, [deckPlatterLp]);

  /** 거치대: 재생 곡이 턴테이블에 꽂은 LP와 같은 앨범일 때만 */
  const deckPlaybackAligned = useMemo(() => {
    if (!deckPlatterLp || !currentTrack) return false;
    if (deckPlatterLp.albumId && currentTrack.albumId) {
      return (
        deckPlatterLp.albumId === currentTrack.albumId &&
        deckPlatterLp.source === currentTrack.source
      );
    }
    return (
      deckPlatterLp.album.trim().toLowerCase() === currentTrack.album.trim().toLowerCase() &&
      deckPlatterLp.artist.trim().toLowerCase() === currentTrack.artist.trim().toLowerCase()
    );
  }, [deckPlatterLp, currentTrack]);

  const currentAlbum: AlbumData | null = currentTrack
    ? {
        bg: '#1A0A00',
        accent: '#CC2020',
        labelColor: deckPlatterLp?.labelColor,
        title: currentTrack.title,
        artist: currentTrack.artist,
        coverUrl: currentTrack.artworkUrl ?? undefined,
      }
    : null;

  const handleShelfCoverClosed = useCallback((slotIndex: number) => {
    setOrphanShelfLp((o) => (o && o.slotIndex === slotIndex ? null : o));
  }, []);

  // ── LP 픽업: 실제 LP만, 턴테이블에 다른 판이 꽂혀 있으면 불가, 공중 유실(orphan) 중엔 불가 ──
  const handlePickupLP = useCallback(
    (
      worldPos: [number, number, number],
      lp: LocalLP | undefined,
      albumData: AlbumData,
      shelfSlotIndex: number
    ) => {
      if (!lp) return;
      if (deckOccupiedSlotIndex === shelfSlotIndex) return;
      if (orphanShelfLp) return;

      if (Platform.OS === 'web') {
        const pending = useQueueStore.getState().webPendingSlotIndex;
        if (pending != null) {
          useQueueStore.getState().setSlot(pending, lpToQueueTrack(lp));
          useQueueStore.getState().setWebPendingSlot(null);
          haptics.drop();
          onWebQueuePickDone?.();
          return;
        }
      }

      dragTargetRef.current.set(worldPos[0], TT_DROP_Y_WORLD, worldPos[2]);
      const state: DragState = { lp, albumData, sourceSlotIndex: shelfSlotIndex };
      dragStateRef.current   = state;
      isDraggingRef.current  = true;
      setDragState(state);
      setIsOverTurntable(false);
      isOverTtRef.current = false;
      haptics.lift();
    },
    [deckOccupiedSlotIndex, orphanShelfLp, onWebQueuePickDone]
  );

  // ── 드롭 처리 (턴테이블 재생 / 웹: 큐 슬롯 / 그 외는 공중 유실 → 해당 슬롯 커버 닫으면 복귀) ──
  const handleDrop = useCallback(
    (clientX: number, clientY: number) => {
      const state = dragStateRef.current;
      if (!state) return;

      isDraggingRef.current = false;

      const overTt = isOverTtRef.current;
      let placedOnTurntable = false;
      let droppedOnQueue = false;

      if (overTt && state.lp) {
        dragTargetRef.current.set(TT_CENTER_X, TT_DROP_Y_WORLD, TT_CENTER_Z);
        const norm = useDeckPhysicsStore.getState().tonearmGrooveNorm;
        const picked = pickTrackForGroove(state.lp, norm);
        if (picked?.track.previewUrl) {
          haptics.platterSnap();
          const setList = getDeckSetListTracks(state.lp);
          let initialIdx = setList.findIndex((t) => t.id === picked.track.id);
          if (initialIdx < 0) {
            initialIdx = Math.min(picked.sideIndex, Math.max(0, setList.length - 1));
          }
          onPlayTrack(picked.track, {
            sideAlbumTracks: setList,
            initialSideIndex: initialIdx,
          });
          setDeckOccupiedSlotIndex(state.sourceSlotIndex);
          if (state.lp) setDeckPlatterLp(state.lp);
          setOrphanShelfLp(null);
          placedOnTurntable = true;
          onTurntableLpPlaced?.();
        } else {
          haptics.reject();
        }
      }

      const canQueue =
        !placedOnTurntable &&
        Platform.OS === 'web' &&
        typeof document !== 'undefined' &&
        !!state.lp &&
        !!(state.lp.previewUrl || (state.lp.albumTracks?.some((t) => t.previewUrl) ?? false));

      if (canQueue) {
        const els = document.elementsFromPoint(clientX, clientY);
        let idx = -1;
        for (const el of els) {
          if (!(el instanceof HTMLElement)) continue;
          const ds = el.getAttribute('data-vinyl-queue-slot');
          if (ds != null) {
            idx = parseInt(ds, 10);
            break;
          }
          const id = el.id || '';
          const m = id.match(/vinyl-queue-slot-(\d+)/);
          if (m) {
            idx = parseInt(m[1], 10);
            break;
          }
        }
        if (idx >= 0 && idx < QUEUE_SLOT_COUNT) {
          useQueueStore.getState().setSlot(idx, lpToQueueTrack(state.lp!));
          haptics.drop();
          droppedOnQueue = true;
        }
      }

      if (!placedOnTurntable && !droppedOnQueue) {
        haptics.reject();
      }

      if (!placedOnTurntable && !droppedOnQueue && state.lp) {
        orphanPosRef.current.copy(dragTargetRef.current);
        setOrphanShelfLp({
          slotIndex: state.sourceSlotIndex,
          albumData: state.albumData,
          lp: state.lp,
        });
      }

      dragStateRef.current = null;
      setDragState(null);
      setIsOverTurntable(false);
      isOverTtRef.current = false;
    },
    [onPlayTrack, onTurntableLpPlaced]
  );

  // ── 드래그 이동 ──
  const handleDragMove = useCallback((pos: THREE.Vector3) => {
    dragTargetRef.current.set(pos.x, TT_DROP_Y_WORLD, pos.z);
    const dx   = pos.x - TT_CENTER_X;
    const dz   = pos.z - TT_CENTER_Z;
    const over = Math.sqrt(dx * dx + dz * dz) < TT_RADIUS;
    if (over !== isOverTtRef.current) {
      isOverTtRef.current = over;
      setIsOverTurntable(over);
      if (over) haptics.dockTick();
    }
  }, []);

  // ── 드래그 ref 패턴 (stale closure 방지) ──
  const handleDragMoveRef = useRef(handleDragMove);
  handleDragMoveRef.current = handleDragMove;
  const handleDropRef = useRef(handleDrop);
  handleDropRef.current = handleDrop;

  // ── Window 레벨 포인터 리스너 (Canvas 밖에서 등록 — 타이밍 이슈 없음) ──
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const canvas = canvasRef.current;
      const camera = cameraRef.current;
      if (!canvas || !camera) return;

      const rect = canvas.getBoundingClientRect();
      ndcVec.current.x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
      ndcVec.current.y = -((e.clientY - rect.top)  / rect.height) *  2 + 1;

      raycaster.current.setFromCamera(ndcVec.current, camera);
      if (raycaster.current.ray.intersectPlane(dragPlane.current, hitVec.current)) {
        handleDragMoveRef.current(hitVec.current.clone());
      }
    };

    const onUp = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      handleDropRef.current(e.clientX, e.clientY);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
    };
  }, []); // 마운트 시 한 번만 — isDraggingRef로 활성 제어

  return (
    <View
      style={
        Platform.OS === 'web'
          ? { flex: 1, minHeight: 0, width: '100%', height: '100%' }
          : styles.root
      }
    >
      <Canvas
        style={
          Platform.OS === 'web'
            ? { flex: 1, minHeight: 0, width: '100%', height: '100%' }
            : styles.canvas
        }
        camera={{ position: [0, 1.76, 4.05], fov: 56, near: 0.1, far: 25 }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        gl={{
          antialias: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: 'high-performance',
          stencil: false,
          alpha: false,
        }}
      >
        <Suspense fallback={null}>
          <ShopScene
            slotLps={slotLps}
            shelfPage={shelfPage}
            shelfMaxPage={shelfMaxPageVal}
            onShelfPrev={onShelfPrev}
            onShelfNext={onShelfNext}
            easelAlbum={easelAlbum}
            showDeckEasel={deckPlaybackAligned}
            currentAlbum={currentAlbum}
            isPlaying={isPlaying}
            dragState={dragState}
            orphanShelfLp={orphanShelfLp}
            deckOccupiedSlotIndex={deckOccupiedSlotIndex}
            dragTargetRef={dragTargetRef}
            orphanPosRef={orphanPosRef}
            isOverTurntable={isOverTurntable}
            onPickupLP={handlePickupLP}
            onShelfCoverClosed={handleShelfCoverClosed}
            isVendOpen={isVendOpen}
            onOpenVending={onOpenVending}
            onShare={onShare}
            onOpenDeck={onOpenDeck}
            onPlayGrooveTrack={handlePlayGroove}
            cameraRef={cameraRef}
            canvasRef={canvasRef}
            shelfFlipTarget={shelfFlipTarget}
            onShelfFlipMid={onShelfFlipMid}
            onShelfFlipDone={onShelfFlipDone}
            isDraggingRef={isDraggingRef}
            isOverTtRef={isOverTtRef}
          />
        </Suspense>
      </Canvas>
      <VintageOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  canvas: { flex: 1 },
});
