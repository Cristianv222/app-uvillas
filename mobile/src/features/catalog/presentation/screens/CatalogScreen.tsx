import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';

import { PARTS, PART_LABEL, type Part } from '@/ml/types';
import { Badge, Card, Chip, Screen, severityLabel, severityTone } from '@/ui/components';

import { catalogRepository } from '../../data/catalogRepository';

export function CatalogScreen() {
  const nav = useNavigation<any>();
  const [part, setPart] = useState<Part>('hojas');
  const items = catalogRepository.list(part);

  return (
    <Screen>
      <Text className="mb-3 text-2xl font-bold text-ink-900">Enfermedades</Text>
      <View className="mb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {PARTS.map((p) => (
            <Chip key={p} label={PART_LABEL[p]} selected={p === part} onPress={() => setPart(p)} />
          ))}
        </ScrollView>
      </View>
      <FlatList
        data={items}
        keyExtractor={(d) => `${d.part}-${d.code}`}
        contentContainerClassName="gap-3 pb-6"
        renderItem={({ item }) => (
          <Card onPress={() => nav.navigate('DiseaseDetail', { part: item.part, code: item.code })} className="gap-2">
            <Text className="text-base font-semibold text-ink-900">{item.name}</Text>
            <Text className="text-sm text-ink-500" numberOfLines={2}>{item.description}</Text>
            <Badge label={severityLabel(item.severity, item.is_healthy)} tone={severityTone(item.severity, item.is_healthy)} />
          </Card>
        )}
      />
    </Screen>
  );
}
