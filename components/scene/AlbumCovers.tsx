import React, { useState, useMemo, useCallback } from 'react';
import * as THREE from 'three'; // THREE.Texture type
import { DEMO_ALBUMS, AlbumData } from '../../lib/albumTexture';
import { LocalLP } from '../../lib/localCollection';
import { SHELF_CONFIG } from './ShelfUnit';
import { LPSleeve } from './LPSleeve';

const COVER_W = 0.615;
const COVER_H = 0.615;
const GAP = 0.01;

function buildSlots(): { x: number; y: number; z: number }[] {
  const { shelfYs, panelThick, d } = SHELF_CONFIG;
  const slots: { x: number; y: number; z: number }[] = [];
  const coverZ = d / 2 - 0.005; // 선반 앞면에 딱 붙게

  for (let row = 0; row < 3; row++) {
    const baseY = shelfYs[row] + panelThick + COVER_H / 2 + 0.004;
    const isMiddleRow = row === 1;

    if (isMiddleRow) {
      // 중단: 좌우 날개만 (턴테이블 영역 제외)
      for (let c = 0; c < 2; c++) {
        slots.push({ x: -3.38 + c * (COVER_W + GAP), y: baseY, z: coverZ });
      }
      for (let c = 0; c < 2; c++) {
        slots.push({ x: 2.32 + c * (COVER_W + GAP), y: baseY, z: coverZ });
      }
    } else {
      // 상·하단: 전체 너비
      for (let c = 0; c < 7; c++) {
        const x = -3.38 + c * (COVER_W + GAP * 2);
        if (Math.abs(x) > 2.9) continue;
        slots.push({ x, y: baseY, z: coverZ });
      }
    }
  }
  return slots;
}

type Props = {
  lps: LocalLP[];
  shelfPosition?: [number, number, number];
  onPickupLP: (worldPos: [number, number, number], lp: LocalLP, albumData: AlbumData) => void;
};

export function AlbumCovers({ lps, shelfPosition = [0, 0, -3.2], onPickupLP }: Props) {
  const slots = useMemo(() => buildSlots(), []);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const covers = useMemo(() =>
    slots.map((slot, i) => {
      const lp = lps[i];
      const demo = DEMO_ALBUMS[i % DEMO_ALBUMS.length];
      const albumData: AlbumData = lp
        ? { bg: lp.labelColor, accent: '#FFD88A', title: lp.title, artist: lp.artist, coverUrl: lp.artworkUrl ?? undefined }
        : demo;
      return { slot, albumData, lp };
    }),
    [slots, lps]
  );

  const handleToggle = useCallback((i: number) => {
    setOpenIdx((cur) => (cur === i ? null : i));
  }, []);

  const [ox, oy, oz] = shelfPosition;

  return (
    <group>
      {covers.map(({ slot, albumData, lp }, i) => (
        <LPSleeve
          key={i}
          albumData={albumData}
          position={[ox + slot.x, oy + slot.y, oz + slot.z]}
          isOpen={openIdx === i}
          lp={lp}
          onToggle={() => handleToggle(i)}
          onPickupLP={onPickupLP}
        />
      ))}
    </group>
  );
}
