import React, { useEffect, useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

import { SHELF_CONFIG } from './ShelfUnit';

/** VinylShopScene `SHELF_POSITION[1]` — 뒷벽 포스터 높이 계산용 */
const SHELF_FOOT_Y = 0.44;
/** 뒷벽(-3.6)보다 앞·책장 뒤면보다 살짝 앞 — 정면에서 잘 보이게 */
const BACK_WALL_Z = -3.46;
const SHELF_TOP_Y = SHELF_FOOT_Y + SHELF_CONFIG.h;
const HALF_SHELF_W = SHELF_CONFIG.w / 2;
const POSTER_W = 0.7;

/**
 * 가운데 벽 포스터 X — ‹ › 페이저(대략 ±(halfW+0.36)) 바깥으로 빼서 클릭 가리지 않음
 */
function backWallFlankX(scale: number, side: -1 | 1): number {
  const halfP = (POSTER_W * scale) / 2;
  const margin = 0.62;
  return side * (HALF_SHELF_W + margin + halfP);
}

const W = 0.7;
const H = 1.0;

/** 스크린프린트 느낌의 거친 종이 텍스처 (웹). 네이티브는 단색 폴백. */
function grainPaperTexture(hex: string): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const cw = 220;
  const ch = Math.round((cw * H) / W);
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, cw, ch);
  for (let i = 0; i < 7000; i++) {
    const x = Math.random() * cw;
    const y = Math.random() * ch;
    const a = Math.random() * 0.11;
    ctx.fillStyle = Math.random() > 0.45 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a * 0.75})`;
    ctx.fillRect(x, y, 1.2, 1.2);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function PosterPaper({ color }: { color: string }) {
  const tex = useMemo(() => grainPaperTexture(color), [color]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return (
    <mesh>
      <planeGeometry args={[W, H]} />
      <meshStandardMaterial
        map={tex ?? undefined}
        color={tex ? '#ffffff' : color}
        roughness={0.94}
        metalness={0.02}
        emissive={color}
        emissiveIntensity={tex ? 0.03 : 0.08}
      />
    </mesh>
  );
}

function FrameBacking() {
  return (
    <mesh position={[0, 0, -0.012]}>
      <planeGeometry args={[W * 1.08, H * 1.08]} />
      <meshStandardMaterial color="#0D0806" roughness={1} metalness={0} />
    </mesh>
  );
}

/** 좌벽: 페리아 스타일 — 오렌지·크림·블랙 */
function PosterLeftFeria() {
  return (
    <group>
      <FrameBacking />
      <PosterPaper color="#D94A2C" />
      <group position={[0, 0, 0.018]}>
        <mesh position={[0, 0.28, 0]}>
          <planeGeometry args={[W * 0.88, 0.14]} />
          <meshStandardMaterial color="#F5E8D8" roughness={0.9} metalness={0} />
        </mesh>
        <Text
          position={[0, 0.28, 0.002]}
          fontSize={0.072}
          fontWeight={900}
          color="#1A120C"
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.02}
        >
          LA VINYL
        </Text>
        <Text
          position={[0, 0.12, 0]}
          fontSize={0.028}
          fontWeight={700}
          color="#F5E8D8"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.35}
        >
          F E R I A
        </Text>
        <mesh position={[-0.12, -0.08, 0]}>
          <ringGeometry args={[0.11, 0.34, 40]} />
          <meshStandardMaterial color="#F5E8D8" roughness={0.88} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-0.12, -0.08, 0.002]}>
          <circleGeometry args={[0.1, 32]} />
          <meshStandardMaterial color="#D94A2C" emissive="#D94A2C" emissiveIntensity={0.2} roughness={0.85} />
        </mesh>
        <mesh position={[0.22, -0.06, 0]}>
          <planeGeometry args={[0.34, 0.1]} />
          <meshStandardMaterial color="#0A0604" roughness={0.95} />
        </mesh>
        <Text
          position={[0.22, -0.06, 0.002]}
          fontSize={0.032}
          fontWeight={800}
          color="#F5E8D8"
          anchorX="center"
          anchorY="middle"
        >
          DISCOS
        </Text>
        <Text
          position={[0, -0.38, 0]}
          fontSize={0.022}
          fontWeight={600}
          color="#F5E8D8"
          anchorX="center"
          anchorY="middle"
          maxWidth={W * 0.9}
        >
          COMPRA · VENTA · CANJE
        </Text>
      </group>
    </group>
  );
}

/** 좌벽: 리소그램 스타일 — 크림 + 로얄 블루 */
function PosterLeftBlue() {
  return (
    <group>
      <FrameBacking />
      <PosterPaper color="#EDE6D8" />
      <group position={[0, 0, 0.018]}>
        <Text
          position={[-0.18, 0.32, 0]}
          fontSize={0.055}
          fontWeight={900}
          color="#2B4FA8"
          anchorX="left"
          anchorY="top"
          maxWidth={0.5}
        >
          {'MORNING\nGROOVE'}
        </Text>
        <Text
          position={[-0.22, -0.05, 0]}
          fontSize={0.024}
          fontWeight={600}
          color="#2B4FA8"
          anchorX="left"
          anchorY="middle"
          letterSpacing={0.06}
        >
          WKND 12:00
        </Text>
        <mesh position={[0.2, 0.08, 0]}>
          <circleGeometry args={[0.22, 36]} />
          <meshStandardMaterial color="#2B4FA8" roughness={0.9} />
        </mesh>
        <mesh position={[0.2, 0.08, 0.002]}>
          <circleGeometry args={[0.08, 24]} />
          <meshStandardMaterial color="#EDE6D8" roughness={0.9} />
        </mesh>
        <mesh position={[0.18, -0.22, 0]} rotation={[0, 0, 0.35]}>
          <planeGeometry args={[0.42, 0.2]} />
          <meshStandardMaterial color="#2B4FA8" roughness={0.88} />
        </mesh>
        <Text
          position={[0.18, -0.22, 0.002]}
          rotation={[0, 0, 0.35]}
          fontSize={0.05}
          fontWeight={800}
          color="#EDE6D8"
          anchorX="center"
          anchorY="middle"
        >
          DJ
        </Text>
      </group>
    </group>
  );
}

/** 우벽: 블랙 + 시그널 레드 */
function PosterRightCassette() {
  return (
    <group>
      <FrameBacking />
      <PosterPaper color="#12100E" />
      <group position={[0, 0, 0.018]}>
        <Text
          position={[0, 0.38, 0]}
          fontSize={0.022}
          fontWeight={600}
          color="#E63946"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.12}
        >
          SIDE A / 45 RPM
        </Text>
        <Text
          position={[0, 0.18, 0]}
          fontSize={0.09}
          fontWeight={900}
          color="#E63946"
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.03}
        >
          REWIND
        </Text>
        <group position={[0, -0.12, 0]} rotation={[0, 0, -0.12]}>
          <mesh>
            <planeGeometry args={[0.52, 0.34]} />
            <meshStandardMaterial color="#E63946" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <planeGeometry args={[0.44, 0.22]} />
            <meshStandardMaterial color="#1A1512" roughness={0.9} />
          </mesh>
          <mesh position={[-0.14, 0, 0.003]}>
            <circleGeometry args={[0.065, 20]} />
            <meshStandardMaterial color="#2A2520" roughness={0.95} />
          </mesh>
          <mesh position={[0.14, 0, 0.003]}>
            <circleGeometry args={[0.065, 20]} />
            <meshStandardMaterial color="#2A2520" roughness={0.95} />
          </mesh>
        </group>
        <Text
          position={[0, -0.4, 0]}
          fontSize={0.026}
          fontWeight={700}
          color="#F5E6D3"
          anchorX="center"
          anchorY="middle"
        >
          MIXTAPE MEMORIES
        </Text>
      </group>
    </group>
  );
}

/** 좌벽 소형 — 포레스트 + 크림 */
function PosterLeftSticker() {
  return (
    <group>
      <FrameBacking />
      <PosterPaper color="#1A5C4A" />
      <group position={[0, 0, 0.018]}>
        <Text
          position={[0, 0.08, 0]}
          fontSize={0.1}
          fontWeight={900}
          color="#E8F0EA"
          anchorX="center"
          anchorY="middle"
        >
          PLAY
        </Text>
        <Text
          position={[0, -0.12, 0]}
          fontSize={0.056}
          fontWeight={700}
          color="#B8D4C4"
          anchorX="center"
          anchorY="middle"
        >
          LOUD
        </Text>
      </group>
    </group>
  );
}

/** 좌벽 소형 — 코발트 스티커 */
function PosterLeftMiniBlue() {
  return (
    <group>
      <FrameBacking />
      <PosterPaper color="#EAE4D8" />
      <group position={[0, 0, 0.018]}>
        <mesh position={[0, 0.06, 0]}>
          <circleGeometry args={[0.18, 28]} />
          <meshStandardMaterial color="#2B4FA8" roughness={0.88} />
        </mesh>
        <Text
          position={[0, -0.22, 0]}
          fontSize={0.038}
          fontWeight={800}
          color="#2B4FA8"
          anchorX="center"
          anchorY="middle"
        >
          33⅓
        </Text>
      </group>
    </group>
  );
}

/** 우벽 소형 — 라이브 핑크 */
function PosterRightLive() {
  return (
    <group>
      <FrameBacking />
      <PosterPaper color="#E91E8C" />
      <group position={[0, 0, 0.018]}>
        <Text
          position={[0, 0.1, 0]}
          fontSize={0.072}
          fontWeight={900}
          color="#FFF5FA"
          anchorX="center"
          anchorY="middle"
        >
          LIVE
        </Text>
        <Text
          position={[0, -0.18, 0]}
          fontSize={0.026}
          fontWeight={600}
          color="#FFE0F0"
          anchorX="center"
          anchorY="middle"
        >
          FRONT ROW
        </Text>
      </group>
    </group>
  );
}

/** 우벽 소형 — 크림 + 블랙 타이포 */
function PosterRightMono() {
  return (
    <group>
      <FrameBacking />
      <PosterPaper color="#F2EBE0" />
      <group position={[0, 0, 0.018]}>
        <Text
          position={[0, 0.05, 0]}
          fontSize={0.05}
          fontWeight={900}
          color="#141210"
          anchorX="center"
          anchorY="middle"
        >
          MONO
        </Text>
        <mesh position={[0, -0.14, 0]}>
          <planeGeometry args={[0.5, 0.04]} />
          <meshStandardMaterial color="#141210" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

/** 뒷벽(책장 옆 플랭크): 토마토 레드 + 크림 — 디스코 페스타 느낌 */
function PosterBackDiscoFever() {
  return (
    <group>
      <FrameBacking />
      <PosterPaper color="#D62828" />
      <group position={[0, 0, 0.018]}>
        <Text
          position={[0, 0.34, 0]}
          fontSize={0.038}
          fontWeight={700}
          color="#F5E6D0"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          SAT NIGHT · 1979
        </Text>
        <Text
          position={[0, -0.02, 0]}
          fontSize={0.062}
          fontWeight={900}
          color="#F5E6D0"
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.02}
          maxWidth={W * 0.92}
        >
          {'DISCO\nFEVER'}
        </Text>
        <mesh position={[-0.2, 0.12, 0]}>
          <circleGeometry args={[0.09, 24]} />
          <meshStandardMaterial color="#1A1512" roughness={0.9} />
        </mesh>
        <mesh position={[0.2, 0.12, 0]}>
          <circleGeometry args={[0.09, 24]} />
          <meshStandardMaterial color="#1A1512" roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.32, 0]}>
          <planeGeometry args={[0.72, 0.1]} />
          <meshStandardMaterial color="#0D0B09" roughness={0.92} />
        </mesh>
        <Text
          position={[0, -0.32, 0.002]}
          fontSize={0.026}
          fontWeight={700}
          color="#F5E6D0"
          anchorX="center"
          anchorY="middle"
        >
          CHIC · EWF · ABBA
        </Text>
      </group>
    </group>
  );
}

/** 뒷벽: 크림 + 시그널 레드 — 체크 타이포 */
function PosterBackCheck() {
  return (
    <group>
      <FrameBacking />
      <PosterPaper color="#EDE4D4" />
      <group position={[0, 0, 0.018]}>
        <Text
          position={[0, 0.12, 0]}
          fontSize={0.022}
          fontWeight={600}
          color="#C41E1E"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.04}
        >
          TITLE — CHECK · POSTER — EVERYDAY
        </Text>
        <Text
          position={[0, -0.14, 0]}
          fontSize={0.14}
          fontWeight={900}
          color="#C41E1E"
          anchorX="center"
          anchorY="middle"
          letterSpacing={-0.04}
        >
          CHECK!
        </Text>
        <mesh position={[0, -0.38, 0]}>
          <planeGeometry args={[0.42, 0.06]} />
          <meshStandardMaterial color="#C41E1E" roughness={0.88} />
        </mesh>
        <Text
          position={[0, -0.38, 0.002]}
          fontSize={0.028}
          fontWeight={800}
          color="#EDE4D4"
          anchorX="center"
          anchorY="middle"
        >
          270 / 365
        </Text>
      </group>
    </group>
  );
}

/** 뒷벽: 그레이지 + 레드 — 라디오/스로우백 */
function PosterBackThrowbackRadio() {
  return (
    <group>
      <FrameBacking />
      <PosterPaper color="#C8C2B8" />
      <group position={[0, 0, 0.018]}>
        <Text
          position={[0, 0.32, 0]}
          fontSize={0.034}
          fontWeight={900}
          color="#B81818"
          anchorX="center"
          anchorY="middle"
          maxWidth={W * 0.95}
        >
          {'THROWBACK\nTHURSDAY'}
        </Text>
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[0.5, 0.28, 0.01]} />
          <meshStandardMaterial color="#B81818" roughness={0.55} metalness={0.12} />
        </mesh>
        <mesh position={[-0.16, -0.02, 0.008]}>
          <circleGeometry args={[0.08, 28]} />
          <meshStandardMaterial color="#2A2622" roughness={0.75} />
        </mesh>
        <mesh position={[0.16, -0.02, 0.008]}>
          <circleGeometry args={[0.08, 28]} />
          <meshStandardMaterial color="#2A2622" roughness={0.75} />
        </mesh>
        <Text
          position={[0, -0.38, 0]}
          fontSize={0.022}
          fontWeight={600}
          color="#8A3228"
          anchorX="center"
          anchorY="middle"
          maxWidth={W * 0.88}
        >
          When life was all about fun & games
        </Text>
      </group>
    </group>
  );
}

/** 뒷벽 상단 — 자동차 번호판 스타일 VINYL ONLY 사인 */
function PosterBackSlimVinyl() {
  const PW = 1.56; // 가로 (번호판 비율 ~3.1:1)
  const PH = 0.50; // 세로

  return (
    <group>
      {/* 그림자 프레임 */}
      <mesh position={[0, 0, -0.013]}>
        <planeGeometry args={[PW + 0.07, PH + 0.07]} />
        <meshStandardMaterial color="#080604" roughness={1} metalness={0} />
      </mesh>

      {/* 번호판 금속 면 */}
      <mesh>
        <planeGeometry args={[PW, PH]} />
        <meshStandardMaterial
          color="#0C0C0A"
          roughness={0.18}
          metalness={0.82}
          emissive="#161410"
          emissiveIntensity={0.18}
        />
      </mesh>

      {/* 상단 빨간 테두리 바 */}
      <mesh position={[0,  PH / 2 - 0.017, 0.004]}>
        <planeGeometry args={[PW - 0.05, 0.016]} />
        <meshStandardMaterial color="#CC1A1A" emissive="#991010" emissiveIntensity={0.6} roughness={0.35} metalness={0.25} />
      </mesh>
      {/* 하단 빨간 테두리 바 */}
      <mesh position={[0, -(PH / 2 - 0.017), 0.004]}>
        <planeGeometry args={[PW - 0.05, 0.016]} />
        <meshStandardMaterial color="#CC1A1A" emissive="#991010" emissiveIntensity={0.6} roughness={0.35} metalness={0.25} />
      </mesh>

      {/* VINYL ONLY 메인 텍스트 */}
      <Text
        position={[0, 0.045, 0.016]}
        fontSize={0.175}
        fontWeight={900}
        color="#FF1A1A"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.10}
      >
        VINYL ONLY
      </Text>

      {/* 서브 텍스트 */}
      <Text
        position={[0, -0.155, 0.016]}
        fontSize={0.030}
        fontWeight={600}
        color="#5A5A50"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.28}
      >
        NO SHUFFLE · ROOM RULES
      </Text>

      {/* 볼트 구멍 (좌·우) */}
      {([-0.68, 0.68] as number[]).map((x, i) => (
        <group key={i} position={[x, 0, 0.006]}>
          <mesh>
            <circleGeometry args={[0.028, 14]} />
            <meshStandardMaterial color="#1A1A18" metalness={0.95} roughness={0.06} />
          </mesh>
          {/* 볼트 헤드 하이라이트 */}
          <mesh position={[0, 0, 0.003]}>
            <circleGeometry args={[0.010, 10]} />
            <meshStandardMaterial color="#4A4A44" metalness={0.98} roughness={0.04} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** 우벽: 머스타드 + 블랙 */
function PosterRightSpin() {
  return (
    <group>
      <FrameBacking />
      <PosterPaper color="#E8B82A" />
      <group position={[0, 0, 0.018]}>
        <mesh position={[0, 0.12, 0]}>
          <circleGeometry args={[0.28, 40]} />
          <meshStandardMaterial color="#0D0C0A" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.12, 0.002]}>
          <circleGeometry args={[0.09, 24]} />
          <meshStandardMaterial color="#E8B82A" emissive="#E8B82A" emissiveIntensity={0.15} />
        </mesh>
        <mesh position={[0.26, 0.22, 0]} rotation={[0, 0, -0.5]}>
          <planeGeometry args={[0.22, 0.04]} />
          <meshStandardMaterial color="#F7F2E8" roughness={0.85} />
        </mesh>
        <Text
          position={[0, -0.22, 0]}
          fontSize={0.068}
          fontWeight={900}
          color="#0D0C0A"
          anchorX="center"
          anchorY="middle"
        >
          TOP SPIN
        </Text>
        <Text
          position={[0, -0.38, 0]}
          fontSize={0.024}
          fontWeight={600}
          color="#0D0C0A"
          anchorX="center"
          anchorY="middle"
        >
          STEREO · ROOM ONLY
        </Text>
      </group>
    </group>
  );
}

/**
 * 양옆 벽에 빈티지 스크린프린트/리소 느낌 포스터 (절차 텍스처 + Troika 텍스트).
 */
export function WallPosters() {
  const xl = 1.12;
  const lg = 1.0;
  const md = 0.88;
  const xLeftUpper = backWallFlankX(xl, -1);
  const xRightUpper = backWallFlankX(xl, 1);
  const xLeftMid = backWallFlankX(lg, -1);
  const xRightMid = backWallFlankX(lg, 1);
  const xLeftLo = backWallFlankX(md, -1);
  const xRightLo = backWallFlankX(md, 1);
  /** 책장 윗선 위 — 이전엔 y≈3.38이라 책장(높이 ~4.4)에 가려짐 */
  const yTopBand = SHELF_TOP_Y + 0.2;
  const yUpper = SHELF_TOP_Y - 0.52;
  const yMid = SHELF_FOOT_Y + SHELF_CONFIG.lpSectionBaseY + 1.52;
  const yLow = SHELF_FOOT_Y + SHELF_CONFIG.lpSectionBaseY + 0.58;

  return (
    <group>
      {/* ── 뒷벽(가운데 벽): 책장 옆면에 최대한 붙임 + Z를 앞으로 */}
      <group position={[xLeftUpper, yUpper, BACK_WALL_Z]} rotation={[0, 0, -0.018]}>
        <group scale={[xl, xl, 1]}>
          <PosterBackDiscoFever />
        </group>
      </group>
      <group position={[xRightUpper, yUpper + 0.04, BACK_WALL_Z]} rotation={[0, 0, 0.02]}>
        <group scale={[xl, xl, 1]}>
          <PosterBackThrowbackRadio />
        </group>
      </group>
      <group position={[xLeftMid, yMid, BACK_WALL_Z]} rotation={[0, 0, 0.022]}>
        <group scale={[lg, lg, 1]}>
          <PosterBackCheck />
        </group>
      </group>
      <group position={[xRightMid, yMid - 0.02, BACK_WALL_Z]} rotation={[0, 0, -0.02]}>
        <group scale={[lg, lg, 1]}>
          <PosterRightCassette />
        </group>
      </group>
      <group position={[xLeftLo, yLow, BACK_WALL_Z]} rotation={[0, 0, -0.024]}>
        <group scale={[md, md, 1]}>
          <PosterLeftFeria />
        </group>
      </group>
      <group position={[xRightLo, yLow, BACK_WALL_Z]} rotation={[0, 0, 0.026]}>
        <group scale={[md, md, 1]}>
          <PosterRightSpin />
        </group>
      </group>
      <group position={[0, yTopBand, BACK_WALL_Z + 0.02]} rotation={[0, 0, 0]}>
        <group scale={[0.68, 0.68, 1]}>
          <PosterBackSlimVinyl />
        </group>
      </group>

      {/* 좌벽 — 책장 모서리 쪽으로 더 당김 (뒷벽과 만나는 근처) */}
      <group position={[-4.765, 3.08, -2.82]} rotation={[0, Math.PI / 2, 0.026]}>
        <PosterLeftBlue />
      </group>
      <group position={[-4.765, 2.18, -3.12]} rotation={[0, Math.PI / 2, -0.02]}>
        <group scale={[0.55, 0.55, 1]}>
          <PosterLeftSticker />
        </group>
      </group>
      <group position={[-4.765, 1.72, -2.55]} rotation={[0, Math.PI / 2, -0.028]}>
        <group scale={[0.52, 0.52, 1]}>
          <PosterLeftMiniBlue />
        </group>
      </group>

      {/* 우벽 — 책장 깊이 쪽으로 */}
      <group position={[4.765, 3.05, -2.8]} rotation={[0, -Math.PI / 2, -0.024]}>
        <group scale={[0.55, 0.55, 1]}>
          <PosterRightLive />
        </group>
      </group>
      <group position={[4.765, 2.12, -3.08]} rotation={[0, -Math.PI / 2, 0.022]}>
        <group scale={[0.52, 0.52, 1]}>
          <PosterRightMono />
        </group>
      </group>
    </group>
  );
}
