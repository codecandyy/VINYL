import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors } from '../../lib/constants';

type Props = {
  message: string;
  visible: boolean;
  onHide: () => void;
  type?: 'success' | 'error' | 'info';
};

export function Toast({ message, visible, onHide, type = 'info' }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide());
    }
  }, [visible]);

  if (!visible) return null;

  const bgColor = type === 'error' ? colors.red : type === 'success' ? '#2D5A27' : colors.bg3;

  return (
    <Animated.View style={[styles.toast, { opacity, backgroundColor: bgColor }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.shelf,
    maxWidth: 320,
    zIndex: 9999,
  },
  text: {
    color: colors.cream,
    fontSize: 13,
    textAlign: 'center',
  },
});
