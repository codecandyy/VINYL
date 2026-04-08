import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { useCollection } from '../../hooks/useCollection';
import { useMusicPlayer } from '../../hooks/useMusicPlayer';
import { LocalLP, getDeckSetListTracks, localLPToTrack } from '../../lib/localCollection';
import { colors } from '../../lib/constants';

function LPRow({ lp, onPlay, onDelete }: { lp: LocalLP; onPlay: () => void; onDelete: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.row, lp.isDamaged && styles.rowDamaged]}
      onPress={onPlay}
      onLongPress={onDelete}
      activeOpacity={0.75}
    >
      <View style={styles.vinyl}>
        {lp.artworkUrl ? (
          <Image source={{ uri: lp.artworkUrl }} style={styles.vinylArt} />
        ) : (
          <View style={[styles.vinylArt, { backgroundColor: lp.labelColor }]} />
        )}
        <View style={styles.vinylGroove} />
        <View style={styles.vinylCenter} />
      </View>

      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={1}>{lp.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{lp.artist}</Text>
        <Text style={styles.album} numberOfLines={1}>{lp.album}</Text>
        <View style={styles.tags}>
          <View style={[styles.sourceBadge, lp.source === 'deezer' && styles.deezerBadge]}>
            <Text style={styles.sourceText}>{lp.source.toUpperCase()}</Text>
          </View>
          {lp.isDamaged && <Text style={styles.damaged}>DAMAGED</Text>}
          {!lp.previewUrl && <Text style={styles.noPreview}>미리듣기 없음</Text>}
        </View>
      </View>

      <View style={styles.playBtn}>
        <Text style={styles.playIcon}>{lp.previewUrl ? '▶' : '–'}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function CollectionScreen() {
  const { lps, removeFromCollection, markPlayed } = useCollection();
  const { playTrack } = useMusicPlayer();

  const handlePlay = (lp: LocalLP) => {
    if (!lp.previewUrl) return;
    const setList = getDeckSetListTracks(lp);
    const track =
      setList.find((t) => t.id === lp.trackId) ?? localLPToTrack(lp);
    const initialIdx = Math.max(0, setList.findIndex((t) => t.id === track.id));
    void markPlayed(lp.id);
    playTrack(track, { sideAlbumTracks: setList, initialSideIndex: initialIdx });
  };

  const handleDelete = (lp: LocalLP) => {
    Alert.alert('LP 제거', `"${lp.title}"을 컬렉션에서 제거할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '제거', style: 'destructive', onPress: () => removeFromCollection(lp.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MY COLLECTION</Text>
        <Text style={styles.headerCount}>{lps.length} LPs · 로컬 저장</Text>
      </View>

      {lps.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🎵</Text>
          <Text style={styles.emptyText}>컬렉션이 비어있어요</Text>
          <Text style={styles.emptySub}>Room 탭에서 ＋ 버튼으로 LP를 추가하세요</Text>
        </View>
      ) : (
        <FlatList
          data={lps}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LPRow
              lp={item}
              onPlay={() => handlePlay(item)}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.shelf,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  headerTitle: { color: colors.copper, fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  headerCount: { color: colors.muted, fontSize: 11, letterSpacing: 1 },
  list: { padding: 14 },
  sep: { height: 8 },
  row: {
    backgroundColor: colors.bg3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.shelf,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  rowDamaged: { borderColor: colors.red, opacity: 0.8 },
  vinyl: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  vinylArt: { width: 26, height: 26, borderRadius: 13 },
  vinylGroove: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#333',
  },
  vinylCenter: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#444',
  },
  meta: { flex: 1, gap: 2 },
  title: { color: colors.cream, fontSize: 14, fontWeight: '600' },
  artist: { color: colors.copper, fontSize: 12 },
  album: { color: colors.muted, fontSize: 11 },
  tags: { flexDirection: 'row', gap: 6, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' },
  sourceBadge: {
    borderWidth: 1,
    borderColor: colors.shelf,
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  deezerBadge: { borderColor: '#FF5500' },
  sourceText: { color: colors.muted, fontSize: 8, letterSpacing: 1 },
  damaged: { color: colors.red, fontSize: 9, letterSpacing: 1.5 },
  noPreview: { color: colors.muted, fontSize: 9, opacity: 0.6 },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.copper}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: colors.copper, fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyIcon: { fontSize: 44, marginBottom: 6 },
  emptyText: { color: colors.cream, fontSize: 16 },
  emptySub: { color: colors.muted, fontSize: 12, textAlign: 'center', paddingHorizontal: 32 },
});
