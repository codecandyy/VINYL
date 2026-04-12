import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three'; // THREE.Texture type
import { DEMO_ALBUMS, AlbumData } from '../../lib/albumTexture';
import { LocalLP } from '../../lib/localCollection';
import { buildShelfAlbumSlots } from './ShelfUnit';
import { LPSleeve } from './LPSleeve';

type Props = {
  /** 길이 SHELF_SLOT_COUNT — 슬롯 i 에 놓인 LP (없으면 데모 커버) */
  slotLps: (LocalLP | undefined)[];
  shelfPage: number;
  shelfPosition?: [number, number, number];
  onPickupLP: (
    worldPos: [number, number, number],
    clientX: number,
    clientY: number,
    lp: LocalLP | undefined,
    albumData: AlbumData,
    shelfSlotIndex: number
  ) => void;
  /** 해당 슬롯 커버가 닫힐 때 (다른 슬롯을 열면 이전 슬롯도 닫힌 것으로 처리) */
  onShelfCoverClosed: (slotIndex: number) => void;
  dragSourceSlotIndex: number | null;
  orphanSlotIndex: number | null;
  deckOccupiedSlotIndex: number | null;
  /** 제스처로 강제 오픈할 슬롯 인덱스 (null이면 비활성) */
  forceOpenIdx?: number | null;
};

export function AlbumCovers({
  slotLps,
  shelfPage,
  shelfPosition = [0, 0, -3.2],
  onPickupLP,
  onShelfCoverClosed,
  dragSourceSlotIndex,
  orphanSlotIndex,
  deckOccupiedSlotIndex,
  forceOpenIdx,
}: Props) {
  const slots = useMemo(() => buildShelfAlbumSlots(), []);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const prevForceOpenIdx = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    setOpenIdx(null);
  }, [shelfPage]);

  // 제스처 강제 오픈: forceOpenIdx가 바뀔 때만 반영 (null → 닫기, 숫자 → 열기)
  useEffect(() => {
    if (forceOpenIdx === prevForceOpenIdx.current) return;
    prevForceOpenIdx.current = forceOpenIdx;
    if (forceOpenIdx != null) {
      setOpenIdx(forceOpenIdx);
    } else {
      setOpenIdx(null);
    }
  }, [forceOpenIdx]);

  const covers = useMemo(
    () =>
      slots.map((slot, i) => {
        const lp = slotLps[i];
        const demo = DEMO_ALBUMS[i % DEMO_ALBUMS.length];
        const albumData: AlbumData = lp
          ? {
              bg: lp.labelColor,
              accent: lp.labelColor,
              labelColor: lp.labelColor,
              title: lp.album || lp.title,
              artist: lp.artist,
              coverUrl: lp.artworkUrl ?? undefined,
            }
          : demo;
        return { slot, albumData, lp, tilt: slot.tilt };
      }),
    [slots, slotLps]
  );

  const handleToggle = useCallback(
    (i: number) => {
      setOpenIdx((prev) => {
        if (prev === i) {
          queueMicrotask(() => onShelfCoverClosed(i));
          return null;
        }
        if (prev != null && prev !== i) {
          queueMicrotask(() => onShelfCoverClosed(prev));
        }
        return i;
      });
    },
    [onShelfCoverClosed]
  );

  const [ox, oy, oz] = shelfPosition;

  return (
    <group>
      {covers.map(({ slot, albumData, lp, tilt }, i) => {
        const hidePhysicalLp =
          dragSourceSlotIndex === i ||
          orphanSlotIndex === i ||
          deckOccupiedSlotIndex === i;
        const pickupAllowed = openIdx === i;

        return (
          <group key={i} rotation={[0, 0, tilt]}>
            <LPSleeve
              albumData={albumData}
              position={[ox + slot.x, oy + slot.y, oz + slot.z]}
              isOpen={openIdx === i}
              lp={lp}
              shelfSlotIndex={i}
              hidePhysicalLp={hidePhysicalLp}
              pickupAllowed={pickupAllowed}
              onToggle={() => handleToggle(i)}
              onPickupLP={onPickupLP}
            />
          </group>
        );
      })}
    </group>
  );
}
