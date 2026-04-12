import React from 'react';

/**
 * RoomStructure — 70s 재즈 라운지 / 빈티지 LP방
 * 담배연·티크 톤 뒷벽, 웜 차콜 사이드, 적갈 카펫
 */
export function RoomStructure() {
  return (
    <group>
      {/* ── 바닥 — 웜 버건디·브라운 카펫 (카메라 쪽·좌우로 넓혀 시야 하단 배경 누출 감소) ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.55]}>
        <planeGeometry args={[22, 15]} />
        <meshStandardMaterial color="#523028" roughness={1} metalness={0} />
      </mesh>

      {/* ── 뒷벽 — 올리브·티크 (하단 -0.5 정렬 유지, 상단만 더 올려 책장 위 여유↑) ── */}
      <mesh position={[0, 4.5, -3.6]}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#322A1C" roughness={0.96} metalness={0} />
      </mesh>

      {/* ── 좌벽 — 웜 차콜 ── */}
      <mesh position={[-5.5, 4.5, -1.0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#221A14" roughness={0.95} metalness={0} />
      </mesh>

      {/* ── 우벽 — 웜 차콜 ── */}
      <mesh position={[5.5, 4.5, -1.0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#221A14" roughness={0.95} metalness={0} />
      </mesh>

      {/* ── 천장 — 책장 메시는 그대로 두고 방 박스만 더 높게 ── */}
      <mesh position={[0, 8.65, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#120C0A" roughness={1} metalness={0} />
      </mesh>

      {/* ── 천장 행잉 전구 — 백열 스타일 ── */}
      <mesh position={[0, 8.28, -1.5]}>
        <sphereGeometry args={[0.048, 12, 12]} />
        <meshStandardMaterial
          color="#FFE8C8"
          emissive="#FFB040"
          emissiveIntensity={1.65}
        />
      </mesh>
      <mesh position={[0, 8.46, -1.5]}>
        <cylinderGeometry args={[0.003, 0.003, 0.48, 6]} />
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

    </group>
  );
}
