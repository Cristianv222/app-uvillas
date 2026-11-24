import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';

interface Props {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, hint, action }: Props) {
  return (
    <View className="items-center gap-3 px-6 py-12">
      <Icon size={36} color="#A9B3AD" />
      <Text className="text-center text-lg font-semibold text-ink-900">{title}</Text>
      {hint ? <Text className="text-center text-base text-ink-500">{hint}</Text> : null}
      {action}
    </View>
  );
}
