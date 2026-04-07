import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useCollectionStore } from '../../stores/collectionStore';
import { useRoomStore } from '../../stores/roomStore';
import { ShareCard } from '../../components/share/ShareCard';
import { CopperButton } from '../../components/ui/CopperButton';
import { colors } from '../../lib/constants';

export default function ProfileScreen() {
  const [showShare, setShowShare] = useState(false);
  const { lps } = useCollectionStore();
  const { dustLevel, coinBalance } = useRoomStore();

  const damagedCount = lps.filter(l => l.isDamaged).length;
  const deezerCount  = lps.filter(l => l.source === 'deezer').length;
  const itunesCount  = lps.filter(l => l.source === 'itunes').length;

  const stats = [
    { label: 'TOTAL LPs',    value: String(lps.length) },
    { label: 'COINS',        value: String(coinBalance) },
    { label: 'DUST LEVEL',   value: `${dustLevel}%` },
    { label: 'DAMAGED',      value: String(damagedCount) },
    { label: 'DEEZER',       value: String(deezerCount) },
    { label: 'ITUNES',       value: String(itunesCount) },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 헤더 */}
      <View style={styles.heroCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>VI</Text>
        </View>
        <View>
          <Text style={styles.username}>GUEST</Text>
          <Text style={styles.userSub}>VINYL COLLECTOR · 로컬 모드</Text>
          <Text style={styles.localNote}>컬렉션은 이 기기에 저장됩니다</Text>
        </View>
      </View>

      {/* 통계 */}
      <View style={styles.statsGrid}>
        {stats.map(({ label, value }) => (
          <View key={label} style={styles.statCard}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* 데이터 소스 안내 */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>MUSIC SOURCES</Text>
        <Text style={styles.infoItem}>🟠 Deezer — 무료 공개 API, 30초 미리듣기</Text>
        <Text style={styles.infoItem}>🍎 iTunes — Apple 공개 API, 30초 미리듣기</Text>
        <Text style={styles.infoNote}>
          로그인 없이 음악 검색 · 미리듣기 · 컬렉션 저장이 모두 가능합니다.
        </Text>
      </View>

      {/* 액션 */}
      <View style={styles.actions}>
        <CopperButton
          label="SHARE MY ROOM"
          onPress={() => setShowShare(true)}
          style={styles.btn}
        />
      </View>

      <ShareCard visible={showShare} onClose={() => setShowShare(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingTop: 60, gap: 18 },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.copper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.bg, fontSize: 22, fontWeight: '900' },
  username: { color: colors.cream, fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  userSub: { color: colors.muted, fontSize: 10, letterSpacing: 2, marginTop: 2 },
  localNote: { color: colors.copper, fontSize: 10, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.shelf,
    borderRadius: 8,
    padding: 14,
    minWidth: '30%',
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statValue: { color: colors.copper, fontSize: 22, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 8, letterSpacing: 2 },
  infoCard: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.shelf,
    borderRadius: 8,
    padding: 14,
    gap: 6,
  },
  infoTitle: { color: colors.copper, fontSize: 10, letterSpacing: 2.5, marginBottom: 4 },
  infoItem: { color: colors.cream, fontSize: 12 },
  infoNote: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  actions: { gap: 10 },
  btn: { width: '100%', paddingVertical: 14 },
});
