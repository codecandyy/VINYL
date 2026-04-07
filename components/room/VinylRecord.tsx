import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

type Props = {
  albumArtUrl: string | null;
  isPlaying: boolean;
  isDamaged?: boolean;
};

export function VinylRecord({ albumArtUrl, isPlaying, isDamaged }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const rotRef = useRef(0);
  const speedRef = useRef(0);

  // 앨범아트 텍스처 (있을 경우)
  const albumTexture = albumArtUrl
    ? useLoader(THREE.TextureLoader, albumArtUrl)
    : null;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetSpeed = isPlaying ? 0.35 : 0;
    // 관성 감속/가속
    speedRef.current += (targetSpeed - speedRef.current) * 0.05;
    rotRef.current += speedRef.current * delta;
    groupRef.current.rotation.y = rotRef.current;
  });

  return (
    <group ref={groupRef}>
      {/* LP 본체 — 검정 비닐 */}
      <mesh>
        <cylinderGeometry args={[0.23, 0.23, 0.008, 64]} />
        <meshStandardMaterial
          color="#1A1A1A"
          roughness={0.15}
          metalness={0.1}
        />
      </mesh>

      {/* 그루브 링 효과 */}
      {[0.08, 0.12, 0.16, 0.20].map((r, i) => (
        <mesh key={i} position={[0, 0.005, 0]}>
          <ringGeometry args={[r, r + 0.003, 64]} />
          <meshStandardMaterial color="#222" roughness={0.05} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* 중앙 라벨 — 원형 앨범아트 */}
      <mesh position={[0, 0.005, 0]}>
        <circleGeometry args={[0.07, 64]} />
        <meshStandardMaterial
          map={albumTexture ?? undefined}
          color={albumTexture ? '#ffffff' : '#C87830'}
          roughness={0.6}
        />
      </mesh>

      {/* 손상 스크래치 오버레이 */}
      {isDamaged && (
        <mesh position={[0, 0.01, 0]} rotation={[0, Math.random() * Math.PI, 0]}>
          <planeGeometry args={[0.46, 0.003]} />
          <meshStandardMaterial color="#888" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}
