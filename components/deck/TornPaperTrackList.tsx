import React, { useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ScrollView } from 'react-native';
import { usePlayerStore } from '../../stores/playerStore';
import { useMusicPlayer } from '../../hooks/useMusicPlayer';
import { MusicTrack } from '../../lib/music';
import { PlayingBars } from './PlayingBars';

// Inject Special Elite font on web (once)
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const id = '__vinyl_special_elite_font';
  if (!document.getElementById(id)) {
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Special+Elite&display=swap';
    document.head.appendChild(link);
  }
}

/**
 * 멀티 트랙(또는 단일) 재생 시 — 빈티지 타자기 메모지 스타일의 수록곡 목록
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
          boxShadow: '2px 3px 0 rgba(45,38,30,0.18), 4px 10px 18px rgba(0,0,0,0.28)',
          clipPath: 'polygon(0% 2%, 4% 0%, 98% 1%, 100% 5%, 99% 96%, 96% 100%, 3% 99%, 0% 94%)',
        } as object)
      : {};

  return (
    <View style={styles.column}>
      <View style={[styles.paper, webPaper]}>
        {/* Ruled lines overlay */}
        {Array.from({ length: 14 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.ruledLine,
              { top: 34 + i * 22 },
            ]}
          />
        ))}

        <Text style={styles.caption}>SET LIST</Text>

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
                    <PlayingBars active color="#7B4F2A" />
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
    ? ({
        fontFamily: "'Special Elite', 'Courier New', monospace",
        fontSize: 13,
        lineHeight: 20,
      } as const)
    : { fontSize: 12, fontFamily: 'Courier New', fontStyle: 'italic' as const, lineHeight: 18 };

const styles = StyleSheet.create({
  column: {
    width: 152,
    paddingTop: 8,
    alignSelf: 'flex-start',
  },
  paper: {
    width: '100%',
    maxWidth: 145,
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 10,
    backgroundColor: '#DDD5B8',
    borderRadius: 1,
    transform: [{ rotate: '-1.5deg' }],
    borderWidth: Platform.OS === 'web' ? 0 : 1,
    borderColor: 'rgba(60,48,36,0.2)',
    borderLeftWidth: 2,
    borderLeftColor: '#c8b89a',
    overflow: 'hidden',
  },
  ruledLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(160,130,90,0.18)',
  },
  caption: {
    fontSize: 9,
    letterSpacing: 2.5,
    color: '#8B4513',
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? ("'Special Elite', 'Courier New', monospace" as any) : 'Courier New',
    borderBottomWidth: 1,
    borderBottomColor: '#c8b89a',
    paddingBottom: 4,
  },
  scroll: { maxHeight: 300 },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eqSlot: {
    width: 20,
    height: 14,
    marginRight: 4,
  },
  handFlex: { flex: 1 },
  row: {
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(80,60,40,0.25)',
    borderStyle: 'dotted',
  },
  rowActive: {
    backgroundColor: 'rgba(200,150,60,0.2)',
  },
  rowPressed: {
    opacity: 0.85,
  },
  hand: {
    color: '#3a2e1e',
    ...handFont,
  },
  handActive: {
    color: '#1a1206',
    fontWeight: Platform.OS === 'web' ? ('700' as const) : ('700' as const),
  },
  rowNoPreview: {
    opacity: 0.5,
  },
  handMuted: {
    color: '#8a7a62',
  },
});
