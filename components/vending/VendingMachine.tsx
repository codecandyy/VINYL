import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { musicApi, MusicTrack } from '../../lib/music';
import { useRoomStore } from '../../stores/roomStore';
import { colors } from '../../lib/constants';
import { CopperButton } from '../ui/CopperButton';

const GENRES = [
  'jazz', 'rock', 'pop', 'classical', 'hip-hop',
  'electronic', 'r-n-b', 'soul', 'blues', 'folk',
  'indie', 'metal', 'latin', 'reggae', 'country',
];

type Phase = 'select' | 'spinning' | 'result';

type Props = {
  visible: boolean;
  onClose: () => void;
  onAddTrack: (track: MusicTrack) => Promise<void>;
};

export function VendingMachine({ visible, onClose, onAddTrack }: Props) {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('select');
  const [result, setResult] = useState<MusicTrack | null>(null);
  const { coinBalance, setCoinBalance } = useRoomStore();

  const handleSpin = useCallback(async () => {
    if (!selectedGenre || coinBalance < 1) return;
    setPhase('spinning');
    setCoinBalance(coinBalance - 1);

    try {
      const track = await musicApi.getRecommendation(selectedGenre);
      if (track) {
        setResult(track);
        setPhase('result');
      } else {
        setPhase('select');
      }
    } catch {
      setPhase('select');
    }
  }, [selectedGenre, coinBalance, setCoinBalance]);

  const handleAdd = async () => {
    if (!result) return;
    await onAddTrack(result);
    handleClose();
  };

  const handleClose = () => {
    setPhase('select');
    setResult(null);
    setSelectedGenre(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.machine}>
          {/* 헤더 */}
          <View style={styles.machineTop}>
            <Text style={styles.machineTitle}>LP VENDING</Text>
            <Text style={styles.coinCount}>🪙 {coinBalance}</Text>
          </View>
          <Text style={styles.powered}>Powered by Deezer · iTunes</Text>

          {/* 디스플레이 */}
          <View style={styles.display}>
            {phase === 'select' && (
              <>
                <Text style={styles.displayText}>SELECT GENRE</Text>
                <Text style={styles.displaySub}>1 COIN / SPIN</Text>
                {coinBalance < 1 && (
                  <Text style={styles.noCoinText}>코인 없음 · Shop에서 충전하세요</Text>
                )}
              </>
            )}
            {phase === 'spinning' && (
              <>
                <ActivityIndicator color={colors.copper} size="large" />
                <Text style={styles.displayText}>SEARCHING...</Text>
                <Text style={styles.displaySub}>{selectedGenre?.toUpperCase()}</Text>
              </>
            )}
            {phase === 'result' && result && (
              <>
                {result.artworkUrl ? (
                  <Image source={{ uri: result.artworkUrl }} style={styles.resultArt} />
                ) : (
                  <View style={[styles.resultArt, { backgroundColor: colors.bg3 }]} />
                )}
                <Text style={styles.resultTrack} numberOfLines={2}>{result.title}</Text>
                <Text style={styles.resultArtist} numberOfLines={1}>{result.artist}</Text>
                <View style={styles.previewRow}>
                  {result.previewUrl ? (
                    <Text style={styles.previewOk}>▶ 30초 미리듣기 있음</Text>
                  ) : (
                    <Text style={styles.previewNone}>미리듣기 없음</Text>
                  )}
                </View>
              </>
            )}
          </View>

          {/* 장르 선택 */}
          {phase === 'select' && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.genreScroll}
              contentContainerStyle={styles.genreContent}
            >
              {GENRES.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, selectedGenre === g && styles.chipActive]}
                  onPress={() => setSelectedGenre(g)}
                >
                  <Text style={[styles.chipText, selectedGenre === g && styles.chipTextActive]}>
                    {g.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* 액션 */}
          <View style={styles.actions}>
            {phase === 'select' && (
              <>
                <CopperButton
                  label="SPIN"
                  onPress={handleSpin}
                  disabled={!selectedGenre || coinBalance < 1}
                  style={{ flex: 1 }}
                />
                <CopperButton label="CANCEL" onPress={handleClose} variant="outline" style={{ flex: 1 }} />
              </>
            )}
            {phase === 'result' && (
              <>
                <CopperButton label="ADD TO COLLECTION" onPress={handleAdd} style={{ flex: 1 }} />
                <CopperButton label="SKIP" onPress={handleClose} variant="outline" style={{ flex: 1 }} />
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  machine: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.copper,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    gap: 14,
  },
  machineTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  machineTitle: { color: colors.copper, fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  coinCount: { color: colors.gold, fontSize: 14, letterSpacing: 1.5 },
  powered: { color: colors.muted, fontSize: 9, letterSpacing: 1.5, marginTop: -8 },
  display: {
    backgroundColor: '#0A0A0A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.shelf,
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
    gap: 6,
  },
  displayText: { color: colors.copper, fontSize: 16, letterSpacing: 2, fontWeight: '700' },
  displaySub: { color: colors.muted, fontSize: 10, letterSpacing: 2 },
  noCoinText: { color: colors.red, fontSize: 10, marginTop: 4 },
  resultArt: { width: 80, height: 80, borderRadius: 4, marginBottom: 4 },
  resultTrack: { color: colors.cream, fontSize: 14, fontWeight: '600', textAlign: 'center', maxWidth: 260 },
  resultArtist: { color: colors.muted, fontSize: 12, maxWidth: 260, textAlign: 'center' },
  previewRow: { marginTop: 4 },
  previewOk: { color: colors.copper, fontSize: 10, letterSpacing: 1 },
  previewNone: { color: colors.muted, fontSize: 10 },
  genreScroll: { flexGrow: 0 },
  genreContent: { gap: 7, paddingHorizontal: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.shelf,
    backgroundColor: colors.bg3,
  },
  chipActive: { borderColor: colors.copper, backgroundColor: `${colors.copper}25` },
  chipText: { color: colors.muted, fontSize: 10, letterSpacing: 1.5 },
  chipTextActive: { color: colors.copper },
  actions: { flexDirection: 'row', gap: 10 },
});
