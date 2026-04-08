import React, { useMemo } from 'react';
import * as THREE from 'three';
import { createToonGradient } from '../../lib/textureUtils';

// 앰프/리시버 — 매트 블랙 + 크롬 실버
export function Amplifier({ position = [-1.6, 1.28, -2.72] as [number,number,number], isPlaying = false }) {
  const gradient = useMemo(() => createToonGradient(), []);

  return (
    <group position={position}>
      {/* 본체 — 매트 블랙 */}
      <mesh>
        <boxGeometry args={[0.5, 0.18, 0.28]} />
        <meshToonMaterial color="#0D0D0D" gradientMap={gradient} />
      </mesh>

      {/* 전면 패널 */}
      <mesh position={[0, 0, 0.142]}>
        <boxGeometry args={[0.5, 0.18, 0.004]} />
        <meshStandardMaterial color="#111111" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* VU 미터 */}
      <mesh position={[0, 0.02, 0.145]}>
        <planeGeometry args={[0.22, 0.07]} />
        <meshStandardMaterial
          color={isPlaying ? '#002200' : '#000'}
          emissive={isPlaying ? new THREE.Color('#00CC00') : new THREE.Color(0)}
          emissiveIntensity={isPlaying ? 0.25 : 0}
        />
      </mesh>

      {/* VU 바 */}
      {isPlaying && [0,1,2,3,4].map((i) => (
        <mesh key={i} position={[-0.08 + i * 0.04, 0.02, 0.146]}>
          <planeGeometry args={[0.025, 0.045 + Math.random() * 0.02]} />
          <meshStandardMaterial
            color="#00FF00"
            emissive={new THREE.Color('#00FF00')}
            emissiveIntensity={0.6}
          />
        </mesh>
      ))}

      {/* 노브들 — 크롬 실버 */}
      {[-0.15, -0.07, 0.07, 0.15].map((x, i) => (
        <mesh key={i} position={[x, -0.035, 0.146]}>
          <cylinderGeometry args={[0.018, 0.018, 0.012, 16]} />
          <meshStandardMaterial color="#C0C0C8" metalness={0.85} roughness={0.15} />
        </mesh>
      ))}

      {/* 파란 LED */}
      <mesh position={[0.2, 0.03, 0.146]}>
        <circleGeometry args={[0.008, 12]} />
        <meshStandardMaterial
          color="#0066FF"
          emissive={new THREE.Color('#0066FF')}
          emissiveIntensity={isPlaying ? 1.5 : 0.5}
        />
      </mesh>
    </group>
  );
}

// 맥주병 — 에메랄드 그린 유리
export function BeerBottle({ position = [1.8, 1.28, -2.72] as [number,number,number] }) {
  return (
    <group position={position}>
      {/* 병 몸통 — 에메랄드 그린 */}
      <mesh>
        <cylinderGeometry args={[0.025, 0.028, 0.22, 12]} />
        <meshStandardMaterial
          color="#0D4A1A"
          transparent
          opacity={0.88}
          roughness={0.04}
          metalness={0.0}
        />
      </mesh>
      {/* 병목 */}
      <mesh position={[0, 0.155, 0]}>
        <cylinderGeometry args={[0.01, 0.024, 0.08, 10]} />
        <meshStandardMaterial color="#0D4A1A" transparent opacity={0.88} roughness={0.04} />
      </mesh>
      {/* 병뚜껑 — 크롬 */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.01, 10]} />
        <meshStandardMaterial color="#C0C0C8" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* 라벨 — 크림 화이트 */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.045, 0.08]} />
        <meshStandardMaterial color="#F5EDD8" roughness={0.85} />
      </mesh>
    </group>
  );
}

// 스피커 (소형) — 매트 블랙
export function SmallSpeaker({ position = [1.4, 1.28, -2.72] as [number,number,number] }) {
  const gradient = useMemo(() => createToonGradient(), []);

  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.12, 0.2, 0.14]} />
        <meshToonMaterial color="#0D0D0D" gradientMap={gradient} />
      </mesh>
      {/* 스피커 그릴 */}
      <mesh position={[0, 0.02, 0.072]}>
        <circleGeometry args={[0.045, 24]} />
        <meshStandardMaterial color="#1A1A1A" metalness={0.15} roughness={0.92} />
      </mesh>
      {/* 트위터 */}
      <mesh position={[0, 0.07, 0.072]}>
        <circleGeometry args={[0.018, 16]} />
        <meshStandardMaterial color="#C0C0C8" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// LP 스택 — 매트 블랙 + 레드 라벨
export function LPStack({ position = [0.8, 1.28, -2.7] as [number,number,number], count = 5 }) {
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[0, i * 0.007, 0]} rotation={[0, i * 0.15, 0]}>
          <cylinderGeometry args={[0.155, 0.155, 0.005, 40]} />
          <meshStandardMaterial color="#111111" roughness={0.18} metalness={0.08} />
        </mesh>
      ))}
      {/* 가장 위 라벨 — 레드 포인트 */}
      <mesh position={[0, count * 0.007 + 0.003, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.002, 40]} />
        <meshStandardMaterial color="#CC2020" roughness={0.55} />
      </mesh>
    </group>
  );
}
