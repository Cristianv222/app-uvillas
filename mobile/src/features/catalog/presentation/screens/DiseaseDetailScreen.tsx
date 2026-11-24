import { useRoute } from '@react-navigation/native';
import React from 'react';
import { Text, View } from 'react-native';

import { PART_LABEL } from '@/ml/types';
import { Badge, Card, EmptyState, Screen, SectionTitle, severityLabel, severityTone } from '@/ui/components';
import { TriangleAlert } from '@/ui/icons';

import { catalogRepository } from '../../data/catalogRepository';

export function DiseaseDetailScreen() {
  const { part, code } = useRoute<any>().params as { part: string; code: string };
  const d = catalogRepository.find(part, code);
  if (!d) return <Screen><EmptyState icon={TriangleAlert} title="No encontramos esta enfermedad" /></Screen>;

  const List = ({ items }: { items: string[] }) => (
    <View className="gap-2">
      {items.map((t) => (
        <View key={t} className="flex-row gap-2">
          <Text className="text-base text-brand-600">•</Text>
          <Text className="flex-1 text-base text-ink-700">{t}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <Screen scroll edges={['left', 'right', 'bottom']}>
      <View className="gap-2">
        <Text className="text-2xl font-bold text-ink-900">{d.name}</Text>
        <View className="flex-row gap-2">
          <Badge label={PART_LABEL[d.part]} />
          <Badge label={severityLabel(d.severity, d.is_healthy)} tone={severityTone(d.severity, d.is_healthy)} />
        </View>
        <Text className="text-base text-ink-700">{d.description}</Text>
      </View>
      <Card className="gap-3"><SectionTitle>Cómo reconocerla</SectionTitle><List items={d.symptoms} /></Card>
      <Card className="gap-3"><SectionTitle>Qué hacer</SectionTitle><List items={d.treatment} /></Card>
      <Text className="px-1 text-xs text-ink-500">Información de referencia. Confirma el diagnóstico con un técnico agrónomo antes de aplicar tratamientos.</Text>
    </Screen>
  );
}
