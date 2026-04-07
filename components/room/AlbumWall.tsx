import React, { useRef, useState, useCallback } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { LocalLP } from '../../lib/localCollection';
import { getSanitizedArtworkUrl } from '../../lib/albumTexture';
import { ALBUM_WALL_COLS, ALBUM_WALL_ROWS, MAX_ALBUMS } from '../../lib/constants';

// Three.js 텍스처 캐시 활성화
THREE.Cache.enabled = true;

type AlbumSlotProps = {
  lp: LocalLP | null;
  position: [number, number, number];
  index: number;
  onSelect: (lp: LocalLP) => void;
};

function AlbumSlot({ lp, position, index, onSelect }: AlbumSlotProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const artUrl = getSanitizedArtworkUrl(lp?.artworkUrl ?? null);
  const texture = artUrl ? useLoader(THREE.TextureLoader, artUrl) : null;

  const handleClick = useCallback(() => {
    if (lp) onSelect(lp);
  }, [lp, onSelect]);

  return (
    <group position={position}>
      {/* 앨범 프레임 (약간 큰 배경) */}
      <mesh position={[0, 0, -0.005]}>
        <boxGeometry args={[0.72, 0.72, 0.01]} />
        <meshStandardMaterial color="#1A0A00" roughness={0.9} />
      </mesh>

      {/* 앨범 커버 */}
      <mesh
        ref={meshRef}
        position={[0, 0, hovered ? 0.04 : 0]}
        onClick={handleClick}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
        userData={{ lpId: lp?.id, trackId: lp?.trackId }}
      >
        <planeGeometry args={[0.68, 0.68]} />
        <meshStandardMaterial
          map={texture ?? undefined}
          color={texture ? '#ffffff' : '#2C1A0A'}
          roughness={0.7}
          emissive={hovered ? '#C87030' : '#000000'}
          emissiveIntensity={hovered ? 0.15 : 0}
        />
      </mesh>

      {/* 빈 슬롯 — + 표시 (텍스트 대신 작은 십자 메시) */}
      {!lp && (
        <>
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[0.02, 0.14]} />
            <meshStandardMaterial color="#3D2208" />
          </mesh>
          <mesh position={[0, 0, 0.001]}>
            <planeGeometry args={[0.14, 0.02]} />
            <meshStandardMaterial color="#3D2208" />
          </mesh>
        </>
      )}

      {/* 손상된 LP 스크래치 오버레이 */}
      {lp?.isDamaged && (
        <mesh position={[0, 0, 0.005]} rotation={[0, 0, 0.3]}>
          <planeGeometry args={[0.68, 0.004]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}

type Props = {
  lps: LocalLP[];
  onSelectLP: (lp: LocalLP) => void;
};

export function AlbumWall({ lps, onSelectLP }: Props) {
  const COL_GAP = 0.78;
  const ROW_GAP = 0.82;
  const WALL_X_OFFSET = -((ALBUM_WALL_COLS - 1) * COL_GAP) / 2;
  const WALL_Y_START = 2.6;

  const slots: (LocalLP | null)[] = Array.from(
    { length: MAX_ALBUMS },
    (_, i) => lps[i] ?? null
  );

  return (
    <group position={[0, 0, -2.9]}>
      {slots.map((lp, i) => {
        const col = i % ALBUM_WALL_COLS;
        const row = Math.floor(i / ALBUM_WALL_COLS);
        const x = WALL_X_OFFSET + col * COL_GAP;
        const y = WALL_Y_START - row * ROW_GAP;
        return (
          <AlbumSlot
            key={i}
            lp={lp}
            position={[x, y, 0]}
            index={i}
            onSelect={onSelectLP}
          />
        );
      })}
    </group>
  );
}
