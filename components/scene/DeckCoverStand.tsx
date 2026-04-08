import React, { useEffect, useState } from 'react';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';

import { AlbumData, loadAlbumTexture } from '../../lib/albumTexture';

type Props = {
  album: AlbumData | null;
  /** 책장에서 턴테이블에 꽂은 LP가 있을 때만 */
  visible: boolean;
};

/**
 * 턴테이블 왼쪽 작은 거치대 — 재생 중인 수집 LP의 앨범 커버를 정면에서 보이게 (Billboard)
 */
export function DeckCoverStand({ album, visible }: Props) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!visible || !album) {
      setTexture((prev) => {
        prev?.dispose();
        return null;
      });
      return;
    }
    let cancelled = false;
    loadAlbumTexture(album, (t) => {
      if (!cancelled) setTexture((prev) => { prev?.dispose(); return t; });
      else t.dispose();
    });
    return () => {
      cancelled = true;
    };
  }, [album, visible]);

  if (!visible || !album) return null;

  return (
    <group position={[-0.58, 0.01, 0]}>
      {/* 받침 판 — 약간 기울어진 나무 느낌 */}
      <mesh position={[0, 0.012, -0.045]} rotation={[0.5, 0, 0]}>
        <boxGeometry args={[0.29, 0.022, 0.16]} />
        <meshStandardMaterial color="#2C1C12" roughness={0.92} metalness={0.02} />
      </mesh>
      {/* 뒤 지지대 */}
      <mesh position={[0, 0.05, -0.095]} rotation={[0.22, 0, 0]}>
        <boxGeometry args={[0.26, 0.14, 0.018]} />
        <meshStandardMaterial color="#24180E" roughness={0.9} metalness={0.03} />
      </mesh>
      {/* 좌측 삼각 브레이스 */}
      <mesh position={[-0.11, 0.045, -0.06]} rotation={[0, 0, 0.35]}>
        <boxGeometry args={[0.02, 0.09, 0.045]} />
        <meshStandardMaterial color="#3A2818" roughness={0.88} />
      </mesh>
      <mesh position={[0.11, 0.045, -0.06]} rotation={[0, 0, -0.35]}>
        <boxGeometry args={[0.02, 0.09, 0.045]} />
        <meshStandardMaterial color="#3A2818" roughness={0.88} />
      </mesh>

      <Billboard position={[0, 0.095, 0.025]} follow>
        <mesh>
          <planeGeometry args={[0.23, 0.23]} />
          <meshStandardMaterial
            map={texture ?? undefined}
            color={texture ? '#ffffff' : album.bg}
            roughness={0.55}
            metalness={0.05}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Billboard>
    </group>
  );
}
