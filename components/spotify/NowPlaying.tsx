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

  const albumArt = currentTrack.artworkUrl;
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {albumArt && <Image source={{ uri: albumArt }} style={styles.art} />}

      <View style={styles.info}>
        <Text style={styles.trackName} numberOfLines={1}>{currentTrack.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{currentTrack.artist}</Text>

        {/* 프로그레스 바 */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.times}>
          <Text style={styles.timeText}>{formatTime(positionMs)}</Text>
          <Text style={styles.timeText}>{formatTime(durationMs)}</Text>
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
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: colors.bg3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.shelf,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  art: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  trackName: {
    color: colors.cream,
    fontSize: 13,
    fontWeight: '600',
  },
  artist: {
    color: colors.muted,
    fontSize: 11,
  },
  progressTrack: {
    height: 2,
    backgroundColor: colors.shelf,
    borderRadius: 1,
    marginTop: 4,
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
    marginTop: 2,
  },
  timeText: {
    color: colors.muted,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.copper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnText: {
    fontSize: 16,
  },
});
