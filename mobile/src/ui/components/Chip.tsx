import React from 'react';
import { Pressable, Text } from 'react-native';

interface Props {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`h-9 items-center justify-center rounded-full border px-4 ${selected ? 'border-brand-600 bg-brand-600' : 'border-ink-200 bg-white'}`}
    >
      <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-ink-700'}`}>{label}</Text>
    </Pressable>
  );
}
