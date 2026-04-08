import React from 'react';
import * as THREE from 'three';

type Props = {
  position?: [number, number, number];
  intensity?: number;
};

// 데스크 램프 — 크림 갓 + 브라스 스탠드
export function DeskLamp({ position = [2.5, 1.24, -2.70], intensity = 1.1 }: Props) {
  return (
    <group position={position}>
      {/* 베이스 — 브라스 */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.08, 12]} />
        <meshStandardMaterial color="#B8962E" metalness={0.82} roughness={0.18} />
      </mesh>

      {/* 폴 — 브라스 */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.5, 8]} />
        <meshStandardMaterial color="#C8A830" metalness={0.88} roughness={0.12} />
      </mesh>

      {/* 관절 볼 — 브라스 */}
      <mesh position={[0, 0.585, 0]}>
        <sphereGeometry args={[0.02, 10, 10]} />
        <meshStandardMaterial color="#D4B040" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* 갓 — 크림 화이트 (내부는 따뜻한 노란빛 반사) */}
      <group position={[0.04, 0.65, 0]}>
        {/* 갓 — Fix 2: emissive 제거 (갓은 스스로 빛 안 냄) */}
        <mesh>
          <sphereGeometry args={[0.095, 18, 18]} />
          <meshStandardMaterial
            color="#F5EDD8"
            roughness={0.65}
            metalness={0.0}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 전구 — 광원 메시이므로 emissive 유지, intensity 낮춤 */}
        <mesh>
          <sphereGeometry args={[0.058, 14, 14]} />
          <meshStandardMaterial
            color="#FFF0C0"
            emissive="#FFD060"
            emissiveIntensity={1.4}
            transparent
            opacity={0.92}
          />
        </mesh>

        {/* 광원 — Fix 3: intensity * 3.5 → * 1.8 */}
        <pointLight
          color="#F5C842"
          intensity={intensity * 1.8}
          decay={2}
          distance={4}
        />
      </group>
    </group>
  );
}
