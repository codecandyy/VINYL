import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { usePlayerStore } from '../../stores/playerStore';
import { useMusicPlayer } from '../../hooks/useMusicPlayer';
import { VolumeBar } from '../ui/VolumeBar';
import { colors } from '../../lib/constants';

type Props = {
  onTogglePlay: () => void;
  dustLevel: number;
  onCleanRoom: () => void;
};

export function NowPlayingHUD({ onTogglePlay, dustLevel, onCleanRoom }: Props) {
  const { currentTrack, isPlaying, positionMs: position, durationMs: duration } = usePlayerStore();
  const { volume, setVolume } = useMusicPlayer();
  const progress = duration > 0 ? position / duration : 0;

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <>
      {/* ── 먼지 경고 배너 ── */}
      {dustLevel >= 30 && (
        <TouchableOpacity
          style={[styles.dustBanner, dustLevel >= 70 && styles.dustBannerCritical]}
          onPress={onCleanRoom}
          activeOpacity={0.8}
        >
          <Text style={styles.dustText}>
            {dustLevel >= 70 ? '⚠ ' : ''}먼지 {dustLevel}% · 탭해서 닦기
          </Text>
        </TouchableOpacity>
      )}

      {/* ── 하단 Now Playing ── */}
      {currentTrack && (
        <View style={styles.nowPlaying}>
          {currentTrack.artworkUrl ? (
            <Image source={{ uri: currentTrack.artworkUrl }} style={styles.art} />
          ) : (
            <View style={[styles.art, { backgroundColor: colors.copper }]} />
          )}

          <View style={styles.trackInfo}>
            <Text style={styles.trackName} numberOfLines={1}>{currentTrack.title}</Text>
            <Text style={styles.artistName} numberOfLines={1}>{currentTrack.artist}</Text>
            {/* 프로그레스 바 */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
            <VolumeBar volume={volume} onChange={setVolume} />
          </View>

          <TouchableOpacity onPress={onTogglePlay} style={styles.playBtn}>
            <Text style={styles.playBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 재생 중일 때 미세한 "재생 중" 표시 */}
      {isPlaying && (
        <View style={styles.playingIndicator}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.bar, { opacity: 0.7 + i * 0.1 }]} />
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dustBanner: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: `${colors.shelf}CC`,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.muted,
    zIndex: 10,
  },
  dustBannerCritical: {
    backgroundColor: `${colors.red}CC`,
    borderColor: colors.red,
  },
  dustText: {
    color: colors.cream,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  nowPlaying: {
    position: 'absolute',
    bottom: 28,
    left: 16,
    right: 16,
    backgroundColor: `${colors.bg3}F5`,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.shelf,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
    zIndex: 10,
    // 글로우 효과
    shadowColor: colors.copper,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  art: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  trackInfo: {
    flex: 1,
    gap: 2,
  },
  trackName: {
    color: colors.cream,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  artistName: {
    color: colors.copper,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 2,
    backgroundColor: colors.shelf,
    borderRadius: 1,
    marginTop: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.copper,
    borderRadius: 1,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeText: {
    color: colors.muted,
    fontSize: 9,
    fontFamily: 'monospace',
  },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.copper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnText: {
    fontSize: 16,
    color: colors.bg,
  },
  playingIndicator: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    flexDirection: 'row',
    gap: 2,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  bar: {
    width: 3,
    height: 14,
    backgroundColor: colors.copper,
    borderRadius: 2,
  },
});
