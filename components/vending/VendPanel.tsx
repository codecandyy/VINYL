import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Image, Animated, Easing, ScrollView,
} from 'react-native';
import { musicApi, MusicTrack } from '../../lib/music';
import { useRoomStore } from '../../stores/roomStore';
import { colors } from '../../lib/constants';

// 장르 목록
const GENRES = [
  'jazz', 'rock', 'pop', 'soul', 'blues',
  'classical', 'hip-hop', 'electronic', 'r-n-b', 'indie',
  'folk', 'metal', 'latin', 'reggae', 'country',
];

// 뽑기 릴에 표시되는 색깔들 (슬롯머신 느낌)
const REEL_COLORS = [
  '#E74C3C', '#3498DB', '#2ECC71', '#F39C12',
  '#9B59B6', '#1ABC9C', '#E67E22', '#16A085',
];

type Phase = 'idle' | 'spinning' | 'result';

type Props = {
  visible: boolean;
  onClose: () => void;
  onAddTrack: (track: MusicTrack) => Promise<void>;
};

export function VendPanel({ visible, onClose, onAddTrack }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<MusicTrack | null>(null);
  const [colorIdx, setColorIdx] = useState(0);
  const { coinBalance, setCoinBalance } = useRoomStore();

  // 릴 스핀 애니메이션
  const spinAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const reelInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
      setPhase('idle');
      setResult(null);
    }
  }, [visible]);

  const startSpin = useCallback(async () => {
    if (coinBalance < 1) return;
    setCoinBalance(coinBalance - 1);
    setPhase('spinning');

    // 릴 색깔 빠르게 순환
    reelInterval.current = setInterval(() => {
      setColorIdx((i) => (i + 1) % REEL_COLORS.length);
    }, 80);

    // 릴 rotation 애니메이션
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    try {
      const randomGenre = GENRES[Math.floor(Math.random() * GENRES.length)];
      const track = await musicApi.getRecommendation(randomGenre);

      // 최소 1.5초 스핀 보장 (게임 느낌)
      await new Promise((r) => setTimeout(r, 1500));

      if (reelInterval.current) clearInterval(reelInterval.current);
      spinAnim.stopAnimation();
      spinAnim.setValue(0);

      if (track) {
        setResult(track);
        setPhase('result');
      } else {
        setPhase('idle');
      }
    } catch {
      if (reelInterval.current) clearInterval(reelInterval.current);
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
      // 코인 환불
      setCoinBalance(coinBalance);
      setPhase('idle');
    }
  }, [coinBalance, setCoinBalance]);

  const handleAdd = async () => {
    if (!result) return;
    await onAddTrack(result);
    handleClose();
  };

  const handleSkip = () => {
    setPhase('idle');
    setResult(null);
  };

  const handleClose = () => {
    if (reelInterval.current) clearInterval(reelInterval.current);
    setPhase('idle');
    setResult(null);
    onClose();
  };

  const spinRotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} />

        <Animated.View style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}>
          {/* ── 머신 헤더 ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.machineName}>LP GACHA</Text>
              <Text style={styles.machineNameKr}>취향 뽑기 자판기</Text>
            </View>
            <View style={styles.coinBadge}>
              <Text style={styles.coinIcon}>🪙</Text>
              <Text style={styles.coinCount}>{coinBalance}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── 취향 분석 배너 ── */}
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              🎯 당신의 컬렉션 취향을 분석해 LP를 추천해 드려요
            </Text>
            <Text style={styles.bannerSub}>AI 개인화 분석 기능 준비 중 · 현재는 큐레이션 랜덤 추천</Text>
          </View>

          {/* ── 디스플레이 창 ── */}
          <View style={styles.display}>
            {phase === 'idle' && (
              <View style={styles.displayIdle}>
                {/* 슬롯머신 릴 (정지 상태) */}
                <View style={styles.reelRow}>
                  {REEL_COLORS.slice(0, 3).map((c, i) => (
                    <View key={i} style={[styles.reelCell, { backgroundColor: c }]}>
                      <Text style={styles.reelEmoji}>🎵</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.idleTitle}>INSERT COIN</Text>
                <Text style={styles.idleSub}>1코인으로 LP 1장 뽑기</Text>
                {coinBalance < 1 && (
                  <View style={styles.noCoinWrap}>
                    <Text style={styles.noCoinText}>코인이 없습니다 — Shop 탭에서 충전하세요</Text>
                  </View>
                )}
              </View>
            )}

            {phase === 'spinning' && (
              <View style={styles.displaySpin}>
                {/* 돌아가는 릴 */}
                <View style={styles.reelRow}>
                  {[0, 1, 2].map((i) => (
                    <Animated.View
                      key={i}
                      style={[
                        styles.reelCell,
                        {
                          backgroundColor: REEL_COLORS[(colorIdx + i) % REEL_COLORS.length],
                          transform: [{ rotate: i === 1 ? spinRotate : '0deg' }],
                        },
                      ]}
                    >
                      <Text style={styles.reelEmoji}>🎵</Text>
                    </Animated.View>
                  ))}
                </View>
                <Text style={styles.spinText}>ANALYZING...</Text>
                <Text style={styles.spinSub}>취향 분석 중</Text>
              </View>
            )}

            {phase === 'result' && result && (
              <View style={styles.displayResult}>
                <View style={styles.resultCard}>
                  {result.artworkUrl ? (
                    <Image source={{ uri: result.artworkUrl }} style={styles.artwork} />
                  ) : (
                    <View style={[styles.artwork, styles.artworkPlaceholder]}>
                      <Text style={styles.artworkEmoji}>🎵</Text>
                    </View>
                  )}
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultTitle} numberOfLines={2}>{result.title}</Text>
                    <Text style={styles.resultArtist} numberOfLines={1}>{result.artist}</Text>
                    <Text style={styles.resultAlbum} numberOfLines={1}>{result.album}</Text>
                    <View style={styles.resultMeta}>
                      <View style={[styles.sourceBadge, { backgroundColor: result.source === 'deezer' ? '#A239CA' : '#C0392B' }]}>
                        <Text style={styles.sourceBadgeText}>{result.source === 'deezer' ? 'DEEZER' : 'iTUNES'}</Text>
                      </View>
                      {result.previewUrl && (
                        <View style={styles.previewBadge}>
                          <Text style={styles.previewBadgeText}>▶ 30초</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* ── 액션 버튼 ── */}
          <View style={styles.actions}>
            {phase === 'idle' && (
              <TouchableOpacity
                style={[styles.vendBtn, coinBalance < 1 && styles.vendBtnDisabled]}
                onPress={startSpin}
                disabled={coinBalance < 1}
                activeOpacity={0.8}
              >
                <Text style={styles.vendBtnIcon}>🎰</Text>
                <Text style={styles.vendBtnText}>VEND</Text>
                <Text style={styles.vendBtnCost}>1 COIN</Text>
              </TouchableOpacity>
            )}

            {phase === 'result' && (
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
                  <Text style={styles.addBtnText}>+ 컬렉션에 담기</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.8}>
                  <Text style={styles.skipBtnText}>다시 뽑기 (1코인)</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#1C0F00',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.copper,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    gap: 14,
  },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLeft: { flex: 1 },
  machineName: { color: colors.copper, fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  machineNameKr: { color: colors.muted, fontSize: 11, letterSpacing: 1, marginTop: 1 },
  coinBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#261500', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.gold,
  },
  coinIcon: { fontSize: 14 },
  coinCount: { color: colors.gold, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  closeBtn: { padding: 6 },
  closeBtnText: { color: colors.muted, fontSize: 18 },

  // Banner
  banner: {
    backgroundColor: '#261500',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#5A3010',
    padding: 10,
    gap: 3,
  },
  bannerText: { color: colors.cream, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  bannerSub: { color: colors.muted, fontSize: 10, letterSpacing: 0.5 },

  // Display
  display: {
    backgroundColor: '#0A0A0A',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2A4A2A',
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  displayIdle: { alignItems: 'center', gap: 10, padding: 20 },
  displaySpin: { alignItems: 'center', gap: 10, padding: 20 },
  displayResult: { width: '100%', padding: 16 },

  // Reel
  reelRow: { flexDirection: 'row', gap: 6, marginBottom: 4 },
  reelCell: {
    width: 56, height: 56, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
  },
  reelEmoji: { fontSize: 24 },

  // Idle
  idleTitle: { color: '#00FF55', fontSize: 18, fontWeight: '900', letterSpacing: 3, fontFamily: 'monospace' },
  idleSub: { color: '#4A8A4A', fontSize: 11, letterSpacing: 1.5 },
  noCoinWrap: { marginTop: 6, backgroundColor: '#3A0000', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 },
  noCoinText: { color: colors.red, fontSize: 11, textAlign: 'center' },

  // Spinning
  spinText: { color: '#00FF55', fontSize: 16, fontWeight: '900', letterSpacing: 3, fontFamily: 'monospace' },
  spinSub: { color: '#4A8A4A', fontSize: 11, letterSpacing: 1 },

  // Result
  resultCard: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  artwork: { width: 90, height: 90, borderRadius: 6 },
  artworkPlaceholder: { backgroundColor: '#1A0A00', alignItems: 'center', justifyContent: 'center' },
  artworkEmoji: { fontSize: 36 },
  resultInfo: { flex: 1, gap: 4 },
  resultTitle: { color: colors.cream, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  resultArtist: { color: colors.copper, fontSize: 13 },
  resultAlbum: { color: colors.muted, fontSize: 11 },
  resultMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
  sourceBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  sourceBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  previewBadge: { backgroundColor: '#1A3A1A', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#2A6A2A' },
  previewBadgeText: { color: '#4AFF4A', fontSize: 9, letterSpacing: 0.5 },

  // Actions
  actions: { marginTop: 2 },
  vendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.copper, borderRadius: 12, paddingVertical: 16,
    shadowColor: colors.copper, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
    elevation: 8,
  },
  vendBtnDisabled: { backgroundColor: '#3A2210', shadowOpacity: 0 },
  vendBtnIcon: { fontSize: 22 },
  vendBtnText: { color: '#1A0800', fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  vendBtnCost: { color: '#1A0800', fontSize: 12, fontWeight: '600', opacity: 0.7 },

  resultActions: { gap: 10 },
  addBtn: {
    backgroundColor: colors.copper, borderRadius: 10, paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnText: { color: '#1A0800', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  skipBtn: {
    backgroundColor: 'transparent', borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#3A2010',
  },
  skipBtnText: { color: colors.muted, fontSize: 13 },
});
