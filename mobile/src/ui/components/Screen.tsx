import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  className?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function Screen({ children, scroll = false, className = '', edges = ['top', 'left', 'right'] }: Props) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-ink-50">
      {scroll ? (
        <ScrollView contentContainerClassName={`px-4 py-4 gap-4 ${className}`} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View className={`flex-1 px-4 py-4 ${className}`}>{children}</View>
      )}
    </SafeAreaView>
  );
}
