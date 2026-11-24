import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';

import { scansRepo, type ScanRow } from '@/db/repositories/scansRepo';
import { catalogRepository } from '@/features/catalog/data/catalogRepository';
import { useSync } from '@/features/sync/presentation/SyncProvider';
import { PART_LABEL, type Prediction } from '@/ml/types';
import { formatDateTime } from '@/shared/utils/format';
import { Badge, Button, Card, EmptyState, ProgressBar, Screen, SectionTitle } from '@/ui/components';
import { MapPin, Trash2, TriangleAlert } from '@/ui/icons';

export function ScanDetailScreen() {
  const nav = useNavigation<any>();
  const { id } = useRoute<any>().params as { id: string };
  const { notifyChange } = useSync();
  const [scan, setScan] = useState<ScanRow | null | undefined>(undefined);

  useEffect(() => { void scansRepo.get(id).then(setScan); }, [id]);

  if (scan === undefined) return <Screen><View /></Screen>;
  if (!scan || scan.is_deleted) return <Screen><EmptyState icon={TriangleAlert} title="Este diagnóstico ya no existe" /></Screen>;

  const topK: Prediction[] = JSON.parse(scan.top_k || '[]');
  const info = catalogRepository.find(scan.part, scan.label_code);

  const remove = () =>
    Alert.alert('Eliminar diagnóstico', 'Se quitará de tu historial y de tu cuenta.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar diagnóstico', style: 'destructive', onPress: async () => { await scansRepo.softDelete(id); notifyChange(); nav.goBack(); } },
    ]);

  return (
    <Screen scroll edges={['left', 'right', 'bottom']}>
      {scan.image_uri ? <Image source={{ uri: scan.image_uri }} className="h-72 w-full rounded-2xl bg-ink-100" resizeMode="cover" /> : null}
      <View className="gap-2">
        <Text className="text-2xl font-bold text-ink-900">{scan.label_name}</Text>
        <View className="flex-row gap-2">
          <Badge label={PART_LABEL[scan.part]} />
          <Badge label={scan.is_healthy ? 'Sano' : 'Enfermedad'} tone={scan.is_healthy ? 'good' : 'bad'} />
          <Badge label={scan.source === 'server' ? 'Servidor' : 'Teléfono'} />
        </View>
        <Text className="text-sm text-ink-500">{formatDateTime(scan.captured_at)}</Text>
        {scan.latitude != null && scan.longitude != null ? (
          <View className="flex-row items-center gap-1"><MapPin size={14} color="#66736C" /><Text className="text-sm text-ink-500">{scan.latitude.toFixed(5)}, {scan.longitude.toFixed(5)}</Text></View>
        ) : null}
      </View>
      <Card className="gap-3">
        <SectionTitle>Resultado</SectionTitle>
        {topK.map((p, i) => <ProgressBar key={p.code} label={p.name} value={p.confidence} color={i === 0 ? (p.isHealthy ? 'bg-brand-500' : 'bg-danger-600') : 'bg-ink-300'} />)}
      </Card>
      {info ? <Button label="Ver qué hacer" variant="secondary" onPress={() => nav.navigate('DiseaseDetail', { part: scan.part, code: scan.label_code })} /> : null}
      <Button label="Eliminar diagnóstico" icon={Trash2} variant="danger" onPress={remove} />
    </Screen>
  );
}
