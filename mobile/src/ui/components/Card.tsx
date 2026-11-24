import React from 'react';
import { Pressable, View } from 'react-native';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export function Card({ children, onPress, className = '' }: Props) {
  const base = `rounded-2xl border border-ink-200 bg-white p-4 ${className}`;
  return onPress ? (
    <Pressable onPress={onPress} className={`${base} active:bg-ink-50`}>
      {children}
    </Pressable>
  ) : (
    <View className={base}>{children}</View>
  );
}
