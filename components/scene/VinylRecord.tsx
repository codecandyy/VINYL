import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AlbumData } from '../../lib/albumTexture';

/** 앨범 아트 + LP 라벨 링을 합성한 CanvasTexture 생성 */
function buildLabelTexture(
  imgUrl: string,
  labelColor: string,
  onDone: (tex: THREE.CanvasTexture) => void
): () => void {
  if (typeof document === 'undefined') return () => {};
  const SIZE = 512;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  const draw = (img?: HTMLImageElement) => {
    ctx.clearRect(0, 0, SIZE, SIZE);

    // 원형 클립
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, cx, 0, Math.PI * 2);
    ctx.clip();

    if (img) {
      // 앨범 이미지 (정사각 → 원형)
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, SIZE, SIZE);
    } else {
      ctx.fillStyle = labelColor;
      ctx.fillRect(0, 0, SIZE, SIZE);
    }

    // 비닐 중앙 어두운 링 오버레이 (내부 라벨 경계감)
    const grd = ctx.createRadialGradient(cx, cy, cx * 0.55, cx, cy, cx * 0.72);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, cx, 0, Math.PI * 2);
    ctx.fill();

    // 중심 스핀들 홀
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cx, cy, SIZE * 0.018, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    onDone(tex);
  };

  if (!imgUrl) {
    draw();
    return () => {};
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => draw(img);
  img.onerror = () => draw(); // 이미지 로드 실패 → 단색
  img.src = imgUrl;

  return () => { img.onload = null; img.onerror = null; };
}

function makeGrooveSegmentsTexture(segmentCount: number): THREE.CanvasTexture | null {
  if (typeof document === 'undefined' || segmentCount < 2) return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = 'rgba(232,220,200,0.35)';
  ctx.lineWidth = 2;
  const cx = 256;
  const cy = 256;
  const n = segmentCount;
  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const a1 = -Math.PI / 2 + ((i + 1) / n) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 210, a0, a1);
    ctx.stroke();
    if (n <= 12) {
      const mid = (a0 + a1) / 2;
      const tx = cx + Math.cos(mid) * 168;
      const ty = cy + Math.sin(mid) * 168;
      ctx.fillStyle = '#E8DCC8';
      const fs = n <= 6 ? 44 : 34;
      ctx.font = `bold ${fs}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), tx, ty);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

type Props = {
  album: AlbumData | null;
  isPlaying: boolean;
  scale?: number;
  /** 미리듣기 2곡 이상일 때 홈 링 표시 */
  grooveMode?: boolean;
  /** 홈 구역 개수(수록곡 수, 최대 36) */
  grooveSegmentCount?: number;
  /** 덱 프리뷰 placeholder — 비닐 가장자리가 어두운 배경에서도 보이게 */
  placeholderDisc?: boolean;
};

export function VinylRecord({
  album,
  isPlaying,
  scale = 1,
  grooveMode = false,
  grooveSegmentCount = 5,
  placeholderDisc = false,
}: Props) {
  const groupRef    = useRef<THREE.Group>(null);
  const speedRef    = useRef(0);
  const rotRef      = useRef(0);
  const labelMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const labelTexRef = useRef<THREE.CanvasTexture | null>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const target = isPlaying ? 3.46 : 0; // 33 RPM = 3.46 rad/s
    speedRef.current += (target - speedRef.current) * 0.06;
    if (Math.abs(speedRef.current) < 0.001) return;
    rotRef.current += speedRef.current * delta;
    groupRef.current.rotation.y = rotRef.current;
  });

  const seg =
    grooveSegmentCount && grooveSegmentCount > 0 ? grooveSegmentCount : 5;
  const nSeg = grooveMode ? Math.max(2, Math.min(seg, 36)) : 0;
  const grooveTex = useMemo(
    () => (nSeg >= 2 ? makeGrooveSegmentsTexture(nSeg) : null),
    [nSeg]
  );
  useEffect(() => {
    return () => { grooveTex?.dispose(); };
  }, [grooveTex]);

  // 앨범 커버 → 라벨 텍스처 로드
  const coverUrl   = album?.coverUrl ?? '';
  const labelColor = album?.labelColor ?? album?.accent ?? '#C87830';
  useEffect(() => {
    const cancel = buildLabelTexture(coverUrl, labelColor, (tex) => {
      labelTexRef.current?.dispose();
      labelTexRef.current = tex;
      if (labelMatRef.current) {
        labelMatRef.current.map   = tex;
        labelMatRef.current.color.set('#ffffff');
        labelMatRef.current.needsUpdate = true;
      }
    });
    return () => {
      cancel();
      labelTexRef.current?.dispose();
      labelTexRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverUrl, labelColor]);

  return (
    <group ref={groupRef} scale={scale}>
      <mesh>
        <cylinderGeometry args={[0.235, 0.235, 0.006, 32]} />
        <meshStandardMaterial
          color={placeholderDisc ? '#151820' : '#0F0F0F'}
          roughness={0.25}
          metalness={0.6}
          emissive={placeholderDisc ? '#2a3038' : '#000000'}
          emissiveIntensity={placeholderDisc ? 0.14 : 0}
        />
      </mesh>

      {grooveTex && (
        <mesh rotation={[0, 0, 0]} position={[0, 0.0032, 0]}>
          <cylinderGeometry args={[0.228, 0.228, 0.001, 64]} />
          <meshStandardMaterial
            map={grooveTex}
            roughness={0.85}
            metalness={0.05}
            transparent
            opacity={0.92}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 토러스 기본은 XY평면 → XZ(플래터와 평행)로 눕힘. radialSegments 3은 삼각 단면이라 아치처럼 보였음 */}
      <mesh position={[0, 0.004, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.055, 16, 48]} />
        <meshStandardMaterial color="#1C1C1C" roughness={0.08} metalness={0.95} />
      </mesh>

      {/* 앨범 아트 라벨 — 커버 이미지 or 단색 */}
      <mesh position={[0, 0.0045, 0]}>
        <cylinderGeometry args={[0.115, 0.115, 0.008, 48]} />
        <meshStandardMaterial
          ref={labelMatRef}
          color={labelColor}
          roughness={0.55}
          metalness={0.05}
        />
      </mesh>

      {/* 스핀들 홀 (텍스처 위에 덧씌움) */}
      <mesh position={[0, 0.011, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.004, 16]} />
        <meshStandardMaterial color="#111" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}
