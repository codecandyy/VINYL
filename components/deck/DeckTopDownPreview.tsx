import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { View, StyleSheet } from 'react-native';
import { Turntable } from '../scene/Turntable';
import { AlbumData } from '../../lib/albumTexture';

type Props = {
  currentAlbum: AlbumData | null;
  isPlaying: boolean;
  height: number;
};

/** 덱 모달용 위에서 본(ortho) 탑다운 — 바늘·홈 위치 조정에 맞춤 */
export function DeckTopDownPreview({ currentAlbum, isPlaying, height }: Props) {
  return (
    <View style={[styles.wrap, { height }]}>
      <Canvas
        style={styles.canvas}
        dpr={[1, 1.2]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: 'low-power',
        }}
      >
        <color attach="background" args={['#1a1510']} />
        <OrthographicCamera
          makeDefault
          position={[0, 2.85, 0]}
          zoom={165}
          near={0.05}
          far={40}
        />
        <ambientLight intensity={0.95} />
        <directionalLight position={[0.35, 1.4, 0.2]} intensity={1.1} color="#FFE8D0" />
        <Suspense fallback={null}>
          <group position={[0, 0, 0]} scale={[1.12, 1.12, 1.12]}>
            <Turntable currentAlbum={currentAlbum} isPlaying={isPlaying} />
          </group>
        </Suspense>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1a1510',
  },
  canvas: { flex: 1, width: '100%', height: '100%' },
});
