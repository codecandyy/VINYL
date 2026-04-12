import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VinylShopScene } from '../components/scene/VinylShopScene';
import { NowPlayingHUD } from '../components/scene/NowPlayingHUD';
import { TurntableDeckModal } from '../components/deck/TurntableDeckModal';
import { MusicSearch } from '../components/music/MusicSearch';
import { VendPanel } from '../components/vending/VendPanel';
import { ShareCard } from '../components/share/ShareCard';
import { Toast } from '../components/ui/Toast';
import { LPShopIcon } from '../components/ui/LPShopIcon';
import { GestureCamera } from '../components/gesture/GestureCamera';
import { GestureCursor } from '../components/gesture/GestureCursor';

import { useMusicPlayer } from '../hooks/useMusicPlayer';
import { useCollection } from '../hooks/useCollection';
import { useCollectionStore } from '../stores/collectionStore';
import { MusicTrack } from '../lib/music';
import { getDeckSetListTracks } from '../lib/localCollection';
import { colors } from '../lib/constants';
import { useQueueStore } from '../stores/queueStore';
import { useGestureStore } from '../stores/gestureStore';
import { usePlayerStore } from '../stores/playerStore';

export default function RoomScreen() {
  const insets = useSafeAreaInsets();
  const [showSearch, setShowSearch] = useState(false);
  const [showVending, setShowVending] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [deckOpen, setDeckOpen] = useState(false);
  const [deckQueueStrip, setDeckQueueStrip] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const { playTrack, togglePlay } = useMusicPlayer();
  const { addToCollection, markPlayed } = useCollection();
  const { lps } = useCollectionStore();
  const webPendingSlot = useQueueStore((s) => s.webPendingSlotIndex);
  const setWebPendingSlot = useQueueStore((s) => s.setWebPendingSlot);
  const { gestureEnabled, swipeDirection, toggleGesture, setGestureState, openDeckRequest,
          fistNextTrack, fistPrevTrack } = useGestureStore();

  // 제스처: 스와이프 왼→오른 → 다음 곡
  useEffect(() => {
    if (!deckOpen) return;
    if (swipeDirection !== 'left-to-right') return;
    setGestureState({ swipeDirection: null });

    const ps = usePlayerStore.getState();
    const deck = ps.sideTracksForDeck;
    const nowIdx = ps.playingSideIndex;
    if (!deck || deck.length === 0) return;

    for (let i = nowIdx + 1; i < deck.length; i++) {
      if (deck[i]?.previewUrl) {
        void playTrack(deck[i]!, { sideAlbumTracks: deck, initialSideIndex: i });
        setToast({ msg: '▶ 다음 곡', type: 'info' });
        return;
      }
    }
    setToast({ msg: '마지막 곡입니다', type: 'info' });
  }, [swipeDirection, deckOpen, playTrack, setGestureState]);

  // 제스처: 스와이프 오른→왼 → 이전 곡
  useEffect(() => {
    if (!deckOpen) return;
    if (swipeDirection !== 'right-to-left') return;
    setGestureState({ swipeDirection: null });

    const ps = usePlayerStore.getState();
    const deck = ps.sideTracksForDeck;
    const nowIdx = ps.playingSideIndex;
    if (!deck || deck.length === 0) return;

    for (let i = nowIdx - 1; i >= 0; i--) {
      if (deck[i]?.previewUrl) {
        void playTrack(deck[i]!, { sideAlbumTracks: deck, initialSideIndex: i });
        setToast({ msg: '◀ 이전 곡', type: 'info' });
        return;
      }
    }
    setToast({ msg: '첫 번째 곡입니다', type: 'info' });
  }, [swipeDirection, deckOpen, playTrack, setGestureState]);

  // 제스처 트랙 이동 쿨다운 (중복 호출 방지)
  const lastFistTrackRef = useRef(0);

  // 제스처: 오른손 주먹 쥐었다 폄 → 다음 곡 (덱 열린 상태)
  useEffect(() => {
    if (!fistNextTrack || !deckOpen) return;
    // 800ms 이내 중복 이벤트 무시 (swipe + fist 동시 발화 방지)
    if (Date.now() - lastFistTrackRef.current < 800) return;
    lastFistTrackRef.current = Date.now();

    const ps = usePlayerStore.getState();
    const deck = ps.sideTracksForDeck;
    const nowIdx = ps.playingSideIndex;
    if (!deck || deck.length === 0) return;
    for (let i = nowIdx + 1; i < deck.length; i++) {
      if (deck[i]?.previewUrl) {
        void playTrack(deck[i]!, { sideAlbumTracks: deck, initialSideIndex: i });
        setToast({ msg: '▶ 다음 곡', type: 'info' });
        return;
      }
    }
    setToast({ msg: '마지막 곡입니다', type: 'info' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fistNextTrack]);

  // 제스처: 왼손 주먹 쥐었다 폄 → 이전 곡 (덱 열린 상태)
  useEffect(() => {
    if (!fistPrevTrack || !deckOpen) return;
    if (Date.now() - lastFistTrackRef.current < 800) return;
    lastFistTrackRef.current = Date.now();

    const ps = usePlayerStore.getState();
    const deck = ps.sideTracksForDeck;
    const nowIdx = ps.playingSideIndex;
    if (!deck || deck.length === 0) return;
    for (let i = nowIdx - 1; i >= 0; i--) {
      if (deck[i]?.previewUrl) {
        void playTrack(deck[i]!, { sideAlbumTracks: deck, initialSideIndex: i });
        setToast({ msg: '◀ 이전 곡', type: 'info' });
        return;
      }
    }
    setToast({ msg: '첫 번째 곡입니다', type: 'info' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fistPrevTrack]);

  // 제스처: 핀치 × 2 → 덱 모달 열기
  useEffect(() => {
    if (!openDeckRequest) return;
    setDeckOpen(true);
  }, [openDeckRequest]);

  const handleAddFromSearch = async (track: MusicTrack) => {
    const lp = await addToCollection(track);
    if (lp) {
      setToast({ msg: `"${track.title}" LP에 담았어요`, type: 'success' });
      const setList = getDeckSetListTracks(lp);
      const initialIdx = Math.max(
        0,
        setList.findIndex((t) => t.id === track.id)
      );
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
            height: '100vh',
            overflow: 'hidden',
          } as object),
      ]}
    >
      <View style={StyleSheet.absoluteFill}>
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
          isDeckOpen={deckOpen}
        />
      </View>

      <View
        style={[
          StyleSheet.absoluteFill,
          Platform.OS === 'web'
            ? { zIndex: 2 }
            : { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 8) },
          { pointerEvents: 'box-none' } as object,
        ]}
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
        {/* 제스처 토글 버튼 (웹 전용) */}
        {Platform.OS === 'web' && (
          <Pressable
            onPress={toggleGesture}
            style={[
              styles.gestureToggle,
              gestureEnabled && styles.gestureToggleActive,
            ]}
            accessibilityLabel="손 제스처 토글"
          >
            <Text style={styles.gestureToggleText}>{gestureEnabled ? '✋' : '🤚'}</Text>
          </Pressable>
        )}
      </View>

      {/* GestureCamera PIP (웹 전용, gestureEnabled일 때만 렌더) */}
      {Platform.OS === 'web' && <GestureCamera deckOpen={deckOpen} />}
      {/* GestureCursor — 메인 씬 위 손 위치 커서 */}
      {Platform.OS === 'web' && <GestureCursor />}

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
  gestureToggle: {
    position: 'absolute',
    top: 16,
    right: 60,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(24, 18, 12, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(245,237,216,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  gestureToggleActive: {
    backgroundColor: 'rgba(74, 222, 128, 0.25)',
    borderColor: '#4ADE80',
  },
  gestureToggleText: {
    fontSize: 18,
  },
});
