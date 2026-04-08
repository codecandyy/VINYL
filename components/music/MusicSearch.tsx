import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, Image, ActivityIndicator,
} from 'react-native';
import { useMusicSearch } from '../../hooks/useMusicSearch';
import { RetroInput } from '../ui/RetroInput';
import { CopperButton } from '../ui/CopperButton';
import { colors } from '../../lib/constants';
import { MusicTrack } from '../../lib/music';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelectTrack: (track: MusicTrack) => void;
};

export function MusicSearch({ visible, onClose, onSelectTrack }: Props) {
  const [query, setQuery] = useState('');
  const { results, isLoading, error, search, clear } = useMusicSearch();

  const handleSearch = useCallback(() => search(query), [query, search]);

  const handleSelect = (track: MusicTrack) => {
    onSelectTrack(track);
    clear();
    setQuery('');
    onClose();
  };

  const formatDuration = (sec: number) =>
    `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>ADD TO COLLECTION</Text>
              <Text style={styles.subtitle}>Deezer · iTunes · 30초 미리듣기</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 검색 */}
          <View style={styles.searchRow}>
            <RetroInput
              value={query}
              onChangeText={setQuery}
              placeholder="아티스트, 곡 제목 검색..."
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              style={{ flex: 1 }}
            />
            <CopperButton
              label="Search"
              onPress={handleSearch}
              loading={isLoading}
              style={styles.searchBtn}
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
          {isLoading && <ActivityIndicator color={colors.copper} style={{ marginTop: 20 }} />}

          <FlatList
            data={results}
            keyExtractor={(item) => `${item.source}-${item.id}`}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.trackRow} onPress={() => handleSelect(item)}>
                {item.artworkUrl ? (
                  <Image source={{ uri: item.artworkUrl }} style={styles.artwork} />
                ) : (
                  <View style={[styles.artwork, { backgroundColor: colors.bg3 }]} />
                )}
                <View style={styles.trackInfo}>
                  <Text style={styles.metaLine} numberOfLines={1}>
                    <Text style={styles.metaKey}>곡 </Text>
                    {item.title}
                  </Text>
                  <Text style={styles.metaLine} numberOfLines={1}>
                    <Text style={styles.metaKey}>앨범 </Text>
                    {item.album}
                  </Text>
                  <Text style={styles.metaLine} numberOfLines={1}>
                    <Text style={styles.metaKey}>아티스트 </Text>
                    {item.artist}
                  </Text>
                  <View style={styles.tagRow}>
                    <View style={[styles.sourceBadge, item.source === 'deezer' && styles.deezerBadge]}>
                      <Text style={styles.sourceText}>{item.source.toUpperCase()}</Text>
                    </View>
                    {!item.previewUrl && (
                      <Text style={styles.noPreview}>미리듣기 없음</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg2,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 40,
    maxHeight: '88%',
    borderTopWidth: 1,
    borderTopColor: colors.shelf,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    color: colors.copper,
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 1,
  },
  closeBtn: { color: colors.muted, fontSize: 18, padding: 4 },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  searchBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  errorText: { color: colors.red, fontSize: 12, marginBottom: 8 },
  list: { marginTop: 4 },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  artwork: {
    width: 46,
    height: 46,
    borderRadius: 3,
    backgroundColor: colors.bg3,
  },
  trackInfo: { flex: 1, gap: 2 },
  metaLine: { color: colors.cream, fontSize: 12 },
  metaKey: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  trackName: { color: colors.cream, fontSize: 14, fontWeight: '600' },
  trackMeta: { color: colors.muted, fontSize: 11 },
  tagRow: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 2 },
  sourceBadge: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.shelf,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  deezerBadge: { borderColor: '#FF5500' },
  sourceText: { color: colors.muted, fontSize: 8, letterSpacing: 1 },
  noPreview: { color: colors.red, fontSize: 9, opacity: 0.7 },
  duration: {
    color: colors.muted,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  separator: { height: 1, backgroundColor: colors.shelf, opacity: 0.4 },
});
