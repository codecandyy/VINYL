import React, { useRef } from 'react';
import { Platform } from 'react-native';
import { Text, Html } from '@react-three/drei';
import * as THREE from 'three';

// troika-three-text(drei <Text>)는 TTF/OTF/WOFF(v1)만 파싱함. Three.js typeface.json URL은
// 항상 바이너리 폰트 파서로 읽혀 DataView 오류가 난다. font 미지정 시 Noto 기본 폴백 사용.

type BtnProps = {
  x: number;
  label: string;
  sub: string;
  onPress: () => void;
};

function CounterMeshButton({ x, label, sub, onPress }: BtnProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const onPointerDown = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onPress();
  };

  return (
    <group position={[x, 0, 0]}>
      <mesh
        ref={meshRef}
        onPointerDown={onPointerDown}
        onPointerOver={() => {
          if (meshRef.current) (meshRef.current.material as THREE.MeshStandardMaterial).emissive.set('#553010');
        }}
        onPointerOut={() => {
          if (meshRef.current) (meshRef.current.material as THREE.MeshStandardMaterial).emissive.set('#000000');
        }}
      >
        <boxGeometry args={[0.34, 0.11, 0.025]} />
        <meshStandardMaterial color="#1E0D08" roughness={0.85} metalness={0.08} />
      </mesh>
      <Text
        position={[0, 0.01, 0.02]}
        fontSize={0.038}
        fontWeight={700}
        color="#D4A574"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
      <Text
        position={[0, -0.028, 0.02]}
        fontSize={0.022}
        fontWeight={500}
        color="#8B7355"
        anchorX="center"
        anchorY="middle"
      >
        {sub}
      </Text>
    </group>
  );
}

type Props = {
  coinBalance: number;
  onOpenSearch: () => void;
  onOpenVending: () => void;
  onShare: () => void;
  onOpenCollection: () => void;
};

/** 카운터 위 다이제틱 컨트롤 — 메시 + Troika 텍스트 (웹/네이티브 공통) */
export function ShopDiegeticUI({
  coinBalance,
  onOpenSearch,
  onOpenVending,
  onShare,
  onOpenCollection,
}: Props) {
  return (
    <group position={[0, 0.2, 1.12]}>
      <CounterMeshButton x={-0.42} label="＋ LP" sub="ADD" onPress={onOpenSearch} />
      <CounterMeshButton x={0} label="VEND" sub="DRAW" onPress={onOpenVending} />
      <CounterMeshButton x={0.42} label="SHARE" sub="ROOM" onPress={onShare} />
      <CounterMeshButton x={0.86} label="→" sub="COLLECT" onPress={onOpenCollection} />

      <group position={[0, 0.16, 0]}>
        <mesh position={[-0.85, 0, 0]}>
          <boxGeometry args={[0.2, 0.07, 0.02]} />
          <meshStandardMaterial color="#2A1810" emissive="#3D2518" emissiveIntensity={0.25} />
        </mesh>
        <Text
          position={[-0.85, 0, 0.015]}
          fontSize={0.032}
          fontWeight={600}
          color="#E8C088"
          anchorX="center"
          anchorY="middle"
        >
          {`COIN ${coinBalance}`}
        </Text>
      </group>

      {Platform.OS === 'web' && (
        <Html
          position={[0, -0.2, 0.15]}
          transform
          occlude={false}
          style={{
            pointerEvents: 'none',
            width: 280,
            marginLeft: -140,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontSize: 10,
              letterSpacing: '0.2em',
              color: 'rgba(232,192,136,0.45)',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            SHIMOKITAZAWA VINYL
          </span>
        </Html>
      )}
    </group>
  );
}
