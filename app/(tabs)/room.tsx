import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VinylShopScene } from '../../components/scene/VinylShopScene';
import { NowPlayingHUD } from '../../components/scene/NowPlayingHUD';
import { TurntableDeckModal } from '../../components/deck/TurntableDeckModal';
import { MusicSearch } from '../../components/music/MusicSearch';
import { VendPanel } from '../../components/vending/VendPanel';
import { ShareCard } from '../../components/share/ShareCard';
import { Toast } from '../../components/ui/Toast';
import { LPShopIcon } from '../../components/ui/LPShopIcon';

import { useMusicPlayer } from '../../hooks/useMusicPlayer';
import { useCollection } from '../../hooks/useCollection';
import { useCollectionStore } from '../../stores/collectionStore';
import { MusicTrack } from '../../lib/music';
import { getDeckSetListTracks } from '../../lib/localCollection';
import { colors } from '../../lib/constants';
import { useQueueStore } from '../../stores/queueStore';

export default function RoomScreen() {
  const insets = useSafeAreaInsets();
  const [showSearch,  setShowSearch]  = useState(false);
  const [showVending, setShowVending] = useState(false);
  const [showShare,   setShowShare]   = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  const [deckQueueStrip, setDeckQueueStrip] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success'|'error'|'info' } | null>(null);

  const { playTrack, togglePlay } = useMusicPlayer();
  const { addToCollection, markPlayed } = useCollection();
  const { lps }         = useCollectionStore();
  const webPendingSlot = useQueueStore((s) => s.webPendingSlotIndex);
  const setWebPendingSlot = useQueueStore((s) => s.setWebPendingSlot);

  const handleAddFromSearch = async (track: MusicTrack) => {
    const lp = await addToCollection(track);
    if (lp) {
      setToast({ msg: `"${track.title}" LP에 담았어요`, type: 'success' });
      const setList = getDeckSetListTracks(lp);
      const initialIdx = Math.max(0, setList.findIndex((t) => t.id === track.id));
      void markPlayed(lp.id);
      await playTrack(track, {
        sideAlbumTracks: setList,
        initialSideIndex: initialIdx,
      });
    }
    setShowSearch(false);
  };

  const handleVendingAdd = async (track: MusicTrack) => {
    const lp = await addToCollection(track);
    if (lp) setToast({ msg: `"${track.title}" 뽑았어요!`, type: 'success' });
  };

  return (
    <View
      style={[
        styles.container,
        Platform.OS === 'web' &&
          ({
            minHeight: '100vh',
            height: '100%',
          } as object),
      ]}
    >
      <View style={[StyleSheet.absoluteFill, Platform.OS === 'web' && styles.sceneLayerWeb]}>
        <View style={[styles.sceneFill, Platform.OS === 'web' && styles.sceneFillWeb]}>
          <VinylShopScene
          lps={lps}
          onPlayTrack={(track, opts) => playTrack(track as any, opts)}
          onOpenVending={() => setShowVending(true)}
          onShare={() => setShowShare(true)}
          onOpenDeck={() => setDeckOpen(true)}
          onTurntableLpPlaced={() => setDeckOpen(true)}
          onWebQueuePickDone={() => {
            setDeckOpen(true);
            setDeckQueueStrip(true);
          }}
          isVendOpen={showVending}
        />
        </View>
      </View>

      <View
        style={[
          StyleSheet.absoluteFill,
          Platform.OS === 'web'
            ? { zIndex: 2 }
            : { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 8) },
        ]}
        pointerEvents="box-none"
      >
        {Platform.OS === 'web' && webPendingSlot != null ? (
          <View style={styles.queuePickBanner} pointerEvents="box-none">
            <View
              style={[
                styles.queuePickInner,
                Platform.OS === 'web' &&
                  ({
                    boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                  } as object),
              ]}
            >
              <Text style={styles.queuePickText}>다음으로 재생할 LP를 고르세요.</Text>
              <Pressable onPress={() => setWebPendingSlot(null)} hitSlop={8}>
                <Text style={styles.queuePickCancel}>취소</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        <NowPlayingHUD onTogglePlay={togglePlay} hideBottomBar={deckOpen} />
        <LPShopIcon onClick={() => setShowSearch(true)} />
      </View>

      <TurntableDeckModal
        visible={deckOpen}
        onClose={() => {
          setDeckOpen(false);
          setDeckQueueStrip(false);
        }}
        showQueueStrip={deckQueueStrip}
        onToggleQueueStrip={() => setDeckQueueStrip((v) => !v)}
        lps={lps}
      />

      {/* ── 모달 ── */}
      <MusicSearch
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectTrack={handleAddFromSearch}
      />
      <VendPanel
        visible={showVending}
        onClose={() => setShowVending(false)}
        onAddTrack={handleVendingAdd}
      />
      <ShareCard visible={showShare} onClose={() => setShowShare(false)} />

      {toast && (
        <Toast
          message={toast.msg}
          visible={!!toast}
          type={toast.type}
          onHide={() => setToast(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  sceneLayerWeb: {
    minHeight: 0,
  },
  sceneFill: {
    flex: 1,
  },
  sceneFillWeb: {
    minHeight: 0,
  },
  queuePickBanner: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  queuePickInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(24, 18, 12, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(245,237,216,0.35)',
  },
  queuePickText: {
    color: colors.cream,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  queuePickCancel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
});
