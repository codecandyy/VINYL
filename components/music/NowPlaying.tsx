import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { usePlayerStore } from '../../stores/playerStore';
import { colors } from '../../lib/constants';

type Props = {
  onTogglePlay: () => void;
};

export function NowPlaying({ onTogglePlay }: Props) {
  const { currentTrack, isPlaying, positionMs, durationMs } = usePlayerStore();

  if (!currentTrack) return null;

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {currentTrack.artworkUrl ? (
        <Image source={{ uri: currentTrack.artworkUrl }} style={styles.art} />
      ) : (
        <View style={[styles.art, { backgroundColor: colors.copper }]} />
      )}

      <View style={styles.info}>
        <Text style={styles.trackName} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>

        <View style={styles.times}>
          <Text style={styles.timeText}>{fmt(positionMs)}</Text>
          <Text style={[styles.timeText, { opacity: 0.5 }]}>30초 미리듣기</Text>
          <Text style={styles.timeText}>{fmt(durationMs || 30000)}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={onTogglePlay} style={styles.playBtn}>
        <Text style={styles.playBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 78,
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
    shadowColor: colors.copper,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  art: { width: 50, height: 50, borderRadius: 4 },
  info: { flex: 1, gap: 2 },
  trackName: { color: colors.cream, fontSize: 13, fontWeight: '700' },
  artist: { color: colors.copper, fontSize: 11 },
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
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  timeText: { color: colors.muted, fontSize: 9, fontFamily: 'monospace' },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.copper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnText: { fontSize: 16, color: colors.bg },
});
