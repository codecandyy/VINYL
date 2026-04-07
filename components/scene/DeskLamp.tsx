import React from 'react';
import * as THREE from 'three';

type Props = {
  position?: [number, number, number];
  intensity?: number;
};

export function DeskLamp({ position = [2.5, 1.24, -2.70], intensity = 1.1 }: Props) {
  return (
    <group position={position}>
      {/* 베이스 */}
      <mesh position={[0, 0.04, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.08, 12]} />
        <meshStandardMaterial color="#8B6914" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 폴 */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.007, 0.007, 0.5, 8]} />
        <meshStandardMaterial color="#B87333" metalness={0.88} roughness={0.12} />
      </mesh>

      {/* 관절 볼 */}
      <mesh position={[0, 0.585, 0]}>
        <sphereGeometry args={[0.02, 10, 10]} />
        <meshStandardMaterial color="#C89040" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* 볼 전구 갓 */}
      <group position={[0.04, 0.65, 0]}>
        <mesh>
          <sphereGeometry args={[0.095, 18, 18]} />
          <meshStandardMaterial
            color="#C87830"
            roughness={0.35}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* 전구 */}
        <mesh>
          <sphereGeometry args={[0.058, 14, 14]} />
          <meshStandardMaterial
            color="#FFE8A0"
            emissive="#FFC060"
            emissiveIntensity={2.5}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* 광원 (정적, 플리커 없음) */}
        <pointLight
          color="#F5C842"
          intensity={intensity * 3.2}
          decay={2}
          distance={4.5}
        />
      </group>
    </group>
  );
}
