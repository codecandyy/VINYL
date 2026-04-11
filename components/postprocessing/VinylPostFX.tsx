import React from 'react';
import { Platform } from 'react-native';
import {
  EffectComposer,
  Vignette,
  HueSaturation,
  BrightnessContrast,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

/**
 * 레트로 그레이딩 — 정적 pass만 유지 (Noise·ChromaticAberration·Sepia 제거로 GPU 부하 감소)
 */
export function VinylPostFX() {
  if (Platform.OS !== 'web') return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <HueSaturation blendFunction={BlendFunction.SRC} hue={0.012} saturation={0.06} />
      <BrightnessContrast blendFunction={BlendFunction.SRC} brightness={0.02} contrast={0.06} />
      <Vignette offset={0.22} darkness={0.42} eskil={false} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}
