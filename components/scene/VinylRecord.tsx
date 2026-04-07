import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AlbumData } from '../../lib/albumTexture';

type Props = {
  album: AlbumData | null;
  isPlaying: boolean;
  scale?: number;
};

export function VinylRecord({ album, isPlaying, scale = 1 }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const speedRef = useRef(0);
  const rotRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = isPlaying ? 0.38 : 0;
    speedRef.current += (target - speedRef.current) * 0.05;
    rotRef.current += speedRef.current * delta;
    groupRef.current.rotation.y = rotRef.current;
  });

  // Label color from album or default copper
  const labelColor = album?.accent ?? '#C87830';

  return (
    <group ref={groupRef} scale={scale}>
      {/* 비닐 본체 — 매트 블랙 */}
      <mesh castShadow>
        <cylinderGeometry args={[0.235, 0.235, 0.006, 32]} />
        <meshStandardMaterial color="#0F0F0F" roughness={0.25} metalness={0.6} />
      </mesh>

      {/* 홈 반사링 — 약한 무지개 (단순 thin ring) */}
      <mesh position={[0, 0.004, 0]}>
        <torusGeometry args={[0.17, 0.055, 3, 40]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* 중앙 라벨 */}
      <mesh position={[0, 0.004, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 0.007, 48]} />
        <meshStandardMaterial
          color={labelColor}
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>

      {/* 라벨 텍스트 (band) */}
      <mesh position={[0, 0.007, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.007, 32]} />
        <meshStandardMaterial color="#1A0800" roughness={0.8} />
      </mesh>

      {/* 스핀들 홀 */}
      <mesh position={[0, 0.009, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.012, 12]} />
        <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}
