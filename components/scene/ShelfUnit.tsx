import React from 'react';
import * as THREE from 'three';
import { useRoomStore } from '../../stores/roomStore';
import { THEMES } from '../../lib/themes';

/** 데스크에 가려지던 하단 대신 — 앞으로 돌출한 서랍 뱅크 (LP 구역은 그 위부터 2단) */
export const SHELF_DRAWER_BLOCK_H = 0.92;

const LP_TIER_STACK_H = 2.5; // 2단 × 1.25 간격

export const SHELF_CONFIG = {
  w: 5.85,
  h: SHELF_DRAWER_BLOCK_H + LP_TIER_STACK_H + 0.04,
  d: 0.65,
  panelThick: 0.045,
  sideThick: 0.08,
  /** LP 단 시작 높이(첫 선반) — 그 아래는 서랍 전용 */
  lpSectionBaseY: SHELF_DRAWER_BLOCK_H,
  /** 수평 선반 메시 중심 Y — 0번=LP 바닥선반, 서랍 구간에는 패널 없음 (2단 = 3 패널) */
  shelfPanelY: [
    SHELF_DRAWER_BLOCK_H,
    SHELF_DRAWER_BLOCK_H + 1.25,
    SHELF_DRAWER_BLOCK_H + 2.5,
  ] as const,
  rowHeight: 1.25,
};

/** 세로 칸막이 두께 */
export const CUBBY_DIVIDER_T = 0.026;
/** 한 단당 열 수 — 6열로 LP 크기 확대 */
export const CUBBY_COLS = 6;
/** 2단 × 열 수 — 페이지네이션·슬롯 배열 길이와 동기화 */
export const SHELF_SLOT_COUNT = CUBBY_COLS * 2;
/** 큐비 안쪽 비율 가로:세로 = 3:4 (세로가 더 김) */
const CUBBY_WH_RATIO = 4 / 3;

export function getShelfInnerWidth(): number {
  return SHELF_CONFIG.w - 2 * SHELF_CONFIG.sideThick;
}

export function getCubbyDimensions(): { cubbyW: number; cubbyH: number } {
  const innerW = getShelfInnerWidth();
  const n = CUBBY_COLS;
  const cubbyW = (innerW - (n - 1) * CUBBY_DIVIDER_T) / n;
  const cubbyH = CUBBY_WH_RATIO * cubbyW;
  return { cubbyW, cubbyH };
}

/**
 * LPSleeve 커버 — 정사각형(실제 LP 자켓 전면과 동일).
 * 칸(큐비)만 가로:세로=3:4이고, 그 안에 여백(특히 위)이 생기도록 가로 폭 기준으로 맞춤.
 */
export function getShelfCoverSize(): { w: number; h: number } {
  const { cubbyW, cubbyH } = getCubbyDimensions();
  const padW = 0.032;
  const padH = 0.028;
  const side = Math.min(cubbyW - padW, cubbyH - padH * 2);
  const s = Math.max(0.36, side);
  return { w: s, h: s };
}

/** 티어마다 선반 윗면 ~ 윗선반 아랫면 (앨범이 들어가는 내부 높이) */
export function getTierBounds(): { floorY: number; ceilingY: number; innerH: number }[] {
  const { shelfPanelY, panelThick } = SHELF_CONFIG;
  const tiers: { floorY: number; ceilingY: number; innerH: number }[] = [];
  for (let i = 0; i < 2; i++) {
    const floorY = shelfPanelY[i] + panelThick / 2;
    const ceilingY = shelfPanelY[i + 1] - panelThick / 2;
    tiers.push({ floorY, ceilingY, innerH: ceilingY - floorY });
  }
  return tiers;
}

export function cellLeftX(col: number, cubbyW: number): number {
  const innerW = getShelfInnerWidth();
  const L = -innerW / 2;
  return L + col * (cubbyW + CUBBY_DIVIDER_T);
}

export function cellCenterX(col: number, cubbyW: number): number {
  return cellLeftX(col, cubbyW) + cubbyW / 2;
}

/**
 * 앨범(슬리브) 중심 Y — 선반 바닥에 얹음. 정사각 커버 높이 기준(3:4 칸 안 위쪽 여백)
 */
export function albumCenterYForTier(tierIndex: number, coverH?: number): number {
  const h = coverH ?? getShelfCoverSize().h;
  const { floorY } = getTierBounds()[tierIndex];
  const floorPad = 0.012;
  return floorY + floorPad + h / 2;
}

export function buildShelfAlbumSlots(): { x: number; y: number; z: number; tilt: number }[] {
  const { d } = SHELF_CONFIG;
  const { cubbyW } = getCubbyDimensions();
  const coverZ = d / 2 - 0.006;
  const slots: { x: number; y: number; z: number; tilt: number }[] = [];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < CUBBY_COLS; col++) {
      const seed = row * 100 + col;
      const tilt = (Math.sin(seed * 127.1) * 0.5 + Math.cos(seed * 311.7) * 0.5) * 0.006;
      slots.push({
        x: cellCenterX(col, cubbyW),
        y: albumCenterYForTier(row),
        z: coverZ,
        tilt,
      });
    }
  }
  return slots;
}

type Props = {
  position?: [number, number, number];
};

export function ShelfUnit({ position = [0, 0, -3.0] }: Props) {
  const { w, h, d, panelThick, sideThick, shelfPanelY, lpSectionBaseY } = SHELF_CONFIG;
  const roomTheme = useRoomStore((s) => s.roomTheme);
  const thm = THEMES[roomTheme];

  const shelfPanels = shelfPanelY.map((y, idx) => ({
    y,
    label: ['bottom', 'shelf1', 'top'][idx],
  }));

  const tiers = getTierBounds();
  const { cubbyW } = getCubbyDimensions();
  const innerW = getShelfInnerWidth();
  const L = -innerW / 2;

  const dividerDepth = d - panelThick - 0.04;
  const dividerZ = -panelThick / 2 + 0.01;

  const drawerH = SHELF_DRAWER_BLOCK_H;
  const drawerPadY = 0.026;
  const drawerCount = 3;
  const drawerSlotH = (drawerH - drawerPadY * 2) / drawerCount;
  const drawerFaceDepth = 0.042;
  const drawerFaceZ = d / 2 + drawerFaceDepth / 2 - 0.004;
  const drawerFaceW = innerW - 0.06;
  const handleMat = { color: '#8A6E38', roughness: 0.35, metalness: 0.55 } as const;

  return (
    <group position={position}>

      {/* ── 뒷판 ── */}
      <mesh position={[0, h / 2, -(d / 2 - panelThick / 2)]}>
        <boxGeometry args={[w, h, panelThick]} />
        <meshStandardMaterial color={thm.shelfBack} roughness={0.95} metalness={0} />
      </mesh>

      {/* ── 좌측판 ── */}
      <mesh position={[-w / 2 + sideThick / 2, h / 2, 0]}>
        <boxGeometry args={[sideThick, h + sideThick, d]} />
        <meshStandardMaterial color={thm.shelfPanel} roughness={0.9} metalness={0.02} />
      </mesh>

      {/* ── 우측판 ── */}
      <mesh position={[w / 2 - sideThick / 2, h / 2, 0]}>
        <boxGeometry args={[sideThick, h + sideThick, d]} />
        <meshStandardMaterial color={thm.shelfPanel} roughness={0.9} metalness={0.02} />
      </mesh>

      {/* ── 수평 선반 패널 ── */}
      {shelfPanels.map(({ y, label }) => (
        <mesh key={label} position={[0, y, 0]}>
          <boxGeometry args={[w - sideThick * 2, panelThick, d]} />
          <meshStandardMaterial color={thm.shelfSurface} roughness={0.88} metalness={0.02} />
        </mesh>
      ))}

      {/* ── 서랍 구간 뒤판 (내부) ── */}
      <mesh position={[0, drawerH / 2, -(d / 2 - panelThick - 0.003)]}>
        <boxGeometry args={[innerW - 0.02, drawerH - 0.02, 0.008]} />
        <meshStandardMaterial color="#0C0806" roughness={1} metalness={0} />
      </mesh>

      {/* ── 하단 킥 + 서랍 전면(앞으로 돌출) ── */}
      <mesh position={[0, 0.014, d / 2 - 0.006]}>
        <boxGeometry args={[w - 0.04, 0.028, 0.024]} />
        <meshStandardMaterial color="#1A120C" roughness={0.92} metalness={0.04} />
      </mesh>
      {Array.from({ length: drawerCount }, (_, i) => {
        const cy = drawerPadY + drawerSlotH * (i + 0.5);
        const fh = drawerSlotH - 0.018;
        return (
          <group key={`dr-${i}`}>
            <mesh position={[0, cy, drawerFaceZ]}>
              <boxGeometry args={[drawerFaceW, fh, drawerFaceDepth]} />
              <meshStandardMaterial color="#2A1C14" roughness={0.78} metalness={0.06} />
            </mesh>
            {/* 모따기 느낌 상·하 그림자 립 */}
            <mesh position={[0, cy + fh * 0.42, drawerFaceZ + drawerFaceDepth * 0.32]}>
              <boxGeometry args={[drawerFaceW * 0.92, 0.008, 0.006]} />
              <meshStandardMaterial color="#0A0604" roughness={1} metalness={0} />
            </mesh>
            <mesh position={[0, cy - fh * 0.42, drawerFaceZ + drawerFaceDepth * 0.32]}>
              <boxGeometry args={[drawerFaceW * 0.92, 0.008, 0.006]} />
              <meshStandardMaterial color="#0A0604" roughness={1} metalness={0} />
            </mesh>
            {/* 손잡이 바 */}
            <mesh position={[0, cy, drawerFaceZ + drawerFaceDepth * 0.42]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.011, 0.011, drawerFaceW * 0.38, 16]} />
              <meshStandardMaterial {...handleMat} />
            </mesh>
          </group>
        );
      })}

      {/* ── LP 바닥선반 아래·서랍 위 이음새 트림 ── */}
      <mesh position={[0, lpSectionBaseY - panelThick / 2 - 0.002, d / 2 - 0.004]}>
        <boxGeometry args={[w - 0.02, 0.012, 0.014]} />
        <meshStandardMaterial color="#5C4820" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* ── 내부 천장면 (어두운 내부감) ── */}
      {shelfPanels.slice(1).map(({ y, label }) => (
        <mesh key={`ceil-${label}`} position={[0, y - panelThick / 2 - 0.001, 0]}>
          <boxGeometry args={[w - sideThick * 2 - 0.01, 0.002, d - panelThick - 0.01]} />
          <meshStandardMaterial color="#080604" roughness={1} metalness={0} />
        </mesh>
      ))}

      {/* ── 내부 뒷벽 (티어별) ── */}
      {tiers.map((t, i) => (
        <mesh key={`back-${i}`} position={[0, (t.floorY + t.ceilingY) / 2, -(d / 2 - panelThick - 0.002)]}>
          <boxGeometry args={[w - sideThick * 2 - 0.01, t.innerH - 0.008, 0.002]} />
          <meshStandardMaterial color="#080604" roughness={1} metalness={0} />
        </mesh>
      ))}

      {/* ── 세로 칸막이 — 각 티어·열 사이 (실제 큐비 구획) ── */}
      {tiers.map((t, tierIdx) => {
        const divH = t.innerH - 0.006;
        const divY = (t.floorY + t.ceilingY) / 2;
        return (
          <group key={`divtier-${tierIdx}`}>
            {Array.from({ length: CUBBY_COLS - 1 }, (_, k) => {
              const xCenter = L + (k + 1) * cubbyW + k * CUBBY_DIVIDER_T + CUBBY_DIVIDER_T / 2;
              return (
                <mesh key={k} position={[xCenter, divY, dividerZ]}>
                  <boxGeometry args={[CUBBY_DIVIDER_T, divH, dividerDepth]} />
                  <meshStandardMaterial color="#16100A" roughness={0.9} metalness={0.02} />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* ── 앞 엣지 몰딩 — 옥시다이즈드 브라스 ── */}
      {shelfPanels.map(({ y, label }) => (
        <mesh key={`trim-${label}`} position={[0, y + panelThick / 2 + 0.001, d / 2 - 0.005]}>
          <boxGeometry args={[w, 0.016, 0.012]} />
          <meshStandardMaterial color="#7A5E28" roughness={0.42} metalness={0.48} />
        </mesh>
      ))}

      {/* ── 측면 페이크 섀도 ── */}
      {([-w / 2 + sideThick + 0.001, w / 2 - sideThick - 0.001] as number[]).map((x, i) => (
        <mesh
          key={`shd-${i}`}
          position={[x, h / 2, 0]}
          rotation={[0, i === 0 ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          <planeGeometry args={[d, h]} />
          <meshBasicMaterial color="#000" transparent opacity={0.28} depthWrite={false} side={THREE.FrontSide} />
        </mesh>
      ))}
    </group>
  );
}
