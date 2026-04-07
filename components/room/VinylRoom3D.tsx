import React, { Suspense, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Platform } from 'react-native';
import * as THREE from 'three';
import { RoomLighting } from './RoomLighting';
import { AlbumWall } from './AlbumWall';
import { Turntable } from './Turntable';
import { DustParticles } from './DustParticles';
import { usePlayerStore } from '../../stores/playerStore';
import { useCollectionStore } from '../../stores/collectionStore';
import { MusicTrack } from '../../lib/music';
import { LocalLP } from '../../lib/localCollection';

type Props = {
  onPlayTrack: (track: MusicTrack) => void;
  dustParticleCount: number;
};

function RoomScene({ onPlayTrack, dustParticleCount }: Props) {
  const { currentTrack, isPlaying } = usePlayerStore();
  const { lps } = useCollectionStore();

  const handleSelectLP = (lp: LocalLP) => {
    const track: MusicTrack = {
      id: lp.trackId,
      title: lp.title,
      artist: lp.artist,
      artistId: '',
      album: lp.album,
      albumId: '',
      previewUrl: lp.previewUrl,
      artworkUrl: lp.artworkUrl,
      duration: 30000,
      source: lp.source,
      externalUrl: '',
    };
    onPlayTrack(track);
  };

  return (
    <>
      {/* 카메라는 Canvas props로 설정 */}
      <RoomLighting isPlaying={isPlaying} />

      {/* ── 바닥 — 레드 카펫 ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#5A0A0A" roughness={0.95} />
      </mesh>

      {/* ── 뒷벽 ── */}
      <mesh position={[0, 2, -3]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#261500" roughness={0.85} />
      </mesh>

      {/* ── 좌벽 ── */}
      <mesh position={[-4, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#1F1000" roughness={0.9} />
      </mesh>

      {/* ── 우벽 ── */}
      <mesh position={[4, 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#1F1000" roughness={0.9} />
      </mesh>

      {/* ── 천장 ── */}
      <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#120800" roughness={1} />
      </mesh>

      {/* ── 카운터 ── */}
      <mesh position={[0, 0.25, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 0.5, 1.2]} />
        <meshStandardMaterial color="#2C1A0A" roughness={0.7} metalness={0.05} />
      </mesh>
      {/* 카운터 상판 */}
      <mesh position={[0, 0.52, 0.3]} receiveShadow>
        <boxGeometry args={[3.5, 0.04, 1.2]} />
        <meshStandardMaterial color="#3D2208" roughness={0.5} metalness={0.1} />
      </mesh>

      {/* ── 카운터 하부 패널 ── */}
      <mesh position={[0, 0.05, 0.3]}>
        <boxGeometry args={[3.5, 0.1, 1.2]} />
        <meshStandardMaterial color="#1A0A00" roughness={0.9} />
      </mesh>

      {/* ── 선반 (앨범 월 아래) ── */}
      <mesh position={[0, 1.0, -2.85]}>
        <boxGeometry args={[7, 0.06, 0.2]} />
        <meshStandardMaterial color="#3D2208" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.88, -2.85]}>
        <boxGeometry args={[7, 0.06, 0.2]} />
        <meshStandardMaterial color="#3D2208" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.76, -2.85]}>
        <boxGeometry args={[7, 0.06, 0.2]} />
        <meshStandardMaterial color="#3D2208" roughness={0.8} />
      </mesh>

      {/* ── 앰프 ── */}
      <mesh position={[0.9, 0.65, 0.5]} castShadow>
        <boxGeometry args={[0.35, 0.22, 0.28]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
      {/* 앰프 VU미터 */}
      <mesh position={[0.9, 0.72, 0.36]}>
        <planeGeometry args={[0.2, 0.08]} />
        <meshStandardMaterial
          color={isPlaying ? '#40FF40' : '#1A3A1A'}
          emissive={isPlaying ? '#20FF20' : '#000'}
          emissiveIntensity={isPlaying ? 0.5 : 0}
        />
      </mesh>

      {/* ── 데스크 램프 ── */}
      <mesh position={[-1.2, 0.68, 0.3]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.06, 16]} />
        <meshStandardMaterial color="#8B6914" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-1.2, 0.85, 0.3]}>
        <cylinderGeometry args={[0.005, 0.005, 0.34, 8]} />
        <meshStandardMaterial color="#B87333" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-1.2, 1.05, 0.3]} rotation={[Math.PI / 6, 0, 0]}>
        <coneGeometry args={[0.1, 0.12, 16, 1, true]} />
        <meshStandardMaterial color="#C87830" side={THREE.DoubleSide} roughness={0.4} />
      </mesh>

      {/* ── 턴테이블 ── */}
      <Turntable
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        position={[-0.5, 0.55, 0.3]}
      />

      {/* ── 앨범 월 ── */}
      <Suspense fallback={null}>
        <AlbumWall lps={lps} onSelectLP={handleSelectLP} />
      </Suspense>

      {/* ── 먼지 파티클 ── */}
      <DustParticles count={dustParticleCount} />

      {/* ── LP 스택 (카운터 위) ── */}
      {[0, 0.01, 0.02, 0.03, 0.04].map((y, i) => (
        <mesh key={i} position={[1.3, 0.56 + y, 0.2]} rotation={[0, i * 0.1, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.005, 32]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.2} />
        </mesh>
      ))}
    </>
  );
}

export function VinylRoom3D({ onPlayTrack, dustParticleCount }: Props) {
  return (
    <Canvas
      style={{ flex: 1 }}
      camera={{ position: [0, 1.8, 4.5], fov: 55 }}
      shadows
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      onCreated={({ camera }) => {
        camera.lookAt(0, 1, 0);
      }}
    >
      <Suspense fallback={null}>
        <RoomScene onPlayTrack={onPlayTrack} dustParticleCount={dustParticleCount} />
      </Suspense>
    </Canvas>
  );
}
