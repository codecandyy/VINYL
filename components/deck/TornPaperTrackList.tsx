import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ScrollView } from 'react-native';
import { usePlayerStore } from '../../stores/playerStore';
import { useMusicPlayer } from '../../hooks/useMusicPlayer';
import { MusicTrack } from '../../lib/music';
import { PlayingBars } from './PlayingBars';

/**
 * 멀티 트랙(또는 단일) 재생 시 — 찢어진 공책 + 연필 필기 느낌의 수록곡 목록
 */
export function TornPaperTrackList() {
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const sideTracks = usePlayerStore((s) => s.sideTracksForDeck);
  const playingSideIndex = usePlayerStore((s) => s.playingSideIndex);
  const { playTrack } = useMusicPlayer();

  const rows: MusicTrack[] = useMemo(() => {
    if (sideTracks && sideTracks.length > 0) return sideTracks;
    if (currentTrack) return [currentTrack];
    return [];
  }, [sideTracks, currentTrack]);

  const listFromDeck = (sideTracks?.length ?? 0) > 0;

  if (rows.length === 0) return null;

  const onPick = (i: number) => {
    const t = rows[i];
    if (!t?.previewUrl) return;
    if (listFromDeck && sideTracks) {
      playTrack(t, { sideAlbumTracks: sideTracks, initialSideIndex: i });
    } else {
      playTrack(t);
    }
  };

  const webPaper =
    Platform.OS === 'web'
      ? ({
          boxShadow: '2px 3px 0 rgba(45,38,30,0.12), 4px 8px 14px rgba(0,0,0,0.22)',
          // @ts-ignore torn edge hint
          clipPath: 'polygon(0% 2%, 4% 0%, 98% 1%, 100% 5%, 99% 96%, 96% 100%, 3% 99%, 0% 94%)',
        } as object)
      : {};

  return (
    <View style={styles.column}>
      <View style={[styles.paper, webPaper]}>
        <Text style={styles.caption}>set list</Text>
        <ScrollView
          style={styles.scroll}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={rows.length > 7}
        >
          {rows.map((t, i) => {
            const active =
              listFromDeck && sideTracks
                ? playingSideIndex === i
                : currentTrack?.id === t.id;
            const canPlay = !!t.previewUrl;
            const showEq = active && isPlaying && canPlay;
            return (
              <Pressable
                key={`${t.id}-${i}`}
                onPress={() => onPick(i)}
                disabled={!canPlay}
                style={({ pressed }) => [
                  styles.row,
                  active && styles.rowActive,
                  pressed && canPlay && styles.rowPressed,
                  !canPlay && styles.rowNoPreview,
                ]}
              >
                <View style={styles.rowInner}>
                  {showEq ? (
                    <PlayingBars active />
                  ) : (
                    <View style={styles.eqSlot} />
                  )}
                  <Text
                    style={[
                      styles.hand,
                      styles.handFlex,
                      !canPlay && styles.handMuted,
                      active && styles.handActive,
                    ]}
                    numberOfLines={2}
                  >
                    {i + 1}. {t.title}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const handFont =
  Platform.OS === 'web'
    ? ({ fontFamily: 'Caveat, cursive', fontSize: 17, lineHeight: 20 } as const)
    : { fontSize: 13, fontStyle: 'italic' as const, lineHeight: 18 };

const styles = StyleSheet.create({
  column: {
    width: 148,
    paddingTop: 8,
    alignSelf: 'flex-start',
  },
  paper: {
    width: '100%',
    maxWidth: 140,
    paddingVertical: 10,
    paddingHorizontal: 9,
    backgroundColor: '#E8E2D6',
    borderRadius: 1,
    transform: [{ rotate: '-2deg' }],
    borderWidth: Platform.OS === 'web' ? 0 : 1,
    borderColor: 'rgba(60,48,36,0.15)',
  },
  caption: {
    fontSize: 8,
    letterSpacing: 1.2,
    color: '#7a6a58',
    marginBottom: 6,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  scroll: { maxHeight: 280 },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eqSlot: {
    width: 22,
    height: 14,
    marginRight: 4,
  },
  handFlex: { flex: 1 },
  row: {
    paddingVertical: 5,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(80,70,58,0.12)',
    borderStyle: 'dashed',
  },
  rowActive: {
    backgroundColor: 'rgba(255,248,230,0.65)',
  },
  rowPressed: {
    opacity: 0.85,
  },
  hand: {
    color: '#3d3830',
    ...handFont,
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 0,
  },
  handActive: {
    color: '#1a1814',
    fontWeight: Platform.OS === 'web' ? ('600' as const) : ('700' as const),
  },
  rowNoPreview: {
    opacity: 0.55,
  },
  handMuted: {
    color: '#8a8078',
  },
});
