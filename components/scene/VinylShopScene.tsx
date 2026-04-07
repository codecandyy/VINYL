import React, { Suspense, useRef, useCallback, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Platform, StyleSheet, View } from 'react-native';
import * as THREE from 'three';

import { RoomStructure } from './RoomStructure';
import { ShelfUnit } from './ShelfUnit';
import { AlbumCovers } from './AlbumCovers';
import { Turntable } from './Turntable';
import { DeskLamp } from './DeskLamp';
import { Amplifier, BeerBottle, SmallSpeaker, LPStack } from './Props';
import { ShopDiegeticUI } from './ShopDiegeticUI';
import { VendingMachine3D } from './VendingMachine3D';
import { AlbumData } from '../../lib/albumTexture';
import { LocalLP } from '../../lib/localCollection';
import { MusicTrack } from '../../lib/music';
import { usePlayerStore } from '../../stores/playerStore';

// ─── 날아가는 LP 디스크 ────────────────────────────────────────────────
type FlyState = {
  from: [number, number, number];
  lp: LocalLP;
  albumData: AlbumData;
};

const TURNTABLE_LAND: [number, number, number] = [0, 1.118, -1.35];

function FlyingDisc({ fly, onLand }: { fly: FlyState; onLand: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const landed = useRef(false);

  useFrame((_, delta) => {
    if (!ref.current || landed.current) return;
    progress.current = Math.min(1, progress.current + delta * 2.0);
    const t = progress.current;
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    ref.current.position.x = fly.from[0] + (TURNTABLE_LAND[0] - fly.from[0]) * ease;
    ref.current.position.y =
      fly.from[1] + (TURNTABLE_LAND[1] - fly.from[1]) * ease +
      Math.sin(t * Math.PI) * 0.45; // 아치형 비행
    ref.current.position.z = fly.from[2] + (TURNTABLE_LAND[2] - fly.from[2]) * ease;
    ref.current.rotation.y += delta * 5; // 비행 중 회전

    if (t >= 1) {
      landed.current = true;
      onLand();
    }
  });

  return (
    <group ref={ref} position={fly.from}>
      {/* 비닐 본체 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.235, 0.235, 0.007, 28]} />
        <meshStandardMaterial color="#1C1C1C" roughness={0.25} metalness={0.45} />
      </mesh>
      {/* 라벨 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
        <cylinderGeometry args={[0.095, 0.095, 0.004, 20]} />
        <meshStandardMaterial
          color={fly.albumData.accent}
          emissive={fly.albumData.accent}
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* 글로우 링 */}
      <pointLight color={fly.albumData.accent} intensity={2} decay={3} distance={1} />
    </group>
  );
}

// ─── 카메라 브리딩 ────────────────────────────────────────────────────
function CameraBreathing() {
  const { camera } = useThree();
  const t = useRef(0);

  useEffect(() => {
    camera.position.set(0, 1.72, 3.8);
    camera.lookAt(0, 1.05, -1.3);
  }, []);

  useFrame((_, delta) => {
    t.current += delta * 0.16;
    camera.position.y = 1.72 + Math.sin(t.current) * 0.003;
    camera.position.x = Math.sin(t.current * 0.6) * 0.0012;
    camera.lookAt(0, 1.05, -1.3);
  });
  return null;
}

// ─── 조명 ─────────────────────────────────────────────────────────────
function SceneLighting({ isPlaying }: { isPlaying: boolean }) {
  return (
    <>
      {/* 베이스 앰비언트 — 따뜻한 세피아 */}
      <ambientLight intensity={2.8} color="#D4945A" />

      {/* 천장 메인 전구 */}
      <pointLight
        position={[0, 4.6, -1.3]}
        color="#FFD090"
        intensity={14}
        decay={2}
        distance={18}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.002}
      />

      {/* 선반 fill */}
      <pointLight position={[0, 3.5, -2.8]} color="#FFE4B0" intensity={10} decay={2} distance={8} />

      {/* 카운터/턴테이블 fill */}
      <pointLight position={[0, 3.0, -1.3]} color="#FFD4A0" intensity={9} decay={2} distance={6} />

      {/* 좌우 fill */}
      <pointLight position={[-4, 2.5, -1]} color="#E08030" intensity={5} decay={2} distance={10} />
      <pointLight position={[4, 2.5, -1]} color="#E08030" intensity={5} decay={2} distance={10} />

      {/* 앰프 LED */}
      <pointLight
        position={[-1.6, 1.3, -1.2]}
        color="#0055FF"
        intensity={isPlaying ? 1.2 : 0.4}
        decay={3}
        distance={2.5}
      />
    </>
  );
}

// ─── 씬 내부 ─────────────────────────────────────────────────────────
type SceneProps = {
  lps: LocalLP[];
  currentAlbum: AlbumData | null;
  isPlaying: boolean;
  flyState: FlyState | null;
  onFlyLand: () => void;
  onPickupLP: (worldPos: [number, number, number], lp: LocalLP, albumData: AlbumData) => void;
  coinBalance: number;
  isVendOpen: boolean;
  onOpenSearch: () => void;
  onOpenVending: () => void;
  onShare: () => void;
  onOpenCollection: () => void;
};

function ShopScene({
  lps, currentAlbum, isPlaying,
  flyState, onFlyLand, onPickupLP,
  coinBalance, isVendOpen,
  onOpenSearch, onOpenVending, onShare, onOpenCollection,
}: SceneProps) {
  return (
    <>
      <CameraBreathing />
      <SceneLighting isPlaying={isPlaying} />

      {/* ── 방 구조 ── */}
      <RoomStructure />

      {/* ── 선반 ── */}
      <ShelfUnit position={[0, 0, -3.2]} />

      {/* ── LP 슬리브들 (클릭 → 열기 → LP 꺼내기) ── */}
      <Suspense fallback={null}>
        <AlbumCovers
          lps={lps}
          shelfPosition={[0, 0, -3.2]}
          onPickupLP={onPickupLP}
        />
      </Suspense>

      {/* ── 날아가는 LP (픽업 후 턴테이블로) ── */}
      {flyState && (
        <FlyingDisc fly={flyState} onLand={onFlyLand} />
      )}

      {/* ── 카운터 ── */}
      <mesh position={[0, 0.5, -1.3]} receiveShadow castShadow>
        <boxGeometry args={[4.5, 1.0, 1.1]} />
        <meshStandardMaterial color="#3A1A06" roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.01, -1.3]}>
        <boxGeometry args={[4.5, 0.02, 1.1]} />
        <meshStandardMaterial color="#5C2A0C" roughness={0.7} metalness={0.0} />
      </mesh>
      <mesh position={[0, 1.022, -0.76]}>
        <boxGeometry args={[4.5, 0.005, 0.005]} />
        <meshStandardMaterial color="#B87333" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* ── 턴테이블 (카운터 위) ── */}
      <Turntable currentAlbum={currentAlbum} isPlaying={isPlaying} position={[0, 1.055, -1.35]} />

      {/* ── 소품 ── */}
      <DeskLamp position={[1.8, 1.02, -1.5]} intensity={1.1} />
      <Amplifier position={[-1.6, 1.1, -1.4]} isPlaying={isPlaying} />
      <SmallSpeaker position={[1.1, 1.1, -1.4]} />
      <BeerBottle position={[1.55, 1.1, -1.5]} />
      <LPStack position={[-0.85, 1.1, -1.4]} count={5} />
      <BeerBottle position={[-2.1, 1.1, -1.55]} />

      {/* ── LP 자판기 (좌측) ── */}
      <VendingMachine3D
        position={[-3.1, 0.78, -2.1]}
        rotation={[0, 0.38, 0]}
        isActive={isVendOpen}
        onPress={onOpenVending}
      />

      {/* ── 다이어제틱 UI 버튼 ── */}
      <ShopDiegeticUI
        coinBalance={coinBalance}
        onOpenSearch={onOpenSearch}
        onOpenVending={onOpenVending}
        onShare={onShare}
        onOpenCollection={onOpenCollection}
      />
    </>
  );
}

// ─── 빈티지 CSS 오버레이 ──────────────────────────────────────────────
function VintageOverlay() {
  if (Platform.OS !== 'web') return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {
          // @ts-ignore
          backgroundImage: 'radial-gradient(ellipse at 50% 48%, transparent 32%, rgba(0,0,0,0.58) 100%)',
        }]}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {
          opacity: 0.035,
          // @ts-ignore
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundSize: '160px 160px',
        }]}
      />
    </View>
  );
}

// ─── 메인 export ──────────────────────────────────────────────────────
type Props = {
  lps: LocalLP[];
  onPlayTrack: (track: MusicTrack) => void;
  dustParticleCount?: number;
  coinBalance?: number;
  isVendOpen?: boolean;
  onOpenSearch?: () => void;
  onOpenVending?: () => void;
  onShare?: () => void;
  onOpenCollection?: () => void;
};

export function VinylShopScene({
  lps,
  onPlayTrack,
  dustParticleCount = 0,
  coinBalance = 0,
  isVendOpen = false,
  onOpenSearch = () => {},
  onOpenVending = () => {},
  onShare = () => {},
  onOpenCollection = () => {},
}: Props) {
  const { currentTrack, isPlaying } = usePlayerStore();
  const [flyState, setFlyState] = useState<FlyState | null>(null);

  const currentAlbum: AlbumData | null = currentTrack
    ? {
        bg: '#1A0A00',
        accent: '#C87830',
        title: currentTrack.title,
        artist: currentTrack.artist,
        coverUrl: currentTrack.artworkUrl ?? undefined,
      }
    : null;

  // LP 픽업 → fly 시작
  const handlePickupLP = useCallback(
    (worldPos: [number, number, number], lp: LocalLP, albumData: AlbumData) => {
      setFlyState({ from: worldPos, lp, albumData });
    },
    []
  );

  // LP 착지 → 음악 재생
  const handleFlyLand = useCallback(() => {
    if (!flyState) return;
    const { lp } = flyState;
    const track: MusicTrack = {
      id: lp.trackId,
      title: lp.title,
      artist: lp.artist,
      artistId: '',
      album: lp.album,
      albumId: '',
      previewUrl: lp.previewUrl,
      artworkUrl: lp.artworkUrl,
      duration: 30,
      source: lp.source,
      externalUrl: '',
    };
    onPlayTrack(track);
    setFlyState(null);
  }, [flyState, onPlayTrack]);

  return (
    <View style={styles.root}>
      <Canvas
        style={styles.canvas}
        camera={{ position: [0, 1.72, 3.8], fov: 52, near: 0.1, far: 25 }}
        shadows="basic"
        dpr={1}
        gl={{
          antialias: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.5,
          outputColorSpace: THREE.SRGBColorSpace,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFShadowMap;
        }}
      >
        <Suspense fallback={null}>
          <ShopScene
            lps={lps}
            currentAlbum={currentAlbum}
            isPlaying={isPlaying}
            flyState={flyState}
            onFlyLand={handleFlyLand}
            onPickupLP={handlePickupLP}
            coinBalance={coinBalance}
            isVendOpen={isVendOpen}
            onOpenSearch={onOpenSearch}
            onOpenVending={onOpenVending}
            onShare={onShare}
            onOpenCollection={onOpenCollection}
          />
        </Suspense>
      </Canvas>
      <VintageOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  canvas: { flex: 1 },
});
