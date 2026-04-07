import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { colors } from '../../lib/constants';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  style?: ViewStyle;
};

export function CopperButton({ label, onPress, loading, disabled, variant = 'primary', style }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled, style]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.bg : colors.copper} size="small" />
      ) : (
        <Text style={[styles.label, variant !== 'primary' && styles.labelOutline]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.copper,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.copper,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: colors.bg,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  labelOutline: {
    color: colors.copper,
  },
});
