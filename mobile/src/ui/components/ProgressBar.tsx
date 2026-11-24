import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  label: string;
  value: number; // 0..1
  color?: string;
  suffix?: string;
}

export function ProgressBar({ label, value, color = 'bg-brand-500', suffix }: Props) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View className="gap-1">
      <View className="flex-row justify-between">
        <Text className="flex-1 text-sm text-ink-700" numberOfLines={1}>{label}</Text>
        <Text className="text-sm font-semibold text-ink-900">{suffix ?? `${Math.round(pct * 100)}%`}</Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-ink-100">
        <View className={`h-2 rounded-full ${color}`} style={{ width: `${pct * 100}%` }} />
      </View>
    </View>
  );
}
