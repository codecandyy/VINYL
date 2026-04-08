import React, { useMemo } from 'react';
import * as THREE from 'three';
import { SHELF_CONFIG, getShelfInnerWidth, getTierBounds } from './ShelfUnit';

/** 포인터/레이캐스트 완전 무시 — 클릭 불가 장식만 */
const noHit: THREE.Mesh['raycast'] = () => {
  /* no intersects */
};

type Props = {
  position?: [number, number, number];
};

/**
 * 맨 아래 티어(카운터에 가려짐) — 서랍장 + 세로로 포개진 LP 더미. 상호작용 없음.
 */
export function ShelfBottomDecor({ position = [0, 0, -3.2] }: Props) {
  const { innerW, t0, midY, frontZ, drawerW, drawerH, drawerD } = useMemo(() => {
    const innerW = getShelfInnerWidth();
    const t0 = getTierBounds()[0];
    const midY = (t0.floorY + t0.ceilingY) / 2;
    const { d } = SHELF_CONFIG;
    const frontZ = d / 2 - 0.04;
    const innerH = t0.innerH - 0.03;
    return {
      innerW,
      t0,
      midY,
      frontZ,
      drawerW: Math.min(0.62, innerW * 0.34),
      drawerH: innerH * 0.92,
      drawerD: d * 0.52,
    };
  }, []);

  const drawerCenterX = -innerW / 2 + drawerW / 2 + 0.06;
  const wood = '#1A120C';
  const woodDark = '#120C08';
  const brass = '#8A7038';

  const lpColors = useMemo(
    () => [
      '#2C2420',
      '#252830',
      '#1E2832',
      '#322428',
      '#203528',
      '#2A2238',
      '#382820',
      '#1A2430',
    ],
    []
  );

  return (
    <group position={position}>
      {/* ── 좌측 3단 서랍 ── */}
      <group position={[drawerCenterX, midY, frontZ - drawerD / 2 + 0.02]}>
        <mesh raycast={noHit}>
          <boxGeometry args={[drawerW, drawerH, drawerD]} />
          <meshStandardMaterial color={wood} roughness={0.88} metalness={0.04} />
        </mesh>
        {/* 서랍 틈 / 손잡이 라인 */}
        {[-0.28, 0, 0.28].map((dy, i) => (
          <group key={i} position={[0, dy * drawerH * 0.33, drawerD / 2 + 0.001]}>
            <mesh raycast={noHit} position={[0, 0, 0]}>
              <boxGeometry args={[drawerW * 0.88, 0.014, 0.008]} />
              <meshStandardMaterial color={woodDark} roughness={0.95} metalness={0} />
            </mesh>
            <mesh raycast={noHit} position={[drawerW * 0.22, 0, 0.006]}>
              <boxGeometry args={[0.055, 0.01, 0.004]} />
              <meshStandardMaterial color={brass} roughness={0.35} metalness={0.65} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ── 우측 LP 세로 포개짐(슬리브 옆면이 보이는 느낌) ── */}
      <group position={[innerW * 0.08, t0.floorY + 0.02, frontZ - 0.12]}>
        {lpColors.map((c, k) => {
          const thin = 0.028;
          const h = 0.44 + (k % 3) * 0.018;
          const w = 0.36;
          const xOff = k * 0.038;
          const yOff = k * 0.022;
          const rotY = (k * 0.31 - 0.9) * 0.15;
          return (
            <mesh
              key={k}
              raycast={noHit}
              position={[xOff, yOff + h / 2, (k % 2) * 0.012]}
              rotation={[0, rotY, 0]}
            >
              <boxGeometry args={[thin, h, w]} />
              <meshStandardMaterial color={c} roughness={0.82} metalness={0.06} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
