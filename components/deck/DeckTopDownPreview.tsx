import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { View, StyleSheet, Platform } from 'react-native';
import { Turntable } from '../scene/Turntable';
import { AlbumData } from '../../lib/albumTexture';
import { MusicTrack } from '../../lib/music';
import { GrooveSeekView } from './GrooveSeekView';

type Props = {
  currentAlbum: AlbumData | null;
  isPlaying: boolean;
  height: number;
  /** 그루브 시크 뷰 표시 여부 */
  showGrooveView?: boolean;
  onGrooveClose?: () => void;
  onNeedleTipClick?: () => void;
  sideTracks?: MusicTrack[];
  positionMs?: number;
  durationMs?: number;
};

const PLACEHOLDER_ALBUM: AlbumData = {
  bg: '#141008',
  accent: '#6A5A4A',
  title: '',
  artist: '',
  labelColor: '#4A4036',
};

/** 덱 모달용 위에서 본(ortho) 탑다운 — 바늘·홈 위치 조정에 맞춤 */
export function DeckTopDownPreview({
  currentAlbum,
  isPlaying,
  height,
  showGrooveView = false,
  onGrooveClose,
  onNeedleTipClick,
  sideTracks,
  positionMs = 0,
  durationMs = 0,
}: Props) {
  const hasAlbum = currentAlbum != null;
  const albumForPreview = currentAlbum ?? PLACEHOLDER_ALBUM;

  /** Expo R3F(native) Canvas는 onLayout 너비·높이가 0이면 GLView를 안 띄움. 부모가 alignItems:center면 100%만으로 가로가 0으로 붕괴하는 경우가 있어 stretch 필수 */
  const canvasStyle =
    Platform.OS === 'web'
      ? { flex: 1, minHeight: 0, width: '100%', height: '100%' as const }
      : styles.canvas;

  return (
    <View style={[styles.wrap, { height }]}>
      <Canvas
        style={canvasStyle}
        frameloop="always"
        dpr={[1, 1.25]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'low-power',
        }}
      >
        <color attach="background" args={['#1a1510']} />
        <OrthographicCamera
          makeDefault
          position={[0, 2.85, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          zoom={220}
          near={0.05}
          far={40}
        />
        <ambientLight intensity={0.95} />
        <directionalLight position={[0.35, 1.4, 0.2]} intensity={1.1} color="#FFE8D0" />
        <Suspense fallback={null}>
          <group position={[0, 0, 0]} scale={[1.12, 1.12, 1.12]}>
            <Turntable
              currentAlbum={albumForPreview}
              isPlaying={isPlaying}
              tonearmScrubWhenStopped
              placeholderVinyl={!hasAlbum}
              onNeedleTipClick={onNeedleTipClick}
            />
          </group>
        </Suspense>
      </Canvas>

      {showGrooveView && onGrooveClose && (
        <GrooveSeekView
          tracks={sideTracks ?? []}
          positionMs={positionMs}
          durationMs={durationMs}
          onClose={onGrooveClose}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1a1510',
  },
  canvas: { flex: 1, minHeight: 0, width: '100%', height: '100%' },
});
