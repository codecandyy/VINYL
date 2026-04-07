import React from 'react';

export function RoomStructure() {
  return (
    <group>
      {/* ── 바닥 — 레드 카펫 ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#7A1A1A" roughness={0.95} />
      </mesh>

      {/* ── 뒷벽 ── */}
      <mesh position={[0, 2.5, -3.6]} receiveShadow>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#2A1005" roughness={0.9} />
      </mesh>

      {/* ── 좌벽 ── */}
      <mesh position={[-4.8, 2.5, -1.0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[9, 6]} />
        <meshStandardMaterial color="#241005" roughness={0.9} />
      </mesh>

      {/* ── 우벽 ── */}
      <mesh position={[4.8, 2.5, -1.0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[9, 6]} />
        <meshStandardMaterial color="#241005" roughness={0.9} />
      </mesh>

      {/* ── 천장 ── */}
      <mesh position={[0, 5.2, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 9]} />
        <meshStandardMaterial color="#1A0A03" roughness={1} />
      </mesh>

      {/* ── 천장 메인 전구 (행잉) ── */}
      <mesh position={[0, 4.9, -1.5]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial
          color="#FFF5D0"
          emissive="#FFD080"
          emissiveIntensity={3}
        />
      </mesh>
      <mesh position={[0, 5.0, -1.5]}>
        <cylinderGeometry args={[0.005, 0.005, 0.25, 8]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* ── 카운터 앞 바닥 보드 ── */}
      <mesh position={[0, 0.01, 1.5]} receiveShadow>
        <boxGeometry args={[10, 0.03, 4]} />
        <meshStandardMaterial color="#0E0400" roughness={0.95} />
      </mesh>
    </group>
  );
}
