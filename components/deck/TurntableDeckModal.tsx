import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { useQueueStore } from '../../stores/queueStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useMusicPlayer } from '../../hooks/useMusicPlayer';
import { AlbumData } from '../../lib/albumTexture';
import { LocalLP, lpToQueueTrack } from '../../lib/localCollection';
import { VolumeBar } from '../ui/VolumeBar';
import { DeckTopDownPreview } from './DeckTopDownPreview';
import { NeedleSeekBar } from './NeedleSeekBar';
import { TornPaperTrackList } from './TornPaperTrackList';
import { colors } from '../../lib/constants';
import { audioEngine } from '../../lib/audioEngine';

type Props = {
  visible: boolean;
  onClose: () => void;
  showQueueStrip: boolean;
  onToggleQueueStrip: () => void;
  lps: LocalLP[];
};

export function TurntableDeckModal({
  visible,
  onClose,
  showQueueStrip,
  onToggleQueueStrip,
  lps,
}: Props) {
  const { currentTrack, isPlaying } = usePlayerStore();
  const { volume, setVolume } = useMusicPlayer();
  const slots = useQueueStore((s) => s.slots);
  const setSlot = useQueueStore((s) => s.setSlot);
  const setWebPendingSlot = useQueueStore((s) => s.setWebPendingSlot);

  const [pickIdx, setPickIdx] = useState<number | null>(null);
  const [showGrooveView, setShowGrooveView] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const groovePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll audio position while groove view is open
  useEffect(() => {
    if (showGrooveView) {
      groovePollRef.current = setInterval(() => {
        setPositionMs(audioEngine.getPosition() * 1000);
        setDurationMs(audioEngine.getDuration() * 1000);
      }, 200);
    } else {
      if (groovePollRef.current) clearInterval(groovePollRef.current);
    }
    return () => { if (groovePollRef.current) clearInterval(groovePollRef.current); };
  }, [showGrooveView]);

  const sideTracks = usePlayerStore.getState().sideTracksForDeck ?? [];

  const currentAlbum: AlbumData | null = currentTrack
    ? {
        bg: '#1A0A00',
        accent: '#CC2020',
        title: currentTrack.title,
        artist: currentTrack.artist,
        coverUrl: currentTrack.artworkUrl ?? undefined,
      }
    : null;

  const closeAll = useCallback(() => {
    setPickIdx(null);
    setShowGrooveView(false);
    onClose();
  }, [onClose]);

  // ESC closes groove view first, then modal
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showGrooveView) { setShowGrooveView(false); }
        else { closeAll(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showGrooveView, closeAll]);

  const openPicker = (idx: number) => {
    if (Platform.OS === 'web') return;
    setPickIdx(idx);
  };

  const onEmptySlotPress = (idx: number) => {
    if (Platform.OS === 'web') {
      setWebPendingSlot(idx);
      onClose();
    } else {
      openPicker(idx);
    }
  };

  const onPickLp = (lp: LocalLP) => {
    if (pickIdx == null || !lp.previewUrl) return;
    setSlot(pickIdx, lpToQueueTrack(lp));
    setPickIdx(null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeAll}>
      <View style={styles.overlayRoot}>
        <Pressable style={styles.backdrop} onPress={closeAll} accessibilityLabel="Close deck" />

        <View
          style={[
            styles.panel,
            Platform.OS === 'web' && ({
              boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
            } as object),
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.row}>
            <TornPaperTrackList />

            <View style={styles.leftCol}>
              <DeckTopDownPreview
                currentAlbum={currentAlbum}
                isPlaying={isPlaying}
                height={400}
                showGrooveView={showGrooveView}
                onGrooveClose={() => setShowGrooveView(false)}
                onNeedleTipClick={() => setShowGrooveView(true)}
                sideTracks={sideTracks}
                positionMs={positionMs}
                durationMs={durationMs}
              />
              <NeedleSeekBar disabled={!currentTrack?.previewUrl} />
              <VolumeBar volume={volume} onChange={setVolume} />
            </View>

            <View style={styles.rightCol}>
              <Text style={styles.deckTitle}>DECK</Text>
              <Text style={styles.sub} numberOfLines={2}>
                {currentTrack?.title ?? 'LP를 올려 두세요'}
              </Text>
              {currentTrack?.album ? (
                <Text style={styles.albumTiny} numberOfLines={1}>
                  {currentTrack.album}
                </Text>
              ) : null}
              <Text style={styles.artistTiny} numberOfLines={1}>
                {currentTrack?.artist ?? ''}
              </Text>
              <Pressable style={styles.queueBtn} onPress={onToggleQueueStrip}>
                <Text style={styles.queueBtnTxt}>
                  {showQueueStrip ? '큐 접기' : '연속 재생 큐'}
                </Text>
              </Pressable>
            </View>
          </View>

          {showQueueStrip && (
            <View style={styles.stripOuter}>
              <Text style={styles.stripLabel}>
                웹: 빈 칸 + 또는 LP를 슬롯에 드롭 · 모바일: 빈 칸 탭
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripScroll}>
                {slots.map((t, i) => (
                  <View key={i} style={styles.slotWrap}>
                    <Pressable
                      style={styles.slot}
                      {...(Platform.OS === 'web'
                        ? ({
                            nativeID: `vinyl-queue-slot-${i}`,
                            'data-vinyl-queue-slot': String(i),
                          } as Record<string, string> & { nativeID: string })
                        : {})}
                      onPress={() => {
                        if (!t) onEmptySlotPress(i);
                      }}
                      disabled={!!t}
                    >
                      {t?.artworkUrl ? (
                        <Image source={{ uri: t.artworkUrl }} style={styles.slotImg} />
                      ) : (
                        <View style={styles.slotEmpty}>
                          <Text style={styles.slotHint}>＋</Text>
                        </View>
                      )}
                    </Pressable>
                    {t ? (
                      <Text style={styles.slotMeta} numberOfLines={2}>
                        {t.album} - {t.artist}
                      </Text>
                    ) : null}
                    {t && (
                      <Pressable
                        style={styles.slotClear}
                        onPress={() => setSlot(i, null)}
                        hitSlop={8}
                      >
                        <Text style={styles.slotClearTxt}>×</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {pickIdx != null && Platform.OS !== 'web' && (
          <View style={styles.pickerLayer} pointerEvents="box-none">
            <Pressable style={styles.pickerBackdrop} onPress={() => setPickIdx(null)} />
            <View style={styles.pickerPanel}>
              <Text style={styles.pickerTitle}>슬롯 {pickIdx + 1}에 넣을 LP</Text>
              <ScrollView keyboardShouldPersistTaps="handled">
                {lps.filter((x) => x.previewUrl).length === 0 ? (
                  <Text style={styles.emptyList}>컬렉션에 LP가 없어요</Text>
                ) : (
                  lps
                    .filter((x) => x.previewUrl)
                    .map((lp) => (
                      <Pressable key={lp.id} style={styles.pickRow} onPress={() => onPickLp(lp)}>
                        {lp.artworkUrl ? (
                          <Image source={{ uri: lp.artworkUrl }} style={styles.pickArt} />
                        ) : (
                          <View style={[styles.pickArt, { backgroundColor: colors.copper }]} />
                        )}
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pickTitle} numberOfLines={1}>
                            {lp.title}
                          </Text>
                          <Text style={styles.pickArtist} numberOfLines={1}>
                            {lp.artist}
                          </Text>
                        </View>
                      </Pressable>
                    ))
                )}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 36,
    paddingBottom: Platform.OS === 'web' ? 40 : 52,
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  panel: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '92%',
    backgroundColor: `${colors.bg2}F2`,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${colors.gold}44`,
    padding: 10,
    zIndex: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  leftCol: {
    flex: 3,
    minWidth: 0,
    minHeight: 0,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  rightCol: {
    flex: 1.1,
    justifyContent: 'flex-start',
    paddingTop: 4,
    gap: 6,
  },
  deckTitle: {
    color: colors.cream,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
  },
  sub: { color: colors.cream, fontSize: 12, marginTop: 4 },
  albumTiny: { color: colors.muted, fontSize: 11, marginTop: 2, fontWeight: '600' },
  artistTiny: { color: colors.muted, fontSize: 10 },
  queueBtn: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.shelf,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${colors.gold}55`,
  },
  queueBtnTxt: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  stripOuter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: `${colors.muted}33`,
    minHeight: 112,
  },
  stripLabel: {
    color: colors.muted,
    fontSize: 9,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  stripScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  slotWrap: {
    position: 'relative',
    marginRight: 10,
    alignItems: 'center',
    maxWidth: 76,
  },
  slot: {
    width: 68,
    height: 68,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(245,237,216,0.38)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,236,210,0.07)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotImg: { width: '100%', height: '100%' },
  slotEmpty: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  slotHint: { color: colors.muted, fontSize: 22, opacity: 0.7 },
  slotClear: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.bg3,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.muted,
  },
  slotClearTxt: { color: colors.cream, fontSize: 14, fontWeight: '700', lineHeight: 16 },
  slotMeta: {
    marginTop: 4,
    width: 72,
    color: colors.muted,
    fontSize: 8,
    lineHeight: 10,
    textAlign: 'center',
  },
  pickerLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  pickerPanel: {
    width: '88%',
    maxHeight: '55%',
    backgroundColor: colors.bg2,
    borderRadius: 12,
    padding: 12,
    zIndex: 11,
    borderWidth: 1,
    borderColor: colors.shelf,
  },
  pickerTitle: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  emptyList: { color: colors.muted, padding: 16, textAlign: 'center' },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.shelf,
  },
  pickArt: { width: 44, height: 44, borderRadius: 4 },
  pickTitle: { color: colors.cream, fontSize: 13, fontWeight: '600' },
  pickArtist: { color: colors.muted, fontSize: 11 },
});
