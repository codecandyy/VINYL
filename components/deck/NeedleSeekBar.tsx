import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutChangeEvent,
  GestureResponderEvent,
} from 'react-native';
import { usePlayerStore } from '../../stores/playerStore';
import { audioEngine } from '../../lib/audioEngine';
import { colors } from '../../lib/constants';

type Props = {
  disabled?: boolean;
};

/** 재생 위치 시크 — 턴테이블 바늘과 동일하게 audioEngine.seekTo */
export function NeedleSeekBar({ disabled }: Props) {
  const positionMs = usePlayerStore((s) => s.positionMs);
  const durationMs = usePlayerStore((s) => s.durationMs);
  const [trackW, setTrackW] = useState(1);
  const [dragging, setDragging] = useState(false);
  const dragRatio = useRef<number | null>(null);

  const durSec = durationMs > 0 ? durationMs / 1000 : 0;
  const ratio = dragging && dragRatio.current != null
    ? dragRatio.current
    : durationMs > 0
      ? Math.min(1, Math.max(0, positionMs / durationMs))
      : 0;

  const applyRatio = useCallback(
    (r: number) => {
      if (durSec <= 0 || disabled) return;
      const sec = r * durSec;
      audioEngine.seekTo(sec);
      usePlayerStore.getState().setProgress(sec * 1000, durationMs);
    },
    [durSec, durationMs, disabled]
  );

  const setFromX = useCallback(
    (locationX: number) => {
      if (trackW < 1 || disabled) return;
      const r = Math.max(0, Math.min(1, locationX / trackW));
      dragRatio.current = r;
      applyRatio(r);
    },
    [trackW, applyRatio, disabled]
  );

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackW(e.nativeEvent.layout.width);
  };

  useEffect(() => {
    if (!dragging) dragRatio.current = null;
  }, [dragging]);

  const onPressIn = (e: GestureResponderEvent) => {
    if (disabled || durSec <= 0) return;
    setDragging(true);
    setFromX(e.nativeEvent.locationX);
  };

  const onPress = (e: GestureResponderEvent) => {
    if (disabled || durSec <= 0) return;
    setFromX(e.nativeEvent.locationX);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>NEEDLE / TIME</Text>
      <Pressable
        style={[styles.track, disabled && styles.trackDisabled]}
        onLayout={onTrackLayout}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={() => setDragging(false)}
        disabled={disabled || durSec <= 0}
      >
        <View style={[styles.fill, { width: `${Math.round(ratio * 100)}%` }]} />
      </Pressable>
      <Text style={styles.hint}>
        {durSec <= 0 ? '—' : `${Math.floor((ratio * durSec) / 60)}:${String(Math.floor((ratio * durSec) % 60)).padStart(2, '0')}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, gap: 4 },
  label: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  track: {
    height: 10,
    backgroundColor: colors.shelf,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.gold}44`,
  },
  trackDisabled: { opacity: 0.45 },
  fill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 5,
  },
  hint: {
    color: colors.muted,
    fontSize: 10,
    alignSelf: 'flex-end',
  },
});
