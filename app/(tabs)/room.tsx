import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { VinylShopScene } from '../../components/scene/VinylShopScene';
import { NowPlayingHUD } from '../../components/scene/NowPlayingHUD';
import { MusicSearch } from '../../components/music/MusicSearch';
import { VendingMachine } from '../../components/vending/VendingMachine';
import { ShareCard } from '../../components/share/ShareCard';
import { Toast } from '../../components/ui/Toast';

import { useMusicPlayer } from '../../hooks/useMusicPlayer';
import { useCollection } from '../../hooks/useCollection';
import { useDustSystem } from '../../hooks/useDustSystem';
import { useCollectionStore } from '../../stores/collectionStore';
import { useRoomStore } from '../../stores/roomStore';
import { MusicTrack } from '../../lib/music';
import { colors } from '../../lib/constants';

export default function RoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showSearch,  setShowSearch]  = useState(false);
  const [showVending, setShowVending] = useState(false);
  const [showShare,   setShowShare]   = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success'|'error'|'info' } | null>(null);

  const { playTrack, togglePlay } = useMusicPlayer();
  const { addToCollection }       = useCollection();
  const { dustLevel, cleanRoom, dustParticleCount } = useDustSystem();
  const { lps }         = useCollectionStore();
  const { coinBalance } = useRoomStore();

  const handleAddFromSearch = async (track: MusicTrack) => {
    const lp = await addToCollection(track);
    if (lp) {
      setToast({ msg: `"${track.title}" LP에 담았어요`, type: 'success' });
      await playTrack(track);
    }
    setShowSearch(false);
  };

  const handleVendingAdd = async (track: MusicTrack) => {
    const lp = await addToCollection(track);
    if (lp) setToast({ msg: `"${track.title}" 뽑았어요!`, type: 'success' });
  };

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <VinylShopScene
          lps={lps}
          onPlayTrack={(track) => playTrack(track as any)}
          dustParticleCount={dustParticleCount}
          onOpenSearch={() => setShowSearch(true)}
          onOpenVending={() => setShowVending(true)}
          onShare={() => setShowShare(true)}
          coinBalance={coinBalance}
          onOpenCollection={() => router.push('/collection')}
        />
      </View>

      <View
        style={[
          StyleSheet.absoluteFill,
          Platform.OS === 'web'
            ? undefined
            : { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 8) },
        ]}
        pointerEvents="box-none"
      >
        <NowPlayingHUD
          onTogglePlay={togglePlay}
          dustLevel={dustLevel}
          onCleanRoom={cleanRoom}
        />
      </View>

      {/* ── 모달 ── */}
      <MusicSearch
        visible={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectTrack={handleAddFromSearch}
      />
      <VendingMachine
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
});
