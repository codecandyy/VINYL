import React, { useCallback, useRef, useState } from 'react';
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

  return (
    <View style={styles.row}>
      <Text style={styles.label}>VOLUME</Text>
      <Pressable
        style={styles.track}
        onLayout={onTrackLayout}
        onPress={setFromEvent}
        onPressIn={setFromEvent}
      >
        <View style={[styles.fill, { width: `${Math.round(volume * 100)}%` }]} />
      </Pressable>
      <Text style={styles.pct}>{Math.round(volume * 100)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    width: '100%',
  },
  label: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  track: {
    flex: 1,
    height: 5,
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
    width: 24,
    textAlign: 'right',
  },
});
