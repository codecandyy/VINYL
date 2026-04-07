/**
 * LPSleeve — 클릭하면 슬리브가 열리고 안에서 LP를 꺼낼 수 있는 인터랙티브 LP 슬롯
 * 부모로부터 isOpen을 받아 애니메이션만 담당 (useFrame을 최소화)
 */
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { AlbumData, loadAlbumTexture } from '../../lib/albumTexture';
import { LocalLP } from '../../lib/localCollection';

const W = 0.615;
const H = 0.615;

type Props = {
  albumData: AlbumData;
  position: [number, number, number];
  isOpen: boolean;
  lp?: LocalLP;
  onToggle: () => void;
  onPickupLP: (worldPos: [number, number, number], lp: LocalLP, albumData: AlbumData) => void;
};

export function LPSleeve({ albumData, position, isOpen, lp, onToggle, onPickupLP }: Props) {
  const coverPivotRef = useRef<THREE.Group>(null);
  const lpRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [px, py, pz] = position;
  const needsAnim = useRef(false);

  useEffect(() => {
    needsAnim.current = true;
    // 슬리브가 닫힐 때 LP 위치 초기화
    if (!isOpen && lpRef.current) {
      lpRef.current.position.z = 0;
    }
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;
    loadAlbumTexture(albumData, (t) => {
      if (!cancelled) setTexture((prev) => { prev?.dispose(); return t; });
      else t.dispose();
    });
    return () => { cancelled = true; };
  }, [albumData]);

  useFrame((_, delta) => {
    if (!coverPivotRef.current) return;
    const targetY = isOpen ? -Math.PI * 0.78 : 0;
    const current = coverPivotRef.current.rotation.y;
    const diff = targetY - current;
    if (Math.abs(diff) > 0.001) {
      coverPivotRef.current.rotation.y += diff * Math.min(1, delta * 8);
      needsAnim.current = true;
    } else {
      needsAnim.current = false;
    }

    // LP 살짝 앞으로 나오기
    if (lpRef.current) {
      const lpTarget = isOpen ? 0.055 : 0;
      const lpDiff = lpTarget - lpRef.current.position.z;
      if (Math.abs(lpDiff) > 0.0005) {
        lpRef.current.position.z += lpDiff * Math.min(1, delta * 7);
      }
    }
  });

  const handleCoverClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onToggle();
  }, [onToggle]);

  const handleLPClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isOpen && lp) {
      onPickupLP([px, py, pz + 0.08], lp, albumData);
    }
  }, [isOpen, lp, onPickupLP, px, py, pz, albumData]);

  return (
    <group position={[px, py, pz]}>
      {/* 슬리브 뒷면 */}
      <mesh position={[0, 0, -0.008]}>
        <boxGeometry args={[W, H, 0.006]} />
        <meshStandardMaterial color="#100500" roughness={0.95} />
      </mesh>

      {/* LP 디스크 (슬리브 안) */}
      <group ref={lpRef} position={[0, 0, 0]}>
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          onClick={handleLPClick}
          onPointerOver={(e) => { if (isOpen) e.stopPropagation(); }}
        >
          <cylinderGeometry args={[H * 0.455, H * 0.455, 0.007, 28]} />
          <meshStandardMaterial
            color="#1C1C1C"
            roughness={0.28}
            metalness={0.45}
            emissive={isOpen ? '#3A2008' : '#000'}
            emissiveIntensity={isOpen ? 0.55 : 0}
          />
        </mesh>
        {/* LP 중앙 라벨 */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <cylinderGeometry args={[H * 0.16, H * 0.16, 0.003, 20]} />
          <meshStandardMaterial
            color={albumData.accent}
            roughness={0.65}
            emissive={albumData.accent}
            emissiveIntensity={isOpen ? 0.5 : 0.1}
          />
        </mesh>
        {/* "LIFT" 힌트 (열렸을 때 글로우 링) */}
        {isOpen && (
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
            <torusGeometry args={[H * 0.455, 0.006, 4, 32]} />
            <meshStandardMaterial color="#C87830" emissive="#C87830" emissiveIntensity={1.2} />
          </mesh>
        )}
      </group>

      {/* 커버 앞면 — 왼쪽 엣지 중심으로 열림 */}
      <group ref={coverPivotRef} position={[-W / 2, 0, 0.006]}>
        <mesh
          position={[W / 2, 0, 0]}
          onClick={handleCoverClick}
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={() => setHovered(false)}
        >
          <boxGeometry args={[W, H, 0.010]} />
          <meshStandardMaterial
            map={texture ?? undefined}
            color={texture ? '#F5EAD5' : albumData.bg}
            roughness={0.82}
            metalness={0.0}
            emissive={hovered && !isOpen ? albumData.accent : '#000'}
            emissiveIntensity={hovered && !isOpen ? 0.25 : 0}
          />
        </mesh>
      </group>
    </group>
  );
}
