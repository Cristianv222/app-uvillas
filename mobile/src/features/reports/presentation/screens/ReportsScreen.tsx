import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useAuth } from '@/core/auth/AuthContext';
import { farmsRepo, type Farm } from '@/db/repositories/farmsRepo';
import { scansRepo, type Summary } from '@/db/repositories/scansRepo';
import { PARTS, PART_LABEL } from '@/ml/types';
import { percent } from '@/shared/utils/format';
import { Card, Chip, EmptyState, ProgressBar, Screen, SectionTitle } from '@/ui/components';
import { ChartColumn } from '@/ui/icons';

export function ReportsScreen() {
  const { user } = useAuth();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmId, setFarmId] = useState<string | undefined>();
  const [data, setData] = useState<Summary | null>(null);

  // Se calcula con la BD local: los reportes funcionan sin internet.
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      void farmsRepo.listFarms(user.id).then(setFarms);
      void scansRepo.summary(user.id, farmId).then(setData);
    }, [user, farmId]),
  );

  const maxDay = Math.max(1, ...(data?.timeline.map((t) => t.total) ?? [1]));

  return (
    <Screen scroll>
      <Text className="text-2xl font-bold text-ink-900">Reportes</Text>
      {farms.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          <Chip label="Todas las fincas" selected={!farmId} onPress={() => setFarmId(undefined)} />
          {farms.map((f) => <Chip key={f.id} label={f.name} selected={farmId === f.id} onPress={() => setFarmId(f.id)} />)}
        </ScrollView>
      ) : null}

      {!data || data.total === 0 ? (
        <EmptyState icon={ChartColumn} title="Sin datos todavía" hint="Guarda diagnósticos desde la cámara para ver estadísticas." />
      ) : (
        <>
          <View className="flex-row gap-3">
            <Card className="flex-1"><Text className="text-3xl font-bold text-ink-900">{data.total}</Text><Text className="text-sm text-ink-500">Diagnósticos</Text></Card>
            <Card className="flex-1"><Text className="text-3xl font-bold text-brand-600">{percent(data.healthy / data.total)}</Text><Text className="text-sm text-ink-500">Sanos</Text></Card>
          </View>
          <Card className="gap-3">
            <SectionTitle>Por parte de la planta</SectionTitle>
            {PARTS.filter((p) => data.byPart[p]).map((p) => (
              <ProgressBar key={p} label={PART_LABEL[p]} value={data.byPart[p].healthy / data.byPart[p].total} suffix={`${data.byPart[p].healthy}/${data.byPart[p].total} sanos`} />
            ))}
          </Card>
          <Card className="gap-3">
            <SectionTitle>Enfermedades más frecuentes</SectionTitle>
            {data.byDisease.length === 0 ? <Text className="text-base text-ink-500">No se detectaron enfermedades.</Text> : null}
            {data.byDisease.map((d) => (
              <ProgressBar key={`${d.part}-${d.code}`} label={`${d.name} · ${PART_LABEL[d.part as keyof typeof PART_LABEL]}`} value={d.count / data.byDisease[0].count} color="bg-danger-600" suffix={String(d.count)} />
            ))}
          </Card>
          <Card className="gap-3">
            <SectionTitle>Últimos días</SectionTitle>
            <View className="h-28 flex-row items-end gap-1">
              {data.timeline.map((t) => (
                <View key={t.date} className="flex-1 items-center justify-end gap-1">
                  <View className="w-full rounded-t bg-brand-200" style={{ height: `${(t.total / maxDay) * 100}%` }}>
                    <View className="absolute bottom-0 w-full rounded-t bg-danger-600" style={{ height: `${(t.diseased / Math.max(1, t.total)) * 100}%` }} />
                  </View>
                </View>
              ))}
            </View>
            <Text className="text-xs text-ink-500">Verde: total · Rojo: con enfermedad</Text>
          </Card>
        </>
      )}
    </Screen>
  );
}
