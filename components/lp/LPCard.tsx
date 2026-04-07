import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { LPRecord } from '../../lib/supabase';
import { colors } from '../../lib/constants';

type Props = {
  lp: LPRecord;
  onPress?: () => void;
  onLongPress?: () => void;
};

export function LPCard({ lp, onPress, onLongPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, lp.is_damaged && styles.damaged]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {/* LP 원형 */}
      <View style={styles.vinyl}>
        {lp.album_art_url ? (
          <Image source={{ uri: lp.album_art_url }} style={styles.albumArt} />
        ) : (
          <View style={[styles.albumArt, { backgroundColor: lp.label_color }]} />
        )}
        {/* 그루브 링 */}
        <View style={styles.groove} />
        <View style={styles.center} />
      </View>

      {/* 메타 정보 */}
      <View style={styles.meta}>
        <Text style={styles.trackName} numberOfLines={1}>{lp.track_name}</Text>
        <Text style={styles.artist} numberOfLines={1}>{lp.artist_name}</Text>
        <Text style={styles.album} numberOfLines={1}>{lp.album_name}</Text>
        {lp.is_damaged && <Text style={styles.damagedBadge}>DAMAGED</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.shelf,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  damaged: {
    borderColor: colors.red,
    opacity: 0.8,
  },
  vinyl: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  albumArt: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  groove: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#333',
  },
  center: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#444',
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  trackName: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    color: colors.copper,
    fontSize: 12,
  },
  album: {
    color: colors.muted,
    fontSize: 11,
  },
  damagedBadge: {
    color: colors.red,
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 2,
  },
});
