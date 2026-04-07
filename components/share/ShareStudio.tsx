import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Share,
  Platform,
  ScrollView,
  Pressable,
  LayoutChangeEvent,
  GestureResponderEvent,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import ViewShot from 'react-native-view-shot';
import { usePlayerStore } from '../../stores/playerStore';
import { colors } from '../../lib/constants';
import { CopperButton } from '../ui/CopperButton';

type ThemeId = 'dark-wax' | 'riso-red' | 'dusty-milk' | 'midnight' | 'vintage-poster';

type ThemeSpec = {
  id: ThemeId;
  label: string;
  labelKo: string;
  bg: string;
  accent: string;
  text: string;
  vinylOverlay: string;
  grooveBorder: string;
  pickerSwatch: string;
  pickerDot: string;
};

const THEMES: ThemeSpec[] = [
  {
    id: 'dark-wax',
    label: 'DARK WAX',
    labelKo: '검정+골드',
    bg: '#1a0f00',
    accent: '#c9a84c',
    text: '#f5e6c8',
    vinylOverlay: 'rgba(0,0,0,0.52)',
    grooveBorder: 'rgba(0,0,0,0.55)',
    pickerSwatch: '#1a0f00',
    pickerDot: '#c9a84c',
  },
  {
    id: 'riso-red',
    label: 'RISO RED',
    labelKo: '라 하우스 페리아 느낌',
    bg: '#c41e1e',
    accent: '#f5e6c8',
    text: '#1a0a0a',
    vinylOverlay: 'rgba(0,0,0,0.42)',
    grooveBorder: 'rgba(0,0,0,0.35)',
    pickerSwatch: '#c41e1e',
    pickerDot: '#f5e6c8',
  },
  {
    id: 'dusty-milk',
    label: 'DUSTY MILK',
    labelKo: '크림',
    bg: '#e8e4d8',
    accent: '#5c3d2e',
    text: '#2a1810',
    vinylOverlay: 'rgba(0,0,0,0.32)',
    grooveBorder: 'rgba(44,24,16,0.35)',
    pickerSwatch: '#e8e4d8',
    pickerDot: '#5c3d2e',
  },
  {
    id: 'midnight',
    label: 'MIDNIGHT',
    labelKo: '미드나이트 블루',
    bg: '#0d1b2a',
    accent: '#90caf9',
    text: '#e3f2fd',
    vinylOverlay: 'rgba(0,0,0,0.48)',
    grooveBorder: 'rgba(0,0,0,0.45)',
    pickerSwatch: '#0d1b2a',
    pickerDot: '#90caf9',
  },
  {
    id: 'vintage-poster',
    label: 'VINTAGE POSTER',
    labelKo: '포스터',
    bg: '#f0e6d8',
    accent: '#1a0f00',
    text: '#1a0f00',
    vinylOverlay: 'rgba(0,0,0,0.38)',
    grooveBorder: 'rgba(26,15,0,0.4)',
    pickerSwatch: '#f0e6d8',
    pickerDot: '#1a0f00',
  },
];

const GROOVE_SCALES = [0.93, 0.86, 0.79, 0.72, 0.65, 0.58, 0.51, 0.44];

const PREVIEW_W = 288;

type Props = {
  visible: boolean;
  onClose: () => void;
};

function Barcode({ color }: { color: string }) {
  const pattern = [2, 1, 3, 1, 2, 2, 1, 4, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2];
  return (
    <View style={styles.barcodeRow}>
      {pattern.map((w, i) => (
        <View key={i} style={[styles.bar, { width: w, backgroundColor: color }]} />
      ))}
    </View>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const [trackW, setTrackW] = useState(1);
  const norm = (value - min) / (max - min);

  const setFromEvent = (e: GestureResponderEvent) => {
    const x = e.nativeEvent.locationX;
    if (trackW < 1) return;
    const n = Math.round(min + Math.max(0, Math.min(1, x / trackW)) * (max - min));
    onChange(n);
  };

  return (
    <View style={styles.sliderBlock}>
      <View style={styles.sliderLabelRow}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={styles.sliderValue}>{value}</Text>
      </View>
      <Pressable
        style={styles.sliderTrack}
        onLayout={(e: LayoutChangeEvent) => setTrackW(e.nativeEvent.layout.width)}
        onPress={setFromEvent}
        onPressIn={setFromEvent}
      >
        <View style={[styles.sliderFill, { width: `${Math.round(norm * 100)}%` }]} />
      </Pressable>
    </View>
  );
}

function buildDevPrompt(params: {
  theme: ThemeSpec;
  lpSize: number;
  titleSize: number;
  showLp: boolean;
  showGrooves: boolean;
  showBarcode: boolean;
  showEngraving: boolean;
  trackTitle: string;
  trackArtist: string;
}): string {
  const {
    theme,
    lpSize,
    titleSize,
    showLp,
    showGrooves,
    showBarcode,
    showEngraving,
    trackTitle,
    trackArtist,
  } = params;
  const year = new Date().getFullYear();

  return `=== VINYL SHARE CARD — DESIGN PROMPT ===

[THEME] ${theme.label} (${theme.labelKo})
[THEME_ID] ${theme.id}
[BG COLOR] ${theme.bg}
[PRIMARY ACCENT] ${theme.accent}
[TEXT COLOR] ${theme.text}

[VISUAL ELEMENTS]
- LP 판: ${showLp ? 'ON' : 'OFF'} — 직경 화면 너비의 ${lpSize}%, 실제 앨범커버를 원형으로 클리핑, 비닐 다크 오버레이. 중앙에 포인트컬러 레이블 원형 + "VINYL" + "33⅓ RPM" 인쇄
- 비닐 홈(groove lines): ${showGrooves ? 'ON' : 'OFF'} — 동심원 6~8겹, 배경보다 어두운 색, opacity ~0.7
- 바코드: ${showBarcode ? 'ON' : 'OFF'} — 우하단 영역, 빈티지 레코드 관리번호 느낌
- 각인 텍스트: ${showEngraving ? 'ON' : 'OFF'} — "33⅓ RPM · SIDE A · ${year}" monospace, 하단

[TYPOGRAPHY]
- 곡명: Georgia(또는 시스템 serif) bold, ${titleSize}px 기준, letter-spacing 넓게, ALL CAPS
- 아티스트: monospace, 11px 전후, letter-spacing 2~3px, 포인트컬러
- 브랜드/URL: monospace tiny, 포인트컬러 흐리게

[CURRENT SAMPLE]
- Title: ${trackTitle || '(none)'}
- Artist: ${trackArtist || '(none)'}

[LAYOUT FLOW]
1. 상단: (테마별) 장식선 또는 대형 배경 타이포
2. 중앙 큰 영역: LP 판 (앨범커버 클리핑) + 비닐 홈 레이어
3. 구분선
4. 하단: 곡명 (대형 serif) → 아티스트명
5. 푸터: VINYL 브랜드 + URL + 바코드/각인

[INSTAGRAM STORY 최적화]
- 비율 9:16 (1080×1920px 기준)
- Safe zone: 상하 250px 여백 권장
- LP 판 직경: 화면 너비의 70~75% (슬라이더로 ${lpSize}% 지정)
- 인쇄/risograph 텍스처: grain overlay opacity 0.04~0.08 권장

[SHARE FLOW]
- 테마 선택 (5종) → LP 크기/타이포 슬라이더 → 미리보기 → 저장/공유
- "내 방 공유" → 이 카드 생성 → 인스타 스토리 저장
`;
}

export function ShareStudio({ visible, onClose }: Props) {
  const { currentTrack } = usePlayerStore();
  const shotRef = useRef<ViewShot>(null);
  const [themeId, setThemeId] = useState<ThemeId>('dark-wax');
  const [lpSize, setLpSize] = useState(90);
  const [titleSize, setTitleSize] = useState(26);
  const [showLp, setShowLp] = useState(true);
  const [showGrooves, setShowGrooves] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showEngraving, setShowEngraving] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [copying, setCopying] = useState(false);

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const innerPad = 16;
  const maxLp = PREVIEW_W - innerPad * 2;
  const lpDiameter = Math.round((lpSize / 100) * maxLp);

  const devPrompt = useMemo(
    () =>
      buildDevPrompt({
        theme,
        lpSize,
        titleSize,
        showLp,
        showGrooves,
        showBarcode,
        showEngraving,
        trackTitle: currentTrack?.title ?? '',
        trackArtist: currentTrack?.artist ?? '',
      }),
    [theme, lpSize, titleSize, showLp, showGrooves, showBarcode, showEngraving, currentTrack]
  );

  const handleCopyPrompt = useCallback(async () => {
    setCopying(true);
    try {
      await Clipboard.setStringAsync(devPrompt);
      if (Platform.OS === 'web') {
        Alert.alert('Copied', '개발자용 프롬프트가 클립보드에 복사되었습니다.');
      } else {
        Alert.alert('복사됨', '개발자용 프롬프트가 클립보드에 복사되었습니다.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', '복사에 실패했습니다.');
    } finally {
      setCopying(false);
    }
  }, [devPrompt]);

  const handleShare = async () => {
    if (!shotRef.current) return;
    setSharing(true);
    try {
      const uri = await (shotRef.current as any).capture();
      if (Platform.OS === 'web') {
        const blob = await fetch(uri).then((r) => r.blob());
        const file = new File([blob], 'vinyl-share-card.png', { type: 'image/png' });
        await (navigator as any).share?.({ files: [file], title: 'VINYL Share Card' });
      } else {
        await Share.share({ url: uri, message: 'VINYL Share Card 🎵' });
      }
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setSharing(false);
    }
  };

  const titleDisplay = (currentTrack?.title ?? 'NO TRACK').toUpperCase();
  const year = new Date().getFullYear();

  const toggle = (active: boolean) => ({
    borderColor: active ? theme.accent : 'rgba(245,230,200,0.25)',
    backgroundColor: active ? 'rgba(201,168,76,0.12)' : 'transparent',
  });

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <Text style={styles.headerLeft}>VINYL — SHARE STUDIO</Text>
              <Text style={styles.headerRight}>RETRO CARD BUILDER</Text>
            </View>

            <Text style={styles.sectionTag}>01 — THEME PICK</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeScroll}>
              {THEMES.map((t) => {
                const sel = t.id === themeId;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.themeChip,
                      { borderColor: sel ? t.accent : 'rgba(245,230,200,0.2)' },
                    ]}
                    onPress={() => setThemeId(t.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.themeSwatch, { backgroundColor: t.pickerSwatch }]}>
                      <View style={[styles.themeDot, { backgroundColor: t.pickerDot }]} />
                    </View>
                    <Text style={[styles.themeLabel, { color: colors.cream }]} numberOfLines={2}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionTag}>02 — LIVE PREVIEW</Text>
            <View style={styles.previewWrap}>
              <ViewShot ref={shotRef} options={{ format: 'png', quality: 0.95 }}>
                <View
                  style={[
                    styles.storyCard,
                    {
                      width: PREVIEW_W,
                      aspectRatio: 9 / 16,
                      backgroundColor: theme.bg,
                    },
                  ]}
                >
                  <View style={[styles.grain, { opacity: 0.06 }]} pointerEvents="none" />
                  <View style={{ paddingHorizontal: innerPad, paddingTop: 20, flex: 1 }}>
                    <View style={[styles.topRule, { backgroundColor: theme.accent, opacity: 0.35 }]} />
                    <View style={styles.lpArea}>
                      {showLp ? (
                        <View
                          style={[
                            styles.lpDisc,
                            {
                              width: lpDiameter,
                              height: lpDiameter,
                              borderRadius: lpDiameter / 2,
                            },
                          ]}
                        >
                          {currentTrack?.artworkUrl ? (
                            <Image
                              source={{ uri: currentTrack.artworkUrl }}
                              style={{
                                position: 'absolute',
                                width: lpDiameter,
                                height: lpDiameter,
                                borderRadius: lpDiameter / 2,
                              }}
                            />
                          ) : (
                            <View
                              style={[
                                styles.lpPlaceholder,
                                {
                                  width: lpDiameter,
                                  height: lpDiameter,
                                  borderRadius: lpDiameter / 2,
                                  backgroundColor: 'rgba(0,0,0,0.25)',
                                },
                              ]}
                            />
                          )}
                          <View
                            style={[
                              StyleSheet.absoluteFillObject,
                              {
                                borderRadius: lpDiameter / 2,
                                backgroundColor: theme.vinylOverlay,
                              },
                            ]}
                          />
                          {showGrooves && (
                            <View
                              style={[
                                StyleSheet.absoluteFillObject,
                                { borderRadius: lpDiameter / 2, overflow: 'hidden' },
                              ]}
                              pointerEvents="none"
                            >
                              {GROOVE_SCALES.map((s, i) => {
                                const d = lpDiameter * s;
                                return (
                                  <View
                                    key={i}
                                    style={{
                                      position: 'absolute',
                                      left: (lpDiameter - d) / 2,
                                      top: (lpDiameter - d) / 2,
                                      width: d,
                                      height: d,
                                      borderRadius: d / 2,
                                      borderWidth: StyleSheet.hairlineWidth * 2,
                                      borderColor: theme.grooveBorder,
                                      opacity: 0.72,
                                    }}
                                  />
                                );
                              })}
                            </View>
                          )}
                          <View
                            style={[
                              styles.centerLabel,
                              {
                                width: lpDiameter * 0.22,
                                height: lpDiameter * 0.22,
                                borderRadius: (lpDiameter * 0.22) / 2,
                                backgroundColor: theme.accent,
                              },
                            ]}
                          >
                            <Text style={[styles.centerLabelTxt, { color: theme.bg }]}>VINYL</Text>
                            <Text style={[styles.centerLabelSub, { color: theme.bg }]}>33⅓</Text>
                          </View>
                        </View>
                      ) : (
                        <Text style={[styles.lpOffHint, { color: theme.text, opacity: 0.45 }]}>
                          LP 판 숨김
                        </Text>
                      )}
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.accent, opacity: 0.25 }]} />

                    <Text
                      style={[
                        styles.cardTitle,
                        {
                          color: theme.text,
                          fontSize: titleSize,
                          fontFamily: Platform.select({
                            ios: 'Georgia',
                            android: 'serif',
                            default: 'Georgia, Times New Roman, serif',
                          }),
                        },
                      ]}
                      numberOfLines={3}
                    >
                      {titleDisplay}
                    </Text>
                    <Text style={[styles.cardArtist, { color: theme.accent }]} numberOfLines={2}>
                      {(currentTrack?.artist ?? '—').toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.footerRow}>
                    <View style={{ flex: 1, gap: 4 }}>
                      {showEngraving && (
                        <Text style={[styles.engrave, { color: theme.text, opacity: 0.85 }]}>
                          33⅓ RPM · SIDE A · {year}
                        </Text>
                      )}
                      <Text style={[styles.brand, { color: theme.accent }]}>VINYL</Text>
                      <Text style={[styles.url, { color: theme.accent, opacity: 0.45 }]}>vinyl.app/room</Text>
                    </View>
                    {showBarcode && (
                      <View style={{ justifyContent: 'flex-end', paddingBottom: 2 }}>
                        <Barcode color={theme.text} />
                      </View>
                    )}
                  </View>
                </View>
              </ViewShot>
            </View>

            <Text style={styles.sectionTag}>03 — CUSTOMIZE</Text>
            <View style={styles.customPanel}>
              <SliderRow label="LP SIZE" value={lpSize} min={60} max={95} onChange={setLpSize} />
              <SliderRow label="TITLE SZ" value={titleSize} min={14} max={36} onChange={setTitleSize} />

              <View style={styles.toggleRow}>
                <Pressable style={[styles.toggleBtn, toggle(showLp)]} onPress={() => setShowLp((v) => !v)}>
                  <Text style={styles.toggleTxt}>LP 판</Text>
                </Pressable>
                <Pressable
                  style={[styles.toggleBtn, toggle(showGrooves)]}
                  onPress={() => setShowGrooves((v) => !v)}
                >
                  <Text style={styles.toggleTxt}>홈라인</Text>
                </Pressable>
                <Pressable
                  style={[styles.toggleBtn, toggle(showBarcode)]}
                  onPress={() => setShowBarcode((v) => !v)}
                >
                  <Text style={styles.toggleTxt}>바코드</Text>
                </Pressable>
                <Pressable
                  style={[styles.toggleBtn, toggle(showEngraving)]}
                  onPress={() => setShowEngraving((v) => !v)}
                >
                  <Text style={styles.toggleTxt}>날짜각인</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              style={[styles.copyPromptBtn, { borderColor: theme.accent }]}
              onPress={handleCopyPrompt}
              disabled={copying}
            >
              <Text style={[styles.copyPromptTxt, { color: theme.text }]}>COPY PROMPT FOR DEV</Text>
            </Pressable>

            <Text style={styles.sectionTag}>04 — GENERATED PROMPT</Text>
            <View style={styles.promptBox}>
              <Text style={styles.promptText} selectable>
                {devPrompt}
              </Text>
            </View>

            <View style={styles.actions}>
              <CopperButton label="SHARE IMAGE" onPress={handleShare} loading={sharing} style={{ flex: 1 }} />
              <CopperButton label="CLOSE" onPress={onClose} variant="outline" style={{ flex: 1 }} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  sheet: {
    backgroundColor: colors.bg2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.shelf,
    width: '100%',
    maxWidth: 400,
    maxHeight: '96%',
  },
  scroll: { maxHeight: '100%' },
  scrollContent: { padding: 16, paddingBottom: 24, gap: 10 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    color: colors.cream,
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  headerRight: {
    color: colors.muted,
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '600',
  },
  sectionTag: {
    color: colors.copper,
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
    marginTop: 4,
  },
  themeScroll: { gap: 10, paddingVertical: 4 },
  themeChip: {
    width: 72,
    borderWidth: 2,
    borderRadius: 8,
    padding: 6,
    marginRight: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  themeSwatch: {
    height: 44,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeDot: { width: 18, height: 18, borderRadius: 9 },
  themeLabel: { fontSize: 8, fontWeight: '700', marginTop: 6, letterSpacing: 0.5 },
  previewWrap: { alignItems: 'center' },
  storyCard: {
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245,230,200,0.15)',
  },
  grain: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#888',
  },
  topRule: { height: 2, width: 48, alignSelf: 'center', marginBottom: 12 },
  lpArea: { alignItems: 'center', justifyContent: 'center', minHeight: 120 },
  lpOffHint: { fontSize: 11, letterSpacing: 1, fontWeight: '600' },
  lpDisc: { overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  lpPlaceholder: {},
  centerLabel: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 4,
  },
  centerLabelTxt: { fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  centerLabelSub: { fontSize: 6, fontWeight: '700', marginTop: 1 },
  divider: { height: 1, width: '100%', marginVertical: 12 },
  cardTitle: { fontWeight: '700', textAlign: 'center', letterSpacing: 1.2 },
  cardArtist: {
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 8,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  footerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(245,230,200,0.12)',
    alignItems: 'flex-end',
    gap: 12,
  },
  engrave: {
    fontSize: 9,
    letterSpacing: 1,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  brand: { fontSize: 14, fontWeight: '900', letterSpacing: 4 },
  url: { fontSize: 9, letterSpacing: 0.5, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) },
  barcodeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 1, height: 28 },
  bar: { height: 24, borderRadius: 0.5 },
  customPanel: {
    backgroundColor: '#1a0f00',
    borderRadius: 10,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  sliderBlock: { gap: 6 },
  sliderLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sliderLabel: { color: colors.cream, fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
  sliderValue: { color: colors.gold, fontSize: 11, fontWeight: '700' },
  sliderTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  sliderFill: { height: '100%', backgroundColor: colors.copper, borderRadius: 5 },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  toggleTxt: { color: colors.cream, fontSize: 11, fontWeight: '600' },
  copyPromptBtn: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#1a0f00',
    alignItems: 'center',
  },
  copyPromptTxt: { fontSize: 12, letterSpacing: 2, fontWeight: '800' },
  promptBox: {
    maxHeight: 140,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,230,200,0.1)',
  },
  promptText: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 13,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
