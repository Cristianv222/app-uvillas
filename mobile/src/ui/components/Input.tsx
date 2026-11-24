import React from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';

interface Props extends TextInputProps {
  label: string;
  error?: string | null;
  right?: React.ReactNode;
}

export function Input({ label, error, right, ...props }: Props) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-ink-700">{label}</Text>
      <View className={`h-12 flex-row items-center rounded-xl border bg-white px-3 ${error ? 'border-danger-600' : 'border-ink-200'}`}>
        <TextInput className="flex-1 text-base text-ink-900" placeholderTextColor="#A9B3AD" {...props} />
        {right}
      </View>
      {error ? <Text className="text-sm text-danger-600">{error}</Text> : null}
    </View>
  );
}
