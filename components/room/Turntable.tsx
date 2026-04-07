import React from 'react';
import * as THREE from 'three';
import { VinylRecord } from './VinylRecord';
import { ToneArm } from './ToneArm';
import { MusicTrack } from '../../lib/music';

type Props = {
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  position?: [number, number, number];
};

export function Turntable({ currentTrack, isPlaying, position = [-0.5, 0.5, 0.5] }: Props) {
  const albumArtUrl = currentTrack?.artworkUrl ?? null;

  return (
    <group position={position}>
      {/* 본체 — 다크 우드 */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[0.9, 0.08, 0.7]} />
        <meshStandardMaterial color="#2C1A0A" roughness={0.8} metalness={0.05} />
      </mesh>

      {/* 측면 금속 엣지 */}
      {[[-0.45, 0, 0], [0.45, 0, 0]].map(([x, y, z], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]}>
          <boxGeometry args={[0.005, 0.085, 0.72]} />
          <meshStandardMaterial color="#B87333" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* 플래터 (회전판) — 매트 블랙 */}
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.01, 64]} />
        <meshStandardMaterial color="#111" roughness={0.9} />
      </mesh>

      {/* LP판 */}
      <group position={[0, 0.055, 0]}>
        <VinylRecord
          albumArtUrl={albumArtUrl}
          isPlaying={isPlaying}
          isDamaged={false}
        />
      </group>

      {/* 스핀들 */}
      <mesh position={[0, 0.075, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.03, 8]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 바늘 암 */}
      <ToneArm isPlaying={isPlaying} />

      {/* 전원 버튼 */}
      <mesh position={[0.38, 0.045, 0.28]}>
        <cylinderGeometry args={[0.015, 0.015, 0.005, 16]} />
        <meshStandardMaterial
          color={isPlaying ? '#40FF40' : '#404040'}
          emissive={isPlaying ? '#20FF20' : '#000'}
          emissiveIntensity={isPlaying ? 1 : 0}
        />
      </mesh>
    </group>
  );
}
