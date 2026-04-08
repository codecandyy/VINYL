import React from 'react';

/**
 * RoomStructure — 70s 재즈 라운지 / 빈티지 LP방
 * 담배연·티크 톤 뒷벽, 웜 차콜 사이드, 적갈 카펫
 */
export function RoomStructure() {
  return (
    <group>
      {/* ── 바닥 — 웜 버건디·브라운 카펫 ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#523028" roughness={1} metalness={0} />
      </mesh>

      {/* ── 뒷벽 — 올리브·티크 (차갑지 않게) ── */}
      <mesh position={[0, 2.5, -3.6]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#322A1C" roughness={0.96} metalness={0} />
      </mesh>

      {/* ── 좌벽 — 웜 차콜 ── */}
      <mesh position={[-4.8, 2.5, -1.0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[9, 6]} />
        <meshStandardMaterial color="#221A14" roughness={0.95} metalness={0} />
      </mesh>

      {/* ── 우벽 — 웜 차콜 ── */}
      <mesh position={[4.8, 2.5, -1.0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[9, 6]} />
        <meshStandardMaterial color="#221A14" roughness={0.95} metalness={0} />
      </mesh>

      {/* ── 천장 — 흡연실 톤 다크 브라운 ── */}
      <mesh position={[0, 5.2, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 9]} />
        <meshStandardMaterial color="#120C0A" roughness={1} metalness={0} />
      </mesh>

      {/* ── 천장 행잉 전구 — 백열 스타일 ── */}
      <mesh position={[0, 4.88, -1.5]}>
        <sphereGeometry args={[0.048, 12, 12]} />
        <meshStandardMaterial
          color="#FFE8C8"
          emissive="#FFB040"
          emissiveIntensity={1.65}
        />
      </mesh>
      <mesh position={[0, 5.06, -1.5]}>
        <cylinderGeometry args={[0.003, 0.003, 0.36, 6]} />
        <meshStandardMaterial color="#1A1A1A" />
      </mesh>

      {/* ── 카운터 본체 — 에이지드 월넛 ── */}
      <mesh position={[0, 0.5, -1.3]}>
        <boxGeometry args={[4.5, 1.0, 1.1]} />
        <meshStandardMaterial color="#2C1E12" roughness={0.88} metalness={0.02} />
      </mesh>

      {/* ── 카운터 상판 — 오래된 레더렛 블랙 ── */}
      <mesh position={[0, 1.01, -1.3]}>
        <boxGeometry args={[4.5, 0.022, 1.1]} />
        <meshStandardMaterial color="#241E18" roughness={0.72} metalness={0.05} />
      </mesh>

      {/* ── 카운터 앞 엣지 — 틴 브라스 ── */}
      <mesh position={[0, 1.022, -0.76]}>
        <boxGeometry args={[4.5, 0.007, 0.007]} />
        <meshStandardMaterial color="#7A6228" metalness={0.78} roughness={0.28} />
      </mesh>

      {/* ── 카운터 앞 몰딩 — 에보니 ── */}
      <mesh position={[0, 0.01, 1.5]}>
        <boxGeometry args={[10, 0.03, 4]} />
        <meshStandardMaterial color="#0A0705" roughness={0.98} />
      </mesh>
    </group>
  );
}
