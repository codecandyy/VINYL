import React from 'react';
import { TextInput, StyleSheet, View, Text, TextInputProps } from 'react-native';
import { colors } from '../../lib/constants';

type Props = TextInputProps & {
  label?: string;
};

export function RetroInput({ label, style, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.muted}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.bg3,
    borderWidth: 1,
    borderColor: colors.shelf,
    borderRadius: 4,
    color: colors.cream,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
});
