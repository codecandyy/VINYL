import React from 'react';
import { Platform } from 'react-native';
import {
  EffectComposer,
  Vignette,
  Noise,
  Sepia,
  ChromaticAberration,
  HueSaturation,
  BrightnessContrast,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

/**
 * 레트로/빈티지 그레이딩 — 구 렌즈·필름 느낌 (패스 수는 여전히 가벼운 편)
 */
export function VinylPostFX() {
  if (Platform.OS !== 'web') return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <ChromaticAberration
        blendFunction={BlendFunction.NORMAL}
        offset={[0.00055, 0.00032]}
        radialModulation
        modulationOffset={0.26}
      />
      <HueSaturation blendFunction={BlendFunction.SRC} hue={0.012} saturation={0.06} />
      <BrightnessContrast blendFunction={BlendFunction.SRC} brightness={0.02} contrast={0.06} />
      <Sepia blendFunction={BlendFunction.NORMAL} opacity={0.12} />
      <Noise opacity={0.045} blendFunction={BlendFunction.OVERLAY} />
      <Vignette offset={0.22} darkness={0.42} eskil={false} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}
