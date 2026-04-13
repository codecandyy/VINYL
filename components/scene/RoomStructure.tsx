import React from 'react';
import { useRoomStore } from '../../stores/roomStore';
import { THEMES } from '../../lib/themes';

/**
 * RoomStructure — 테마에 따라 벽/바닥/천장 색상이 바뀌는 방 구조
 */
export function RoomStructure() {
  const roomTheme = useRoomStore((s) => s.roomTheme);
  const t = THEMES[roomTheme];

  return (
    <group>
      {/* ── 바닥 ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.55]}>
        <planeGeometry args={[22, 15]} />
        <meshStandardMaterial color={t.floor} roughness={1} metalness={0} />
      </mesh>

      {/* ── 뒷벽 ── */}
      <mesh position={[0, 4.5, -3.6]}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color={t.backWall} roughness={0.96} metalness={0} />
      </mesh>

      {/* ── 좌벽 ── */}
      <mesh position={[-5.5, 4.5, -1.0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color={t.sideWall} roughness={0.95} metalness={0} />
      </mesh>

      {/* ── 우벽 ── */}
      <mesh position={[5.5, 4.5, -1.0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color={t.sideWall} roughness={0.95} metalness={0} />
      </mesh>

      {/* ── 천장 ── */}
      <mesh position={[0, 8.65, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color={t.ceiling} roughness={1} metalness={0} />
      </mesh>

      {/* ── 천장 행잉 전구 ── */}
      <mesh position={[0, 8.28, -1.5]}>
        <sphereGeometry args={[0.048, 12, 12]} />
        <meshStandardMaterial
          color={t.bulbColor}
          emissive={t.bulbEmissive}
          emissiveIntensity={1.65}
        />
      </mesh>
      <mesh position={[0, 8.46, -1.5]}>
        <cylinderGeometry args={[0.003, 0.003, 0.48, 6]} />
        <meshStandardMaterial color="#1A1A1A" />
      </mesh>

      {/* ── 카운터 본체 ── */}
      <mesh position={[0, 0.5, -1.3]}>
        <boxGeometry args={[4.5, 1.0, 1.1]} />
        <meshStandardMaterial color={t.counterBody} roughness={0.88} metalness={0.02} />
      </mesh>

      {/* ── 카운터 상판 ── */}
      <mesh position={[0, 1.01, -1.3]}>
        <boxGeometry args={[4.5, 0.022, 1.1]} />
        <meshStandardMaterial color={t.counterTop} roughness={0.72} metalness={0.05} />
      </mesh>

      {/* ── 카운터 앞 엣지 — 틴 브라스 ── */}
      <mesh position={[0, 1.022, -0.76]}>
        <boxGeometry args={[4.5, 0.007, 0.007]} />
        <meshStandardMaterial color="#7A6228" metalness={0.78} roughness={0.28} />
      </mesh>
    </group>
  );
}
