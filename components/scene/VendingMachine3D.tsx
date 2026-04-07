import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

type Props = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  isActive?: boolean;
  onPress: () => void;
};

export function VendingMachine3D({
  position = [-3.1, 0, -2.0],
  rotation = [0, 0.35, 0],
  isActive = false,
  onPress,
}: Props) {
  const screenRef = useRef<THREE.Mesh>(null);
  const btnRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    // 스크린 펄스
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.5 + Math.sin(t.current * 2.2) * 0.25;
    }
    // 버튼 펄스
    if (btnRef.current) {
      const mat = btnRef.current.material as THREE.MeshStandardMaterial;
      const pulse = 0.8 + Math.sin(t.current * 3.5) * 0.4;
      mat.emissiveIntensity = pulse;
    }
    // 포인트라이트 펄스
    if (glowRef.current) {
      glowRef.current.intensity = 0.6 + Math.sin(t.current * 2.0) * 0.25;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* ── 본체 (건메탈) ── */}
      <mesh castShadow receiveShadow onClick={onPress}>
        <boxGeometry args={[0.86, 1.56, 0.5]} />
        <meshStandardMaterial color="#1A1C2A" metalness={0.55} roughness={0.45} />
      </mesh>

      {/* ── 좌우 구리 엣지 스트립 ── */}
      {([-0.432, 0.432] as number[]).map((x, i) => (
        <mesh key={i} position={[x, 0, 0.005]}>
          <boxGeometry args={[0.01, 1.58, 0.51]} />
          <meshStandardMaterial color="#B87333" metalness={0.92} roughness={0.1} emissive="#C87030" emissiveIntensity={0.6} />
        </mesh>
      ))}

      {/* ── 상단 사인보드 ── */}
      <mesh position={[0, 0.84, 0.256]}>
        <boxGeometry args={[0.78, 0.15, 0.008]} />
        <meshStandardMaterial color="#B87333" metalness={0.4} roughness={0.3} emissive="#C05010" emissiveIntensity={0.7} />
      </mesh>
      {/* 사인보드 내부 텍스트 자리 (작은 어두운 박스) */}
      <mesh position={[0, 0.84, 0.262]}>
        <boxGeometry args={[0.64, 0.09, 0.002]} />
        <meshStandardMaterial color="#1A0800" emissive="#FF8030" emissiveIntensity={0.5} />
      </mesh>

      {/* ── 디스플레이 스크린 ── */}
      <mesh ref={screenRef} position={[0, 0.55, 0.256]}>
        <boxGeometry args={[0.66, 0.28, 0.006]} />
        <meshStandardMaterial
          color="#001A08"
          emissive="#00DD55"
          emissiveIntensity={0.6}
        />
      </mesh>
      {/* 스크린 베젤 */}
      <mesh position={[0, 0.55, 0.254]}>
        <boxGeometry args={[0.7, 0.32, 0.005]} />
        <meshStandardMaterial color="#111" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* ── 유리 패널 (LP 보관함) ── */}
      <mesh position={[0, 0.08, 0.258]}>
        <boxGeometry args={[0.66, 0.48, 0.005]} />
        <meshStandardMaterial
          color="#1A3A2A"
          transparent
          opacity={0.55}
          metalness={0.05}
          roughness={0.0}
        />
      </mesh>

      {/* ── 내부 LP 디스크들 (장식) ── */}
      {([0.18, 0.0, -0.18] as number[]).map((y, row) =>
        ([-0.2, -0.07, 0.07, 0.2] as number[]).map((x, col) => (
          <mesh key={`${row}-${col}`} position={[x, 0.08 + y, 0.22]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.058, 0.058, 0.004, 20]} />
            <meshStandardMaterial color="#1A1A1A" roughness={0.2} metalness={0.3} />
          </mesh>
        ))
      )}

      {/* ── 코인 투입구 ── */}
      <mesh position={[0.28, 0.1, 0.258]}>
        <boxGeometry args={[0.07, 0.018, 0.006]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* 코인 투입구 라벨 */}
      <mesh position={[0.28, 0.125, 0.258]}>
        <boxGeometry args={[0.07, 0.012, 0.003]} />
        <meshStandardMaterial color="#C89040" emissive="#C89040" emissiveIntensity={0.4} />
      </mesh>

      {/* ── 트레이 (배출구) ── */}
      <mesh position={[0, -0.65, 0.26]}>
        <boxGeometry args={[0.4, 0.06, 0.1]} />
        <meshStandardMaterial color="#0D0D0D" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.63, 0.31]}>
        <boxGeometry args={[0.38, 0.04, 0.005]} />
        <meshStandardMaterial color="#B87333" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ── VEND 버튼 (큰 빨간 버튼) ── */}
      <mesh
        ref={btnRef}
        position={[0.28, -0.28, 0.264]}
        onClick={(e) => { e.stopPropagation(); onPress(); }}
        onPointerOver={(e) => e.stopPropagation()}
      >
        <cylinderGeometry args={[0.052, 0.052, 0.022, 20]} />
        <meshStandardMaterial
          color="#DD2222"
          emissive="#FF1111"
          emissiveIntensity={0.9}
          metalness={0.2}
          roughness={0.3}
        />
      </mesh>
      {/* 버튼 테두리 */}
      <mesh position={[0.28, -0.28, 0.258]}>
        <cylinderGeometry args={[0.065, 0.065, 0.01, 20]} />
        <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* ── 우측 사이드 패널 장식 ── */}
      {([0.42, 0.25, 0.08, -0.09, -0.26, -0.43] as number[]).map((y, i) => (
        <mesh key={i} position={[0.434, y, 0]}>
          <boxGeometry args={[0.005, 0.08, 0.42]} />
          <meshStandardMaterial color="#2A2A3A" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}

      {/* ── 다리 (4개) ── */}
      {([[-0.28, -0.18], [-0.28, 0.18], [0.28, -0.18], [0.28, 0.18]] as [number, number][]).map(([x, z], i) => (
        <mesh key={i} position={[x, -0.82, z]} castShadow>
          <cylinderGeometry args={[0.022, 0.030, 0.1, 8]} />
          <meshStandardMaterial color="#111" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* ── 머신 글로우 라이트 ── */}
      <pointLight
        ref={glowRef}
        position={[0, 0.5, 0.7]}
        color="#00FF55"
        intensity={0.7}
        decay={3}
        distance={2.5}
      />
      <pointLight
        position={[0, 0.84, 0.6]}
        color="#FF8030"
        intensity={0.5}
        decay={3}
        distance={1.5}
      />
    </group>
  );
}
