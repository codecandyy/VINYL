import React from 'react';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

type Props = {
  isPlaying: boolean;
};

export function RoomLighting({ isPlaying }: Props) {
  const ampLightRef = useRef<THREE.PointLight>(null);
  const phaseRef = useRef(0);

  useFrame((_, delta) => {
    if (!ampLightRef.current) return;
    if (isPlaying) {
      phaseRef.current += delta * 2;
      // 재생 중 앰프 빛 펄스
      ampLightRef.current.intensity = 0.8 + Math.sin(phaseRef.current) * 0.3;
    } else {
      ampLightRef.current.intensity = 0.6;
    }
  });

  return (
    <>
      {/* 전체 앰비언트 — 매우 어둡게 */}
      <ambientLight intensity={0.15} color="#1A0A00" />

      {/* 천장 메인 포인트라이트 — 앰버 */}
      <pointLight position={[0, 3.5, 0]} intensity={2.5} color="#D4903A" decay={2} distance={10} />

      {/* 데스크 램프 */}
      <pointLight position={[-1.5, 1.5, 1]} intensity={1.2} color="#F4C060" decay={2} distance={5} />

      {/* 앰프 간접광 — 펄스 */}
      <pointLight ref={ampLightRef} position={[1, 1.5, 0]} intensity={0.6} color="#C87030" decay={2} distance={3} />

      {/* 앨범 월 선반 조명 */}
      <rectAreaLight
        position={[0, 2.8, -2.8]}
        rotation={[-Math.PI / 6, 0, 0]}
        width={6}
        height={0.3}
        intensity={1.5}
        color="#D4903A"
      />

      {/* 비네트용 — 사이드 어둠 */}
      <pointLight position={[-4, 0, 0]} intensity={0} />
      <pointLight position={[4, 0, 0]} intensity={0} />
    </>
  );
}
