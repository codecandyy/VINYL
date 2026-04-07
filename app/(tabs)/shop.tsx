import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoomStore } from '../../stores/roomStore';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { colors } from '../../lib/constants';
import { CopperButton } from '../../components/ui/CopperButton';

const COIN_PACKAGES = [
  { id: 'coin_5',  coins: 5,  price: '₩1,100', popular: false },
  { id: 'coin_12', coins: 12, price: '₩2,200', popular: true  },
  { id: 'coin_30', coins: 30, price: '₩4,400', popular: false },
];

export default function ShopScreen() {
  const { coinBalance, setCoinBalance } = useRoomStore();
  const { userId } = useAuthStore();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (pkg: (typeof COIN_PACKAGES)[0]) => {
    // 실제 결제: 토스페이먼츠 연동 필요
    // 현재는 시뮬레이션
    Alert.alert(
      '코인 구매',
      `${pkg.coins}코인을 ${pkg.price}에 구매할까요?\n(결제 연동 준비 중)`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '구매',
          onPress: async () => {
            setPurchasing(pkg.id);
            // 임시: 직접 코인 추가
            const newBalance = coinBalance + pkg.coins;
            setCoinBalance(newBalance);
            if (userId) {
              try {
                await supabase
                  .from('room_state')
                  .update({ coin_balance: newBalance })
                  .eq('user_id', userId);
                await supabase.from('coin_transactions').insert({
                  user_id: userId,
                  amount: pkg.coins,
                  reason: 'purchase',
                });
              } catch {}
            }
            setPurchasing(null);
            Alert.alert('완료', `${pkg.coins}코인이 추가되었습니다!`);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>COIN SHOP</Text>

      {/* 현재 코인 잔액 */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
        <Text style={styles.balanceValue}>{coinBalance}</Text>
        <Text style={styles.balanceSub}>COINS</Text>
      </View>

      {/* 코인 사용처 안내 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>COIN USES</Text>
        {[
          { icon: '🎰', title: 'LP Vending', desc: '장르 추천 LP 뽑기 (1코인)' },
          { icon: '🎨', title: 'Custom Label', desc: 'LP 라벨 커스터마이징 (2코인)' },
          { icon: '🔧', title: 'Repair LP', desc: '손상된 LP 복원 (3코인)' },
        ].map(({ icon, title, desc }) => (
          <View key={title} style={styles.useRow}>
            <Text style={styles.useIcon}>{icon}</Text>
            <View>
              <Text style={styles.useTitle}>{title}</Text>
              <Text style={styles.useDesc}>{desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 코인 패키지 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BUY COINS</Text>
        {COIN_PACKAGES.map((pkg) => (
          <TouchableOpacity
            key={pkg.id}
            style={[styles.packageCard, pkg.popular && styles.packageCardPopular]}
            onPress={() => handlePurchase(pkg)}
          >
            {pkg.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>BEST</Text>
              </View>
            )}
            <View style={styles.packageInfo}>
              <Text style={styles.packageCoins}>{pkg.coins}</Text>
              <Text style={styles.packageCoinLabel}>COINS</Text>
            </View>
            <Text style={styles.packagePrice}>{pkg.price}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.disclaimer}>
        결제는 토스페이먼츠를 통해 안전하게 처리됩니다.{'\n'}
        환불 정책: 미사용 코인 구매 후 7일 이내 환불 가능
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    gap: 20,
  },
  title: {
    color: colors.copper,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
  },
  balanceCard: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.copper,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 4,
  },
  balanceLabel: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 2.5,
  },
  balanceValue: {
    color: colors.gold,
    fontSize: 56,
    fontWeight: '900',
    lineHeight: 64,
  },
  balanceSub: {
    color: colors.copper,
    fontSize: 12,
    letterSpacing: 3,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  useRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.shelf,
    borderRadius: 8,
    padding: 12,
  },
  useIcon: { fontSize: 22 },
  useTitle: {
    color: colors.cream,
    fontSize: 13,
    fontWeight: '600',
  },
  useDesc: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  packageCard: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.shelf,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packageCardPopular: {
    borderColor: colors.copper,
    backgroundColor: `${colors.copper}15`,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: colors.copper,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  popularText: {
    color: colors.bg,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  packageInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  packageCoins: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: '900',
  },
  packageCoinLabel: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  packagePrice: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    color: colors.muted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
  },
});
