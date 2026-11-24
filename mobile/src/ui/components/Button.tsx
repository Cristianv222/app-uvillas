import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const STYLES: Record<Variant, { box: string; text: string; icon: string }> = {
  primary: { box: 'bg-brand-600 active:bg-brand-700', text: 'text-white', icon: '#FFFFFF' },
  secondary: { box: 'bg-white border border-ink-200 active:bg-ink-100', text: 'text-ink-900', icon: '#1B2420' },
  danger: { box: 'bg-danger-100 active:bg-red-200', text: 'text-danger-600', icon: '#C0392B' },
  ghost: { box: 'active:bg-ink-100', text: 'text-brand-700', icon: '#25603A' },
};

interface Props {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Button({ label, onPress, icon: Icon, variant = 'primary', loading, disabled, className = '' }: Props) {
  const s = STYLES[variant];
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={off}
      className={`h-12 flex-row items-center justify-center gap-2 rounded-xl px-4 ${s.box} ${off ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? <ActivityIndicator color={s.icon} /> : Icon ? <Icon size={20} color={s.icon} /> : null}
      <Text className={`text-base font-semibold ${s.text}`}>{label}</Text>
    </Pressable>
  );
}
