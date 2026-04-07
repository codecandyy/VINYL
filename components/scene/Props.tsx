import React, { useMemo } from 'react';
import * as THREE from 'three';
import { createToonGradient } from '../../lib/textureUtils';

// 앰프/리시버
export function Amplifier({ position = [-1.6, 1.28, -2.72] as [number,number,number], isPlaying = false }) {
  const gradient = useMemo(() => createToonGradient(), []);

  return (
    <group position={position}>
      {/* 본체 */}
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.18, 0.28]} />
        <meshToonMaterial color="#0A0A0A" gradientMap={gradient} />
      </mesh>

      {/* 전면 패널 */}
      <mesh position={[0, 0, 0.142]}>
        <boxGeometry args={[0.5, 0.18, 0.004]} />
        <meshStandardMaterial color="#141414" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* VU 미터 */}
      <mesh position={[0, 0.02, 0.145]}>
        <planeGeometry args={[0.22, 0.07]} />
        <meshStandardMaterial
          color={isPlaying ? '#002200' : '#000'}
          emissive={isPlaying ? new THREE.Color('#00CC00') : new THREE.Color(0)}
          emissiveIntensity={isPlaying ? 0.6 : 0}
        />
      </mesh>

      {/* VU 바 (재생 중) */}
      {isPlaying && [0,1,2,3,4].map((i) => (
        <mesh key={i} position={[-0.08 + i * 0.04, 0.02, 0.146]}>
          <planeGeometry args={[0.025, 0.045 + Math.random() * 0.02]} />
          <meshStandardMaterial
            color="#00FF00"
            emissive={new THREE.Color('#00FF00')}
            emissiveIntensity={1.5}
          />
        </mesh>
      ))}

      {/* 노브들 */}
      {[-0.15, -0.07, 0.07, 0.15].map((x, i) => (
        <mesh key={i} position={[x, -0.035, 0.146]}>
          <cylinderGeometry args={[0.018, 0.018, 0.012, 16]} />
          <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* 파란 LED (레트로 전자기기) */}
      <mesh position={[0.2, 0.03, 0.146]}>
        <circleGeometry args={[0.008, 12]} />
        <meshStandardMaterial
          color="#0066FF"
          emissive={new THREE.Color('#0066FF')}
          emissiveIntensity={isPlaying ? 3 : 1}
        />
      </mesh>
      {/* 파란 LED 광원 */}
      <pointLight
        position={[0.2, 0.03, 0.2]}
        color="#0044FF"
        intensity={isPlaying ? 0.8 : 0.3}
        decay={3}
        distance={1.5}
      />
    </group>
  );
}

// 맥주병
export function BeerBottle({ position = [1.8, 1.28, -2.72] as [number,number,number] }) {
  return (
    <group position={position}>
      {/* 병 몸통 */}
      <mesh castShadow>
        <cylinderGeometry args={[0.025, 0.028, 0.22, 12]} />
        <meshStandardMaterial
          color="#2D5A00"
          transparent
          opacity={0.85}
          roughness={0.05}
          metalness={0.0}
        />
      </mesh>
      {/* 병목 */}
      <mesh position={[0, 0.155, 0]} castShadow>
        <cylinderGeometry args={[0.01, 0.024, 0.08, 10]} />
        <meshStandardMaterial color="#2D5A00" transparent opacity={0.85} roughness={0.05} />
      </mesh>
      {/* 병뚜껑 */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.01, 10]} />
        <meshStandardMaterial color="#B87333" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* 라벨 */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.045, 0.08]} />
        <meshStandardMaterial color="#F5C842" roughness={0.8} />
      </mesh>
    </group>
  );
}

// 스피커 (소형)
export function SmallSpeaker({ position = [1.4, 1.28, -2.72] as [number,number,number] }) {
  const gradient = useMemo(() => createToonGradient(), []);

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.12, 0.2, 0.14]} />
        <meshToonMaterial color="#111" gradientMap={gradient} />
      </mesh>
      {/* 스피커 그릴 */}
      <mesh position={[0, 0.02, 0.072]}>
        <circleGeometry args={[0.045, 24]} />
        <meshStandardMaterial color="#222" metalness={0.2} roughness={0.9} />
      </mesh>
      {/* 트위터 */}
      <mesh position={[0, 0.07, 0.072]}>
        <circleGeometry args={[0.018, 16]} />
        <meshStandardMaterial color="#333" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  );
}

// LP 스택 (카운터 위)
export function LPStack({ position = [0.8, 1.28, -2.7] as [number,number,number], count = 5 }) {
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[0, i * 0.007, 0]} rotation={[0, i * 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.155, 0.155, 0.005, 40]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.15} metalness={0.1} />
        </mesh>
      ))}
      {/* 가장 위 LP는 색깔 라벨 */}
      <mesh position={[0, count * 0.007 + 0.003, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.002, 40]} />
        <meshStandardMaterial color="#C87830" roughness={0.5} />
      </mesh>
    </group>
  );
}
