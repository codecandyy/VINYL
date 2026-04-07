import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Props = {
  isPlaying: boolean;
};

export function ToneArm({ isPlaying }: Props) {
  const pivotRef = useRef<THREE.Group>(null);
  const currentAngle = useRef(0.5); // 들려있는 상태 (라디안)
  const targetAngle = isPlaying ? 0 : 0.5;

  useFrame((_, delta) => {
    if (!pivotRef.current) return;
    const target = isPlaying ? 0 : 0.5;
    currentAngle.current += (target - currentAngle.current) * delta * 2;
    pivotRef.current.rotation.z = -currentAngle.current;
  });

  return (
    <group ref={pivotRef} position={[0.28, 0.06, 0]}>
      {/* 피벗 포인트 */}
      <mesh>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshStandardMaterial color="#B87333" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 암 바디 */}
      <mesh position={[-0.12, 0, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.005, 0.004, 0.28, 8]} />
        <meshStandardMaterial color="#B87333" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* 헤드셸 */}
      <mesh position={[-0.25, -0.01, 0]}>
        <boxGeometry args={[0.04, 0.008, 0.02]} />
        <meshStandardMaterial color="#8B6914" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 스타일러스(바늘) */}
      <mesh position={[-0.26, -0.02, 0]}>
        <coneGeometry args={[0.002, 0.015, 6]} />
        <meshStandardMaterial color="#C0C0C0" metalness={1} roughness={0.05} />
      </mesh>
    </group>
  );
}
