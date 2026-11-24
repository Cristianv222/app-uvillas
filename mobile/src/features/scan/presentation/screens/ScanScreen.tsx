import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/core/auth/AuthContext';
import { errorMessage } from '@/core/errors';
import { useIsOnline } from '@/core/network/NetworkProvider';
import { useSettings } from '@/core/storage/settingsStore';
import { farmsRepo, type Farm, type Plot } from '@/db/repositories/farmsRepo';
import { useSync } from '@/features/sync/presentation/SyncProvider';
import { PARTS, PART_LABEL, type Part } from '@/ml/types';
import { percent } from '@/shared/utils/format';
import { Badge, Button, Chip, EmptyState, ProgressBar, Screen } from '@/ui/components';
import { Camera, Save, Server, Smartphone } from '@/ui/icons';

import { saveScan } from '../../application/saveScan';
import { useLiveRecognition } from '../../application/useLiveRecognition';

export function ScanScreen() {
  const { user } = useAuth();
  const online = useIsOnline();
  const { inferenceMode } = useSettings();
  const { notifyChange } = useSync();
  const focused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);

  const [part, setPart] = useState<Part>('hojas');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [farmId, setFarmId] = useState<string | null>(null);
  const [plotId, setPlotId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) void farmsRepo.listFarms(user.id).then(setFarms);
    }, [user]),
  );

  const selectFarm = async (id: string | null) => {
    setFarmId(id);
    setPlotId(null);
    setPlots(id && user ? await farmsRepo.listPlots(user.id, id) : []);
  };

  const { predictions, engine, error } = useLiveRecognition({
    camera, part, active: focused && !!permission?.granted && !saving, mode: inferenceMode, online,
  });
  const best = predictions[0];

  const save = async () => {
    if (!user || !camera.current) return;
    setSaving(true);
    try {
      await saveScan({ userId: user.id, camera: camera.current, part, predictions, farmId, plotId, engine });
      notifyChange();
      Alert.alert('Diagnóstico guardado', best ? `${best.name} (${percent(best.confidence)})` : undefined);
    } catch (e) {
      Alert.alert('No se pudo guardar', errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (!permission) return <Screen><View /></Screen>;
  if (!permission.granted) {
    return (
      <Screen>
        <EmptyState
          icon={Camera}
          title="Necesitamos la cámara"
          hint="Se usa solo para reconocer hojas, tallos y frutos. Las fotos se quedan en tu teléfono hasta sincronizar."
          action={<Button label="Permitir cámara" onPress={requestPermission} />}
        />
      </Screen>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {focused ? <CameraView ref={camera} style={{ flex: 1 }} facing="back" animateShutter={false} /> : null}

      <SafeAreaView edges={['top']} className="absolute left-0 right-0 top-0 gap-2 px-4 pt-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-2">
            {PARTS.map((p) => <Chip key={p} label={PART_LABEL[p]} selected={p === part} onPress={() => setPart(p)} />)}
          </View>
          <View className="flex-row items-center gap-1 rounded-full bg-black/60 px-3 py-2">
            {engine === 'server' ? <Server size={14} color="#fff" /> : <Smartphone size={14} color="#fff" />}
            <Text className="text-xs font-medium text-white">{engine === 'server' ? 'Servidor' : online ? 'En el teléfono' : 'Sin conexión'}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
        <View className="h-64 w-64 rounded-3xl border-2 border-white/80" />
      </View>

      <View className="absolute bottom-0 left-0 right-0 gap-3 rounded-t-3xl bg-white p-4">
        {best ? (
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 text-xl font-bold text-ink-900" numberOfLines={1}>{best.name}</Text>
              <Badge label={best.isHealthy ? 'Sano' : 'Enfermedad'} tone={best.isHealthy ? 'good' : 'bad'} />
            </View>
            {predictions.slice(0, 3).map((p, i) => (
              <ProgressBar key={p.code} label={p.name} value={p.confidence} color={i === 0 ? (p.isHealthy ? 'bg-brand-500' : 'bg-danger-600') : 'bg-ink-300'} />
            ))}
          </View>
        ) : (
          <Text className="py-2 text-center text-base text-ink-500">{error ?? 'Apunta la cámara a una hoja, tallo o fruto…'}</Text>
        )}

        {farms.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            <Chip label="Sin finca" selected={!farmId} onPress={() => selectFarm(null)} />
            {farms.map((f) => <Chip key={f.id} label={f.name} selected={farmId === f.id} onPress={() => selectFarm(f.id)} />)}
            {plots.map((p) => <Chip key={p.id} label={`Lote ${p.name}`} selected={plotId === p.id} onPress={() => setPlotId(plotId === p.id ? null : p.id)} />)}
          </ScrollView>
        ) : null}

        <Button label="Guardar diagnóstico" icon={Save} onPress={save} loading={saving} disabled={!best} />
      </View>
    </View>
  );
}
