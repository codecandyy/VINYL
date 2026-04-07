import React from 'react';

// 선반 전체 (벽면 책장 구조)
// w=7.0, h=3.6, d=0.5
export const SHELF_CONFIG = {
  w: 7.0,
  h: 3.6,
  d: 0.45,
  panelThick: 0.045,
  shelfYs: [0.0, 1.2, 2.44],
  rowHeight: 1.1,
};

type Props = {
  position?: [number, number, number];
};

export function ShelfUnit({ position = [0, 0, -3.0] }: Props) {
  const { w, h, d, panelThick } = SHELF_CONFIG;

  const shelfPanels = [
    { y: 0,    desc: 'bottom' },
    { y: 1.18, desc: 'shelf1' },
    { y: 2.38, desc: 'shelf2' },
    { y: h,    desc: 'top'    },
  ];

  return (
    <group position={position}>
      {/* 뒷판 */}
      <mesh position={[0, h / 2, -(d / 2 - panelThick / 2)]} receiveShadow>
        <boxGeometry args={[w, h, panelThick]} />
        <meshStandardMaterial color="#3A1A06" roughness={0.85} />
      </mesh>

      {/* 좌측판 */}
      <mesh position={[-w / 2 + panelThick / 2, h / 2, 0]} castShadow>
        <boxGeometry args={[panelThick, h + panelThick, d]} />
        <meshStandardMaterial color="#4A2208" roughness={0.8} />
      </mesh>

      {/* 우측판 */}
      <mesh position={[w / 2 - panelThick / 2, h / 2, 0]} castShadow>
        <boxGeometry args={[panelThick, h + panelThick, d]} />
        <meshStandardMaterial color="#4A2208" roughness={0.8} />
      </mesh>

      {/* 수평 선반 패널들 */}
      {shelfPanels.map(({ y, desc }) => (
        <mesh key={desc} position={[0, y, 0]} receiveShadow castShadow>
          <boxGeometry args={[w, panelThick, d]} />
          <meshStandardMaterial color="#5A2A0A" roughness={0.75} />
        </mesh>
      ))}

      {/* 중앙 수직 칸막이 */}
      {([-2.12, 2.12] as number[]).map((x, i) => (
        <mesh key={i} position={[x, h / 2, 0]} castShadow>
          <boxGeometry args={[panelThick, h, d]} />
          <meshStandardMaterial color="#3A1806" roughness={0.85} />
        </mesh>
      ))}

      {/* 선반 앞 엣지 트림 (구리색 메탈) */}
      {shelfPanels.map(({ y, desc }) => (
        <mesh key={`trim-${desc}`} position={[0, y + panelThick / 2 + 0.001, d / 2 - 0.005]}>
          <boxGeometry args={[w, 0.007, 0.008]} />
          <meshStandardMaterial color="#B87333" metalness={0.92} roughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}
