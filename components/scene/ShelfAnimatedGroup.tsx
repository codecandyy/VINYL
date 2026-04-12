import React, { Suspense, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { LocalLP } from '../../lib/localCollection';
import { AlbumData } from '../../lib/albumTexture';
import { ShelfUnit, SHELF_CONFIG } from './ShelfUnit';
import { AlbumCovers } from './AlbumCovers';

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

type Props = {
  shelfPosition: [number, number, number];
  slotLps: (LocalLP | undefined)[];
  shelfPage: number;
  /** null이면 대기. 값이 바뀌면 해당 페이지로 뒤집기 애니메이션 후 도달 */
  flipTargetPage: number | null;
  onFlipMid: (page: number) => void;
  onFlipDone: () => void;
  onPickupLP: (
    worldPos: [number, number, number],
    clientX: number,
    clientY: number,
    lp: LocalLP | undefined,
    albumData: AlbumData,
    shelfSlotIndex: number
  ) => void;
  onShelfCoverClosed: (slotIndex: number) => void;
  dragSourceSlotIndex: number | null;
  orphanSlotIndex: number | null;
  deckOccupiedSlotIndex: number | null;
  forceOpenIdx?: number | null;
};

/**
 * 책장 Y축 360° 뒤집기 — π에서 페이지 스왑(가장자리로 볼 때 커버 교체 느낌).
 */
export function ShelfAnimatedGroup({
  shelfPosition,
  slotLps,
  shelfPage,
  flipTargetPage,
  onFlipMid,
  onFlipDone,
  onPickupLP,
  onShelfCoverClosed,
  dragSourceSlotIndex,
  orphanSlotIndex,
  deckOccupiedSlotIndex,
  forceOpenIdx,
}: Props) {
  const rotRef = useRef<THREE.Group>(null);
  const animRef = useRef({
    active: false,
    t: 0,
    targetPage: 0,
    committed: false,
  });

  useEffect(() => {
    if (flipTargetPage == null) return;
    animRef.current = {
      active: true,
      t: 0,
      targetPage: flipTargetPage,
      committed: false,
    };
  }, [flipTargetPage]);

  useFrame((_, dt) => {
    const a = animRef.current;
    if (!a.active || !rotRef.current) return;
    a.t += dt;
    const D = 0.82;
    const h = D / 2;
    let ang = 0;
    if (a.t < h) {
      ang = easeInOutQuad(a.t / h) * Math.PI;
    } else {
      if (!a.committed) {
        a.committed = true;
        onFlipMid(a.targetPage);
      }
      const u = Math.min(1, (a.t - h) / h);
      ang = Math.PI + easeInOutQuad(u) * Math.PI;
    }
    rotRef.current.rotation.y = ang;
    if (a.t >= D) {
      rotRef.current.rotation.y = 0;
      a.active = false;
      a.t = 0;
      onFlipDone();
    }
  });

  const [ox, oy, oz] = shelfPosition;
  const hc = SHELF_CONFIG.h / 2;

  return (
    <group position={[ox, oy + hc, oz]}>
      <group ref={rotRef} position={[0, -hc, 0]}>
        <ShelfUnit position={[0, 0, 0]} />
        <Suspense fallback={null}>
          <AlbumCovers
            slotLps={slotLps}
            shelfPage={shelfPage}
            shelfPosition={[0, 0, 0]}
            onPickupLP={onPickupLP}
            onShelfCoverClosed={onShelfCoverClosed}
            dragSourceSlotIndex={dragSourceSlotIndex}
            orphanSlotIndex={orphanSlotIndex}
            deckOccupiedSlotIndex={deckOccupiedSlotIndex}
            forceOpenIdx={forceOpenIdx}
          />
        </Suspense>
      </group>
    </group>
  );
}
