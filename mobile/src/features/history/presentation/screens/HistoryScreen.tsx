import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { FlatList, Image, ScrollView, Text, View } from 'react-native';

import { useAuth } from '@/core/auth/AuthContext';
import { scansRepo, type ScanRow } from '@/db/repositories/scansRepo';
import { PARTS, PART_LABEL, type Part } from '@/ml/types';
import { formatDateTime, percent } from '@/shared/utils/format';
import { Badge, Card, Chip, EmptyState, Screen } from '@/ui/components';
import { CloudOff, History, Sprout } from '@/ui/icons';

export function HistoryScreen() {
  const nav = useNavigation<any>();
  const { user } = useAuth();
  const [part, setPart] = useState<Part | undefined>();
  const [rows, setRows] = useState<ScanRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (user) void scansRepo.list(user.id, part).then(setRows);
    }, [user, part]),
  );

  return (
    <Screen>
      <Text className="mb-3 text-2xl font-bold text-ink-900">Historial</Text>
      <View className="mb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          <Chip label="Todos" selected={!part} onPress={() => setPart(undefined)} />
          {PARTS.map((p) => <Chip key={p} label={PART_LABEL[p]} selected={part === p} onPress={() => setPart(p)} />)}
        </ScrollView>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerClassName="gap-3 pb-6"
        ListEmptyComponent={<EmptyState icon={History} title="Aún no hay diagnósticos" hint="Los que guardes desde la cámara aparecen aquí, incluso sin internet." />}
        renderItem={({ item }) => (
          <Card onPress={() => nav.navigate('ScanDetail', { id: item.id })} className="flex-row items-center gap-3">
            {item.image_uri ? (
              <Image source={{ uri: item.image_uri }} className="h-16 w-16 rounded-xl bg-ink-100" />
            ) : (
              <View className="h-16 w-16 items-center justify-center rounded-xl bg-ink-100"><Sprout size={24} color="#A9B3AD" /></View>
            )}
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-ink-900" numberOfLines={1}>{item.label_name}</Text>
              <Text className="text-sm text-ink-500">{PART_LABEL[item.part]} · {percent(item.confidence)} · {formatDateTime(item.captured_at)}</Text>
              <View className="flex-row items-center gap-2">
                <Badge label={item.is_healthy ? 'Sano' : 'Enfermedad'} tone={item.is_healthy ? 'good' : 'bad'} />
                {item.dirty || (item.image_uri && !item.image_synced) ? <CloudOff size={16} color="#A9B3AD" /> : null}
              </View>
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}
