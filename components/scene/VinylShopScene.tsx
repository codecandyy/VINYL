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
import { MusicTrack, musicApi } from '../../lib/music';
import type { PlayTrackOptions } from '../../hooks/useMusicPlayer';
import { usePlayerStore } from '../../stores/playerStore';
import { useDeckPhysicsStore } from '../../stores/deckPhysicsStore';
import { haptics } from '../../lib/haptics';

// ─── 상수 ────────────────────────────────────────────────────────────
const TT_CENTER_X = 0;
const TT_CENTER_Z = -1.35;
const TT_DROP_Y   = 1.35;

/** 책장·앨범 그리드 공통 위치 */
const SHELF_POSITION = [0, 0.44, -3.2] as const;

/** 루트 Y 오프셋 — 카메라 하단이 바닥 밖(배경색)을 덜 보이게 살짝 올림 */
const SCENE_ROOT_Y = -0.22;
/** 드래그 평면·공중 LP — 씬 그룹 오프셋 반영 월드 Y */
const TT_DROP_Y_WORLD = TT_DROP_Y + SCENE_ROOT_Y;

/** 드래그 LP 화면 반지름 계산용 월드 반지름 */
const DRAG_VINYL_MESH_R = 0.28;

/** 화면에서 이 거리(px) 이상 움직여야 드래그 시작 — 단순 클릭은 무시 */
const DRAG_START_THRESHOLD_PX = 8;
const DRAG_START_THRESHOLD_SQ = DRAG_START_THRESHOLD_PX * DRAG_START_THRESHOLD_PX;

// ─── 드래그 상태 ─────────────────────────────────────────────────────
type DragState = {
  lp: LocalLP | undefined; // 데모 앨범은 undefined
  albumData: AlbumData;
  /** 책장 슬롯 인덱스 — 무효 드롭 시 커버 닫으면 이 슬롯으로 복귀 */
  sourceSlotIndex: number;
};

type PendingLpPickup = {
  worldPos: [number, number, number];
  startClientX: number;
  startClientY: number;
  lp: LocalLP | undefined;
  albumData: AlbumData;
  sourceSlotIndex: number;
};

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
    // Z 작을수록 덱·바 테이블에 가까워짐
    camera.position.set(0, 1.92, 3.28);
    camera.lookAt(0, 1.28, -0.92);
  }, []);

  useFrame((_, delta) => {
    lastUpdate.current += delta;
    if (lastUpdate.current < 0.5) return;
    lastUpdate.current = 0;
    t.current += 0.5 * 0.16;
    camera.position.y = 1.92 + Math.sin(t.current) * 0.003;
    camera.position.x = Math.sin(t.current * 0.6) * 0.0012;
    camera.position.z = 3.28;
    camera.lookAt(0, 1.28, -0.92);
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
      position={[0.22, 8.15, -1.12]}
      angle={0.4}
      penumbra={0.62}
      intensity={isPlaying ? 10.5 : 7.2}
      color="#FFF4E6"
      distance={26}
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
      <pointLight position={[0, 7.85, -1.5]} color="#FFD9A0" intensity={12.5} decay={2} distance={32} />
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
  deckOccupiedSlotIndex: number | null;
  isOverTurntable: boolean;
  onPickupLP: (
    worldPos: [number, number, number],
    clientX: number,
    clientY: number,
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
  dragState, deckOccupiedSlotIndex,
  isOverTurntable,
  onPickupLP,
  onShelfCoverClosed,
  isVendOpen, onOpenVending, onShare, onOpenDeck, onPlayGrooveTrack,
  cameraRef, canvasRef,
  shelfFlipTarget,
  onShelfFlipMid,
  onShelfFlipDone,
}: SceneProps) {
  const shelfPos = SHELF_POSITION;
  return (
    <>
      {/* 바닥 밖으로 새는 픽셀과 톤 맞춤(카펫에 가까운 웜 다크) */}
      <color attach="background" args={['#1e1612']} />
      <fog attach="fog" args={['#221c18', 12, 27]} />
      <CameraCapture cameraRef={cameraRef} canvasRef={canvasRef} />

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
          orphanSlotIndex={null}
          deckOccupiedSlotIndex={deckOccupiedSlotIndex}
        />

        <ShelfPagerControls
          shelfPosition={[...shelfPos]}
          page={shelfPage}
          maxPage={shelfMaxPage}
          onPrev={onShelfPrev}
          onNext={onShelfNext}
          locked={!!dragState || shelfFlipTarget != null}
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
  const [deckOccupiedSlotIndex, setDeckOccupiedSlotIndex] = useState<number | null>(null);
  /** 책장에서 턴테이블에 올린 LP — 라벨 색·거치대 커버용 */
  const [deckPlatterLp, setDeckPlatterLp] = useState<LocalLP | null>(null);
  const [isOverTurntable, setIsOverTurntable] = useState(false);
  const isDraggingRef  = useRef(false);
  const isOverTtRef    = useRef(false);
  const dragStateRef   = useRef<DragState | null>(null);
  const pendingPickupRef = useRef<PendingLpPickup | null>(null);

  // ── Camera / Canvas ref (Canvas 안 CameraCapture가 채워줌) ──
  const cameraRef = useRef<THREE.Camera | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── 2D 드래그 오버레이 (web) ──
  const dragOverlayDivRef = useRef<HTMLDivElement | null>(null);
  const dragOverlayOffsetRef = useRef({ x: 0, y: 0 }); // 커서 - LP 중심 (px)
  const dragOverlaySizePxRef = useRef(120);             // 오버레이 div 크기 (px)
  const dragOverlayInitPosRef = useRef({ x: 0, y: 0 }); // 드래그 시작 LP 화면 중심 (px)
  const ttScreenPosRef = useRef({ x: 0, y: 0, radiusPx: 120 }); // 턴테이블 화면 위치

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

  const handleShelfCoverClosed = useCallback((_slotIndex: number) => {
    // 드롭 실패 시 orphan 상태가 없으므로 아무것도 하지 않아도 됨
  }, []);

  // ── LP 픽업: 포인터다운만으로는 대기(pending) — 임계값 이상 움직여야 드래그 시작 ──
  const handlePickupLP = useCallback(
    (
      worldPos: [number, number, number],
      clientX: number,
      clientY: number,
      lp: LocalLP | undefined,
      albumData: AlbumData,
      shelfSlotIndex: number
    ) => {
      if (deckOccupiedSlotIndex === shelfSlotIndex) return;
      if (dragStateRef.current) return;

      if (Platform.OS === 'web' && lp) {
        const pendingSlot = useQueueStore.getState().webPendingSlotIndex;
        if (pendingSlot != null) {
          useQueueStore.getState().setSlot(pendingSlot, lpToQueueTrack(lp));
          useQueueStore.getState().setWebPendingSlot(null);
          haptics.drop();
          onWebQueuePickDone?.();
          return;
        }
      }

      pendingPickupRef.current = {
        worldPos,
        startClientX: clientX,
        startClientY: clientY,
        lp,
        albumData,
        sourceSlotIndex: shelfSlotIndex,
      };
    },
    [deckOccupiedSlotIndex, onWebQueuePickDone]
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
          placedOnTurntable = true;
          onTurntableLpPlaced?.();
        } else {
          haptics.reject();
        }
      } else if (overTt && !state.lp && state.albumData.title && state.albumData.artist) {
        // 데모 슬롯: LP 데이터 없음 → API로 즉석 검색해서 재생
        haptics.platterSnap();
        const slotIdx = state.sourceSlotIndex;
        setDeckOccupiedSlotIndex(slotIdx);
        placedOnTurntable = true;
        const query = `${state.albumData.artist} ${state.albumData.title}`;
        musicApi.searchAlbumTracks(query, 5).then((tracks) => {
          const playable = tracks.filter((t) => t.previewUrl);
          if (playable.length > 0) {
            onPlayTrack(playable[0], {
              sideAlbumTracks: playable,
              initialSideIndex: 0,
            });
            onTurntableLpPlaced?.();
          } else {
            setDeckOccupiedSlotIndex(null);
          }
        }).catch(() => {
          setDeckOccupiedSlotIndex(null);
        });
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
      // 실패 드롭: 별도 상태 없이 그냥 dragState 클리어 → LP가 슬리브로 즉시 복귀

      // ── 2D 오버레이 드롭 애니메이션 ──
      if (Platform.OS === 'web') {
        const div = dragOverlayDivRef.current;
        if (div) {
          const size = dragOverlaySizePxRef.current;
          const removeDiv = () => {
            if (div.parentNode) div.parentNode.removeChild(div);
            if (dragOverlayDivRef.current === div) dragOverlayDivRef.current = null;
          };
          if (placedOnTurntable) {
            const tt = ttScreenPosRef.current;
            div.style.transition = 'transform 0.25s ease-out,opacity 0.2s ease-out 0.05s';
            div.style.transform = `translate(${tt.x - size / 2}px,${tt.y - size / 2}px)`;
            div.style.opacity = '0';
            setTimeout(removeDiv, 280);
          } else {
            const ip = dragOverlayInitPosRef.current;
            div.style.transition = 'transform 0.2s ease-in,opacity 0.15s ease-in';
            div.style.transform = `translate(${ip.x - size / 2}px,${ip.y - size / 2}px)`;
            div.style.opacity = '0';
            setTimeout(removeDiv, 220);
          }
        }
      }

      dragStateRef.current = null;
      setDragState(null);
      setIsOverTurntable(false);
      isOverTtRef.current = false;
    },
    [onPlayTrack, onTurntableLpPlaced, setDeckOccupiedSlotIndex]
  );

  // ── 드래그 ref 패턴 (stale closure 방지) ──
  const handleDropRef = useRef(handleDrop);
  handleDropRef.current = handleDrop;

  // ── Window 레벨 포인터 리스너 (Canvas 밖에서 등록 — 타이밍 이슈 없음) ──
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      // 마우스 버튼이 눌리지 않은 상태인데 드래그 중이면 — pointerup 유실, 자동 종료
      if (e.buttons === 0) {
        if (isDraggingRef.current) {
          handleDropRef.current(e.clientX, e.clientY);
        } else if (pendingPickupRef.current) {
          pendingPickupRef.current = null;
        }
        return;
      }

      const pend = pendingPickupRef.current;
      if (pend && !isDraggingRef.current) {
        const dx = e.clientX - pend.startClientX;
        const dy = e.clientY - pend.startClientY;
        if (dx * dx + dy * dy >= DRAG_START_THRESHOLD_SQ) {
          pendingPickupRef.current = null;

          // ── 2D 드래그 초기화 ──
          const canvas2 = canvasRef.current;
          const camera2 = cameraRef.current;
          let lpScreenX = pend.startClientX;
          let lpScreenY = pend.startClientY;

          if (canvas2 && camera2) {
            const rect = canvas2.getBoundingClientRect();
            const lpNdc = new THREE.Vector3(
              pend.worldPos[0], pend.worldPos[1], pend.worldPos[2]
            ).project(camera2);
            lpScreenX = rect.left + ((lpNdc.x + 1) / 2) * rect.width;
            lpScreenY = rect.top  + ((-lpNdc.y + 1) / 2) * rect.height;

            // LP 화면 반지름 → div 크기
            const edgeNdc = new THREE.Vector3(
              pend.worldPos[0] + DRAG_VINYL_MESH_R, pend.worldPos[1], pend.worldPos[2]
            ).project(camera2);
            const edgePxX = rect.left + ((edgeNdc.x + 1) / 2) * rect.width;
            dragOverlaySizePxRef.current = Math.max(80, Math.min(180, Math.abs(edgePxX - lpScreenX) * 2));

            // 턴테이블 화면 위치 (카메라 고정이므로 드래그 시작 시 한 번만 계산)
            const ttNdc = new THREE.Vector3(TT_CENTER_X, 1.055 + SCENE_ROOT_Y, TT_CENTER_Z).project(camera2);
            ttScreenPosRef.current = {
              x: rect.left + ((ttNdc.x + 1) / 2) * rect.width,
              y: rect.top  + ((-ttNdc.y + 1) / 2) * rect.height,
              radiusPx: 120,
            };
          }

          // 커서-LP 중심 오프셋 (LP가 뚝 떨어지지 않도록)
          dragOverlayOffsetRef.current = {
            x: pend.startClientX - lpScreenX,
            y: pend.startClientY - lpScreenY,
          };
          dragOverlayInitPosRef.current = { x: lpScreenX, y: lpScreenY };

          // 2D 오버레이 div 생성
          if (typeof document !== 'undefined') {
            const size = dragOverlaySizePxRef.current;
            const initDivX = lpScreenX - size / 2;
            const initDivY = lpScreenY - size / 2;
            const div = document.createElement('div');
            const accent = pend.albumData.accent ?? '#CC2020';
            const bgVal = pend.albumData.coverUrl
              ? `url('${pend.albumData.coverUrl}') center/cover`
              : (pend.albumData.bg ?? '#1A1A1A');
            div.style.cssText = [
              'position:fixed',
              'top:0',
              'left:0',
              `width:${size}px`,
              `height:${size}px`,
              'border-radius:50%',
              `background:${bgVal}`,
              'pointer-events:none',
              'z-index:9999',
              'will-change:transform',
              `box-shadow:0 0 20px 4px ${accent}66`,
              `transform:translate(${initDivX}px,${initDivY}px)`,
            ].join(';');
            document.body.appendChild(div);
            dragOverlayDivRef.current = div;
          }

          const state: DragState = {
            lp: pend.lp,
            albumData: pend.albumData,
            sourceSlotIndex: pend.sourceSlotIndex,
          };
          dragStateRef.current = state;
          isDraggingRef.current = true;
          setDragState(state);
          setIsOverTurntable(false);
          isOverTtRef.current = false;
          haptics.lift();
        }
      }

      if (!isDraggingRef.current) return;

      // ── 2D 오버레이 위치 업데이트 ──
      const div = dragOverlayDivRef.current;
      if (div) {
        const size = dragOverlaySizePxRef.current;
        const lpCenterX = e.clientX - dragOverlayOffsetRef.current.x;
        const lpCenterY = e.clientY - dragOverlayOffsetRef.current.y;
        div.style.transform = `translate(${lpCenterX - size / 2}px,${lpCenterY - size / 2}px)`;

        // 턴테이블 호버 감지 — 스크린 스페이스 거리 비교 (Z축 변화 없음)
        const tt = ttScreenPosRef.current;
        const ddx = lpCenterX - tt.x;
        const ddy = lpCenterY - tt.y;
        const over = Math.sqrt(ddx * ddx + ddy * ddy) < tt.radiusPx;
        if (over !== isOverTtRef.current) {
          isOverTtRef.current = over;
          setIsOverTurntable(over);
          if (over) haptics.dockTick();
          const accent = dragStateRef.current?.albumData.accent ?? '#CC2020';
          div.style.boxShadow = over
            ? `0 0 32px 8px ${accent}99`
            : `0 0 20px 4px ${accent}66`;
        }
      }
    };

    const onUp = (e: PointerEvent) => {
      if (pendingPickupRef.current && !isDraggingRef.current) {
        pendingPickupRef.current = null;
        return;
      }
      if (!isDraggingRef.current) return;
      handleDropRef.current(e.clientX, e.clientY);
    };

    window.addEventListener('pointermove',  onMove);
    window.addEventListener('pointerup',    onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove',  onMove);
      window.removeEventListener('pointerup',    onUp);
      window.removeEventListener('pointercancel', onUp);
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
        camera={{ position: [0, 1.92, 3.28], fov: 54, near: 0.1, far: 30 }}
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
            deckOccupiedSlotIndex={deckOccupiedSlotIndex}
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
