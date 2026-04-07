import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VinylRecord } from './VinylRecord';
import { AlbumData } from '../../lib/albumTexture';

type Props = {
  currentAlbum: AlbumData | null;
  isPlaying: boolean;
  position?: [number, number, number];
};

export function Turntable({ currentAlbum, isPlaying, position = [0, 1.24, -2.72] }: Props) {
  const tonearmRef = useRef<THREE.Group>(null);
  const wobblePhase = useRef(0);

  useFrame((_, delta) => {
    if (!tonearmRef.current) return;
    const targetZ = isPlaying ? -0.30 : 0;
    tonearmRef.current.rotation.z +=
      (targetZ - tonearmRef.current.rotation.z) * Math.min(1, delta * 4.0);

    if (isPlaying) {
      wobblePhase.current += delta;
      tonearmRef.current.rotation.x =
        Math.sin(wobblePhase.current * 48) * 0.008 +
        Math.sin(wobblePhase.current * 11) * 0.003;
    } else {
      tonearmRef.current.rotation.x *= 0.92;
    }
  });

  return (
    <group position={position}>
      {/* ── 본체 (다크 우드) ── */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.88, 0.07, 0.7]} />
        <meshStandardMaterial color="#3C1A06" roughness={0.8} />
      </mesh>

      {/* 상판 */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.88, 0.006, 0.7]} />
        <meshStandardMaterial color="#5A2A0A" roughness={0.65} />
      </mesh>

      {/* 금속 엣지 트림 */}
      {([-0.44, 0.44] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0, 0]}>
          <boxGeometry args={[0.005, 0.078, 0.705]} />
          <meshStandardMaterial color="#B87333" metalness={0.92} roughness={0.12} />
        </mesh>
      ))}

      {/* ── 플래터 (회전판) ── */}
      <mesh position={[0, 0.046, 0]}>
        <cylinderGeometry args={[0.265, 0.265, 0.01, 48]} />
        <meshStandardMaterial color="#111" roughness={0.6} metalness={0.4} />
      </mesh>

      {/* 플래터 외곽 링 */}
      <mesh position={[0, 0.052, 0]}>
        <torusGeometry args={[0.258, 0.005, 8, 56]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* ── LP판 ── */}
      <group position={[0, 0.058, 0]}>
        <VinylRecord album={currentAlbum} isPlaying={isPlaying} />
      </group>

      {/* ── 스핀들 ── */}
      <mesh position={[0, 0.088, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 0.038, 12]} />
        <meshStandardMaterial color="#DDD" metalness={0.95} roughness={0.05} />
      </mesh>

      {/* ── 바늘 암 (Tonearm) ── */}
      <group ref={tonearmRef} position={[0.32, 0.058, -0.22]}>
        {/* 피벗 볼 */}
        <mesh>
          <sphereGeometry args={[0.015, 16, 16]} />
          <meshStandardMaterial color="#B87333" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* 암 튜브 */}
        <group rotation={[0, -0.78, 0]}>
          <mesh position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.005, 0.003, 0.37, 8]} />
            <meshStandardMaterial color="#C89040" metalness={0.88} roughness={0.12} />
          </mesh>
          {/* 헤드셸 */}
          <mesh position={[-0.36, -0.012, 0]}>
            <boxGeometry args={[0.04, 0.009, 0.02]} />
            <meshStandardMaterial color="#8B6914" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* 바늘 */}
          <mesh position={[-0.37, -0.026, 0]}>
            <coneGeometry args={[0.0022, 0.016, 6]} />
            <meshStandardMaterial color="#DDD" metalness={1} roughness={0.05} />
          </mesh>
        </group>
      </group>

      {/* ── 전원 LED ── */}
      <mesh position={[0.36, 0.047, 0.28]}>
        <cylinderGeometry args={[0.011, 0.011, 0.004, 16]} />
        <meshStandardMaterial
          color={isPlaying ? '#00FF40' : '#1A3A1A'}
          emissive={isPlaying ? '#00FF40' : '#000000'}
          emissiveIntensity={isPlaying ? 2.5 : 0}
        />
      </mesh>

      {/* ── 속도 노브 ── */}
      {([-0.28, -0.16] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0.047, 0.28]}>
          <cylinderGeometry args={[0.017, 0.017, 0.007, 20]} />
          <meshStandardMaterial color="#222" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}
