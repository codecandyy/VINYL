import React from 'react';
import { Platform } from 'react-native';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  HueSaturation,
  BrightnessContrast,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

type Props = {
  isPlaying?: boolean;
};

/**
 * 웹에서 N8AO + DOF + 다중 톤매핑 조합이 GPU/드라이버에 따라 검은 화면·셰이더 경고를 유발할 수 있어
 * Bloom / CA / Grain / Vignette / 채도 중심으로 유지 (빈티지 느낌 + 안정성).
 * SMAA는 제거 — Canvas `gl.antialias`(웹)로 대체해 패스 비용 절감.
 */
export function VinylPostFX({ isPlaying = false }: Props) {
  if (Platform.OS !== 'web') return null;

  const bloomIntensity = isPlaying ? 1.15 : 0.82;

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={0.38}
        luminanceSmoothing={0.9}
        mipmapBlur={false}
        radius={0.72}
      />

      <ChromaticAberration
        offset={new THREE.Vector2(0.0012, 0.0012)}
        radialModulation={false}
        modulationOffset={0}
        blendFunction={BlendFunction.NORMAL}
      />

      <Noise opacity={0.065} blendFunction={BlendFunction.OVERLAY} />

      <HueSaturation hue={0.02} saturation={0.38} blendFunction={BlendFunction.NORMAL} />

      <BrightnessContrast
        brightness={0.04}
        contrast={0.12}
        blendFunction={BlendFunction.NORMAL}
      />

      <Vignette offset={0.28} darkness={0.42} eskil={false} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}
