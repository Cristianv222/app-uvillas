import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable } from 'react-native';

interface Props {
  icon: LucideIcon;
  label: string; // lectores de pantalla
  onPress: () => void;
  color?: string;
  size?: number;
  className?: string;
  disabled?: boolean;
}

export function IconButton({ icon: Icon, label, onPress, color = '#1B2420', size = 22, className = '', disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      className={`h-11 w-11 items-center justify-center rounded-full active:bg-ink-100 ${disabled ? 'opacity-40' : ''} ${className}`}
    >
      <Icon size={size} color={color} />
    </Pressable>
  );
}
