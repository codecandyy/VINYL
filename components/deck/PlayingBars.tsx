import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

const BAR_W = 3;
const BAR_GAP = 2;
const MAX_H = 12;
const MIN_H = 4;

/**
 * 재생 중 3막대 미니 이퀄라이저 (위아래 움직임)
 */
export function PlayingBars({ active, color = '#5c4a38' }: { active: boolean; color?: string }) {
  const a0 = useRef(new Animated.Value(0)).current;
  const a1 = useRef(new Animated.Value(0.33)).current;
  const a2 = useRef(new Animated.Value(0.66)).current;

  useEffect(() => {
    if (!active) {
      a0.setValue(0);
      a1.setValue(0.33);
      a2.setValue(0.66);
      return;
    }
    const mk = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: 320 + delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 320 + delay,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: false,
          }),
        ])
      );
    const l0 = mk(a0, 0);
    const l1 = mk(a1, 40);
    const l2 = mk(a2, 80);
    l0.start();
    l1.start();
    l2.start();
    return () => {
      l0.stop();
      l1.stop();
      l2.stop();
    };
  }, [active, a0, a1, a2]);

  const h = (v: Animated.Value) =>
    v.interpolate({
      inputRange: [0, 1],
      outputRange: [MIN_H, MAX_H],
    });

  if (!active) return null;

  return (
    <View style={styles.wrap} accessibilityLabel="Playing">
      <Animated.View style={[styles.bar, { height: h(a0), backgroundColor: color }]} />
      <Animated.View style={[styles.bar, styles.barMid, { height: h(a1), backgroundColor: color }]} />
      <Animated.View style={[styles.bar, { height: h(a2), backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: BAR_W * 3 + BAR_GAP * 2 + 4,
    height: MAX_H + 2,
    marginRight: 6,
  },
  bar: {
    width: BAR_W,
    borderRadius: 1,
    backgroundColor: '#5c4a38',
  },
  barMid: {
    marginHorizontal: BAR_GAP,
  },
});
