import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three'; // THREE.Texture type
import { DEMO_ALBUMS, AlbumData, loadAlbumTexture } from '../../lib/albumTexture';
import { LocalLP } from '../../lib/localCollection';
import { SHELF_CONFIG } from './ShelfUnit';

const COVER_W = 0.615;
const COVER_H = 0.615;
const COVER_D = 0.028;
const GAP = 0.01;

// 선반 구역별 앨범 배치 정보
// 중앙 구역 (x: -2.12~2.12)에는 턴테이블이 있으므로 좌우 구역에만 배치
// Left zone: x -3.5 ~ -2.17  (약 2열 * 2개 = 최대 4장)
// Right zone: x 2.17 ~ 3.5   (약 2열 * 2개 = 최대 4장)
// Center zone: x -2.12 ~ 2.12 (약 5장씩 — 턴테이블 중단 제외)

type SlotConfig = {
  row: number;     // 0=bottom, 1=middle, 2=top
  col: number;     // 좌→우
  zone: 'left' | 'center' | 'right';
};

function buildSlots(): { x: number; y: number; z: number }[] {
  const { shelfYs, panelThick, d } = SHELF_CONFIG;
  const slots: { x: number; y: number; z: number }[] = [];

  // 선반 앞면(z = +d/2) 바로 앞에 커버 정면이 오도록 (이전: -d 보정으로 뒷판 쪽에 박혀 거의 안 보임)
  const coverZ = d / 2 - COVER_D / 2 - 0.015;

  for (let row = 0; row < 3; row++) {
    const baseY = shelfYs[row] + panelThick + COVER_H / 2 + 0.005;
    const isMiddleRow = row === 1;

    if (isMiddleRow) {
      // 중단: 좌우 날개 (턴테이블 공간 -2.12~2.12 제외)
      // 왼쪽 날개: x -3.45 → -2.3  (2장)
      for (let c = 0; c < 2; c++) {
        const x = -3.4 + c * (COVER_W + GAP);
        slots.push({ x, y: baseY, z: coverZ });
      }
      // 오른쪽 날개: x 2.3 → 3.45  (2장)
      for (let c = 0; c < 2; c++) {
        const x = 2.32 + c * (COVER_W + GAP);
        slots.push({ x, y: baseY, z: coverZ });
      }
    } else {
      // 상/하단: 전체 너비 (7장, 좌우 분리대 고려)
      const startX = -3.4;
      const nPerRow = 7;
      for (let c = 0; c < nPerRow; c++) {
        // 분리대(±2.12) 겹침 건너뜀
        const x = startX + c * (COVER_W + GAP * 2);
        if (Math.abs(x) > 2.85) continue;
        slots.push({ x, y: baseY, z: coverZ });
      }
    }
  }
  return slots;
}

type SingleCoverProps = {
  albumData: AlbumData;
  position: [number, number, number];
  index: number;
  onSelect: (data: AlbumData, index: number) => void;
};

function SingleCover({ albumData, position, index, onSelect }: SingleCoverProps) {
  const [hovered, setHovered] = useState(false);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [px, py, pz] = position;

  useEffect(() => {
    let cancelled = false;
    loadAlbumTexture(albumData, (t) => {
      if (!cancelled) {
        setTexture((prev) => {
          if (prev && prev !== t) prev.dispose();
          return t;
        });
      } else {
        t.dispose();
      }
    });
    return () => { cancelled = true; };
  }, [albumData]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(albumData, index);
  }, [albumData, index, onSelect]);

  // 호버 시 즉각 z 이동 (useFrame 제거)
  const posZ = hovered ? pz + 0.055 : pz;

  return (
    <mesh
      position={[px, py, posZ]}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[COVER_W, COVER_H, COVER_D]} />
      <meshStandardMaterial
        map={texture ?? undefined}
        color={texture ? '#ffffff' : albumData.bg}
        roughness={0.6}
        metalness={0.0}
        emissive={hovered ? albumData.accent : albumData.bg}
        emissiveIntensity={hovered ? 0.5 : 0.15}
      />
    </mesh>
  );
}

type Props = {
  lps: LocalLP[];                // 실제 컬렉션
  onSelectAlbum: (albumData: AlbumData, lpRecord?: LocalLP) => void;
  shelfPosition?: [number, number, number];
};

export function AlbumCovers({ lps, onSelectAlbum, shelfPosition = [0, 0, -3.0] }: Props) {
  const slots = useMemo(() => buildSlots(), []);

  // lp 컬렉션이 있으면 우선, 없으면 데모 앨범으로 채움
  const covers = useMemo(() => {
    return slots.map((slot, i) => {
      const lp = lps[i];
      const demoData = DEMO_ALBUMS[i % DEMO_ALBUMS.length];
      const albumData: AlbumData = lp
        ? {
            bg: lp.labelColor,
            accent: '#FFD88A',
            title: lp.title,
            artist: lp.artist,
            coverUrl: lp.artworkUrl ?? undefined,
          }
        : demoData;
      return { slot, albumData, lp };
    });
  }, [slots, lps]);

  const handleSelect = useCallback((albumData: AlbumData, index: number) => {
    const lp = lps[index];
    onSelectAlbum(albumData, lp);
  }, [lps, onSelectAlbum]);

  const [ox, oy, oz] = shelfPosition;

  return (
    <group>
      {covers.map(({ slot, albumData }, i) => (
        <SingleCover
          key={i}
          albumData={albumData}
          position={[ox + slot.x, oy + slot.y, oz + slot.z]}
          index={i}
          onSelect={handleSelect}
        />
      ))}
    </group>
  );
}
