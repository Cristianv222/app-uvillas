import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Text, View } from 'react-native';

import { useAuth } from '@/core/auth/AuthContext';
import { farmsRepo, type Farm, type Plot } from '@/db/repositories/farmsRepo';
import { useSync } from '@/features/sync/presentation/SyncProvider';
import { Button, Card, EmptyState, IconButton, Input, Screen, SectionTitle } from '@/ui/components';
import { Layers, Plus, Trash2 } from '@/ui/icons';

export function FarmsScreen() {
  const { user } = useAuth();
  const { notifyChange } = useSync();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [farmName, setFarmName] = useState('');
  const [plotName, setPlotName] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setFarms(await farmsRepo.listFarms(user.id));
    setPlots(await farmsRepo.listPlots(user.id));
  }, [user]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const addFarm = async () => {
    if (!user) return;
    if (!farmName.trim()) return setError('Escribe el nombre de la finca.');
    setError(null);
    await farmsRepo.createFarm(user.id, farmName);
    setFarmName('');
    await load();
    notifyChange();
  };
  const addPlot = async (farmId: string) => {
    const name = plotName[farmId]?.trim();
    if (!user || !name) return;
    await farmsRepo.createPlot(user.id, farmId, name, null);
    setPlotName((s) => ({ ...s, [farmId]: '' }));
    await load();
    notifyChange();
  };
  const confirm = (title: string, action: () => Promise<void>) =>
    Alert.alert(title, 'Esta acción también se aplica en tu cuenta.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: title, style: 'destructive', onPress: async () => { await action(); await load(); notifyChange(); } },
    ]);

  return (
    <Screen scroll edges={['left', 'right', 'bottom']}>
      <Card className="gap-3">
        <SectionTitle>Nueva finca</SectionTitle>
        <Input label="Nombre de la finca" value={farmName} onChangeText={setFarmName} error={error} onSubmitEditing={addFarm} />
        <Button label="Agregar finca" icon={Plus} onPress={addFarm} />
      </Card>
      {farms.length === 0 ? <EmptyState icon={Layers} title="Aún no tienes fincas" hint="Crea una finca y sus lotes para organizar tus diagnósticos." /> : null}
      {farms.map((f) => (
        <Card key={f.id} className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-lg font-semibold text-ink-900">{f.name}</Text>
            <IconButton icon={Trash2} label={`Eliminar finca ${f.name}`} color="#C0392B" onPress={() => confirm('Eliminar finca', () => farmsRepo.deleteFarm(f.id))} />
          </View>
          {plots.filter((p) => p.farm_id === f.id).map((p) => (
            <View key={p.id} className="flex-row items-center justify-between rounded-xl bg-ink-50 pl-3">
              <Text className="text-base text-ink-700">Lote {p.name}</Text>
              <IconButton icon={Trash2} label={`Eliminar lote ${p.name}`} color="#C0392B" size={18} onPress={() => confirm('Eliminar lote', () => farmsRepo.deletePlot(p.id))} />
            </View>
          ))}
          <View className="flex-row items-end gap-2">
            <View className="flex-1"><Input label="Nuevo lote" value={plotName[f.id] ?? ''} onChangeText={(t) => setPlotName((s) => ({ ...s, [f.id]: t }))} onSubmitEditing={() => addPlot(f.id)} /></View>
            <IconButton icon={Plus} label="Agregar lote" onPress={() => addPlot(f.id)} color="#fff" className="mb-0.5 h-12 w-12 rounded-xl bg-brand-600" />
          </View>
        </Card>
      ))}
    </Screen>
  );
}
