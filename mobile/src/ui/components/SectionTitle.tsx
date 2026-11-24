import React from 'react';
import { Text } from 'react-native';

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text className="text-lg font-semibold text-ink-900">{children}</Text>
);
