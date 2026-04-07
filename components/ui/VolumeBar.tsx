import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutChangeEvent,
  GestureResponderEvent,
} from 'react-native';
import { colors } from '../../lib/constants';

type Props = {
  volume: number;
  onChange: (v: number) => void;
};

export function VolumeBar({ volume, onChange }: Props) {
  const [trackW, setTrackW] = useState(1);
  const beforeMute = useRef(volume);

  useEffect(() => {
    if (volume > 0.02) beforeMute.current = volume;
  }, [volume]);

  const setFromEvent = useCallback(
    (e: GestureResponderEvent) => {
      const x = e.nativeEvent.locationX;
      if (trackW < 1) return;
      onChange(Math.max(0, Math.min(1, x / trackW)));
    },
    [trackW, onChange]
  );

  const onTrackLayout = (e: LayoutChangeEvent) => {
    setTrackW(e.nativeEvent.layout.width);
  };

  const step = (delta: number) => {
    onChange(Math.max(0, Math.min(1, volume + delta)));
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => {
          if (volume < 0.02) {
            const restore = beforeMute.current > 0.02 ? beforeMute.current : 0.85;
            onChange(restore);
          } else {
            beforeMute.current = volume;
            onChange(0);
          }
        }}
        hitSlop={8}
        style={styles.muteBtn}
      >
        <Text style={styles.muteIcon}>{volume < 0.02 ? '🔇' : '🔊'}</Text>
      </Pressable>

      <Text style={styles.label}>VOL</Text>

      <Pressable
        style={styles.track}
        onLayout={onTrackLayout}
        onPress={setFromEvent}
        onPressIn={setFromEvent}
      >
        <View style={[styles.fill, { width: `${Math.round(volume * 100)}%` }]} />
      </Pressable>

      <Text style={styles.pct}>{Math.round(volume * 100)}</Text>

      <Pressable onPress={() => step(-0.08)} hitSlop={6} style={styles.stepBtn}>
        <Text style={styles.stepTxt}>−</Text>
      </Pressable>
      <Pressable onPress={() => step(0.08)} hitSlop={6} style={styles.stepBtn}>
        <Text style={styles.stepTxt}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  muteBtn: { paddingVertical: 2 },
  muteIcon: { fontSize: 14 },
  label: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    width: 22,
  },
  track: {
    flex: 1,
    height: 6,
    backgroundColor: colors.shelf,
    borderRadius: 3,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.copper,
    borderRadius: 3,
  },
  pct: {
    color: colors.muted,
    fontSize: 9,
    width: 26,
    textAlign: 'right',
  },
  stepBtn: {
    minWidth: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  stepTxt: {
    color: colors.copper,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
});
