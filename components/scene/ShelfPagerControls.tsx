import React, { useRef } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

import { SHELF_CONFIG, albumCenterYForTier } from './ShelfUnit';

type Props = {
  shelfPosition: [number, number, number];
  page: number;
  maxPage: number;
  onPrev: () => void;
  onNext: () => void;
  /** LP 드래그·공중 유실 중에는 페이지 고정 */
  locked?: boolean;
};

function PagerMeshButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <group>
      <mesh
        ref={meshRef}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (!disabled) onPress();
        }}
        onPointerOver={() => {
          if (disabled || !meshRef.current) return;
          (meshRef.current.material as THREE.MeshStandardMaterial).emissive.set('#553010');
        }}
        onPointerOut={() => {
          if (!meshRef.current) return;
          (meshRef.current.material as THREE.MeshStandardMaterial).emissive.set('#000000');
        }}
      >
        <boxGeometry args={[0.3, 0.38, 0.06]} />
        <meshStandardMaterial
          color={disabled ? '#1A120C' : '#1E0D08'}
          roughness={0.88}
          metalness={0.06}
          emissive={disabled ? '#0A0806' : '#000000'}
        />
      </mesh>
      <Text
        position={[0, 0, 0.025]}
        fontSize={0.12}
        fontWeight={800}
        color={disabled ? '#5C4A3A' : '#D4A574'}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

/** 책장 ◀ ▶ — ◀ 최신(앞 페이지), › 예전·샘플(뒤 페이지, 맨 끝=가장 옛날) */
export function ShelfPagerControls({
  shelfPosition,
  page,
  maxPage,
  onPrev,
  onNext,
  locked = false,
}: Props) {
  const [ox, oy, oz] = shelfPosition;
  const midY = (albumCenterYForTier(0) + albumCenterYForTier(1)) / 2 + oy;
  const halfW = SHELF_CONFIG.w / 2;
  /** 포스터와 x 겹침 줄이려면 책장·포스터 사이에 버튼이 오도록 간격 유지 */
  const gap = 0.4;
  const btnX = halfW + gap;
  const btnZ = oz + SHELF_CONFIG.d / 2 + 0.26;

  return (
    <group>
      <group position={[ox - btnX, midY, btnZ]}>
        <PagerMeshButton label="‹" disabled={locked || page <= 0} onPress={onPrev} />
      </group>
      <group position={[ox + btnX, midY, btnZ]}>
        <PagerMeshButton label="›" disabled={locked || page >= maxPage} onPress={onNext} />
      </group>
    </group>
  );
}
