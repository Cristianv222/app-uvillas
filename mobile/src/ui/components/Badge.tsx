import React from 'react';
import { Text, View } from 'react-native';

const TONES = {
  good: 'bg-brand-100 text-brand-700',
  warn: 'bg-gold-100 text-gold-600',
  bad: 'bg-danger-100 text-danger-600',
  neutral: 'bg-ink-100 text-ink-700',
} as const;

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: keyof typeof TONES }) {
  const [bg, fg] = TONES[tone].split(' ');
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${bg}`}>
      <Text className={`text-xs font-semibold ${fg}`}>{label}</Text>
    </View>
  );
}

export const severityTone = (severity: string, healthy: boolean) => (healthy ? 'good' : severity === 'high' ? 'bad' : 'warn');
export const severityLabel = (severity: string, healthy: boolean) =>
  healthy ? 'Sano' : severity === 'high' ? 'Grave' : severity === 'medium' ? 'Moderada' : 'Leve';
