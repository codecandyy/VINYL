import React, { Suspense, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
// useFrame still used by CameraBreathing
import { Platform, StyleSheet, View } from 'react-native';
import * as THREE from 'three';

import { RoomStructure } from './RoomStructure';
import { ShelfUnit } from './ShelfUnit';
import { AlbumCovers } from './AlbumCovers';
import { Turntable } from './Turntable';
import { DeskLamp } from './DeskLamp';
import { Amplifier, BeerBottle, SmallSpeaker, LPStack } from './Props';
import { ShopDiegeticUI } from './ShopDiegeticUI';
import { AlbumData } from '../../lib/albumTexture';
import { LocalLP } from '../../lib/localCollection';
import { MusicTrack } from '../../lib/music';
import { usePlayerStore } from '../../stores/playerStore';

// ─── 카메라 브리딩 (아주 미세한 숨 쉬듯 움직임) ───────────────────────
function CameraBreathing() {
  const { camera } = useThree();
  const t = useRef(0);

  useEffect(() => {
    camera.position.set(0, 1.72, 3.8);
    camera.lookAt(0, 1.05, -1.3);
  }, []);

  useFrame((_, delta) => {
    t.current += delta * 0.18;
    camera.position.y = 1.72 + Math.sin(t.current) * 0.003;
    camera.position.x = Math.sin(t.current * 0.65) * 0.0015;
    camera.lookAt(0, 1.05, -1.3);
  });
  return null;
}

// ─── 씬 조명 ─────────────────────────────────────────────────────────
function SceneLighting({ isPlaying }: { isPlaying: boolean }) {
  return (
    <>
      {/* 앰비언트 — 전체 기본 밝기 */}
      <ambientLight intensity={1.2} color="#C87830" />

      {/* 천장 메인 전구 */}
      <pointLight
        position={[0, 4.6, -1.3]}
        color="#FFD090"
        intensity={12}
        decay={2}
        distance={18}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.002}
      />

      {/* 선반 전면 fill — 앨범 커버 밝게 */}
      <pointLight
        position={[0, 3.5, -2.5]}
        color="#FFE4B0"
        intensity={8}
        decay={2}
        distance={8}
      />

      {/* 카운터·턴테이블 직접 조명 */}
      <pointLight
        position={[0, 3.0, -1.3]}
        color="#FFD4A0"
        intensity={7}
        decay={2}
        distance={6}
      />

      {/* 좌우 공간 fill */}
      <pointLight position={[-4, 2.5, -1]} color="#E08030" intensity={4} decay={2} distance={10} />
      <pointLight position={[4, 2.5, -1]} color="#E08030" intensity={4} decay={2} distance={10} />

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
  onSelectAlbum: (albumData: AlbumData, lp?: LocalLP) => void;
  coinBalance: number;
  onOpenSearch: () => void;
  onOpenVending: () => void;
  onShare: () => void;
  onOpenCollection: () => void;
};

function ShopScene({
  lps,
  currentAlbum,
  isPlaying,
  onSelectAlbum,
  coinBalance,
  onOpenSearch,
  onOpenVending,
  onShare,
  onOpenCollection,
}: SceneProps) {
  return (
    <>
      <CameraBreathing />
      <SceneLighting isPlaying={isPlaying} />

      {/* ── 방 구조 (바닥·벽·천장·전구) ── */}
      <RoomStructure />

      {/* ── 선반 유닛 (뒷벽 전체) ── */}
      <ShelfUnit position={[0, 0, -3.2]} />

      {/* ── 앨범 커버들 (선반 위) ── */}
      <Suspense fallback={null}>
        <AlbumCovers
          lps={lps}
          onSelectAlbum={onSelectAlbum}
          shelfPosition={[0, 0, -3.2]}
        />
      </Suspense>

      {/* ── 카운터 (선반 앞, 중앙) ── */}
      {/* 카운터 본체 */}
      <mesh position={[0, 0.5, -1.3]} receiveShadow castShadow>
        <boxGeometry args={[4.5, 1.0, 1.1]} />
        <meshStandardMaterial color="#3A1A06" roughness={0.8} />
      </mesh>
      {/* 카운터 상판 */}
      <mesh position={[0, 1.01, -1.3]}>
        <boxGeometry args={[4.5, 0.02, 1.1]} />
        <meshStandardMaterial color="#5C2A0C" roughness={0.6} metalness={0.05} />
      </mesh>
      {/* 카운터 구리 엣지 */}
      <mesh position={[0, 1.022, -0.76]}>
        <boxGeometry args={[4.5, 0.006, 0.006]} />
        <meshStandardMaterial color="#B87333" metalness={0.9} roughness={0.12} />
      </mesh>

      {/* ── 턴테이블 (카운터 위 중앙) ── */}
      <Turntable
        currentAlbum={currentAlbum}
        isPlaying={isPlaying}
        position={[0, 1.055, -1.35]}
      />

      {/* ── 데스크 램프 (카운터 우측) ── */}
      <DeskLamp position={[1.8, 1.02, -1.5]} intensity={1.1} />

      {/* ── 앰프 (카운터 좌측) ── */}
      <Amplifier position={[-1.6, 1.1, -1.4]} isPlaying={isPlaying} />

      {/* ── 소품들 ── */}
      <SmallSpeaker position={[1.1, 1.1, -1.4]} />
      <BeerBottle position={[1.55, 1.1, -1.5]} />
      <LPStack position={[-0.85, 1.1, -1.4]} count={5} />
      <BeerBottle position={[-2.1, 1.1, -1.55]} />
      <LPStack position={[-2.4, 1.1, -1.42]} count={3} />

      {/* ── 다이어제틱 UI (씬 안에 있는 버튼들) ── */}
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

// ─── 빈티지 CSS 오버레이 (비네트 + 그레인) ───────────────────────────
function VintageOverlay() {
  if (Platform.OS !== 'web') return null;
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      {/* 비네트 */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            // @ts-ignore — web only
            backgroundImage:
              'radial-gradient(ellipse at 50% 45%, transparent 38%, rgba(0,0,0,0.72) 100%)',
          },
        ]}
      />
      {/* 필름 그레인 (CSS noise 근사) */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: 0.04,
            // @ts-ignore — web only
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',
            backgroundSize: '180px 180px',
          },
        ]}
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
  onOpenSearch = () => {},
  onOpenVending = () => {},
  onShare = () => {},
  onOpenCollection = () => {},
}: Props) {
  const { currentTrack, isPlaying } = usePlayerStore();

  const currentAlbum: AlbumData | null = currentTrack
    ? {
        bg: '#1A0A00',
        accent: '#C87830',
        title: currentTrack.title,
        artist: currentTrack.artist,
        coverUrl: currentTrack.artworkUrl ?? undefined,
      }
    : null;

  const handleSelectAlbum = useCallback(
    (albumData: AlbumData, lp?: LocalLP) => {
      if (!lp?.previewUrl) return;
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
    },
    [onPlayTrack]
  );

  return (
    <View style={styles.root}>
      <Canvas
        style={styles.canvas}
        camera={{ position: [0, 1.72, 3.8], fov: 52, near: 0.1, far: 25 }}
        shadows="basic"
        dpr={1}
        frameloop="always"
        gl={{
          antialias: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.6,
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
            onSelectAlbum={handleSelectAlbum}
            coinBalance={coinBalance}
            onOpenSearch={onOpenSearch}
            onOpenVending={onOpenVending}
            onShare={onShare}
            onOpenCollection={onOpenCollection}
          />
        </Suspense>
      </Canvas>

      {/* CSS 빈티지 오버레이 (비네트 + 그레인) — 3D 파이프라인 밖에서 적용 */}
      <VintageOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  canvas: { flex: 1 },
});
