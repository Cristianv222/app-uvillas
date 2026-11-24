import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Text, View } from 'react-native';

import { useAuth } from '@/core/auth/AuthContext';
import { useIsOnline } from '@/core/network/NetworkProvider';
import { settingsStore, useSettings } from '@/core/storage/settingsStore';
import { ServerField } from '@/features/settings/presentation/components/ServerField';
import { useSync } from '@/features/sync/presentation/SyncProvider';
import { formatDateTime } from '@/shared/utils/format';
import { Badge, Button, Card, Chip, Screen, SectionTitle } from '@/ui/components';
import { Layers, LogOut, RefreshCw } from '@/ui/icons';

export function SettingsScreen() {
  const nav = useNavigation<any>();
  const { user, logout } = useAuth();
  const online = useIsOnline();
  const { inferenceMode } = useSettings();
  const { status, pending, lastSyncAt, error, sync } = useSync();

  return (
    <Screen scroll>
      <Text className="text-2xl font-bold text-ink-900">Ajustes</Text>

      <Card className="gap-1">
        <Text className="text-lg font-semibold text-ink-900">{user?.full_name || 'Mi cuenta'}</Text>
        <Text className="text-base text-ink-500">{user?.email}</Text>
      </Card>

      <Card className="gap-3">
        <SectionTitle>Reconocimiento</SectionTitle>
        <View className="flex-row gap-2">
          <Chip label="En el teléfono" selected={inferenceMode === 'local'} onPress={() => settingsStore.set('inferenceMode', 'local')} />
          <Chip label="En el servidor" selected={inferenceMode === 'server'} onPress={() => settingsStore.set('inferenceMode', 'server')} />
        </View>
        <Text className="text-sm text-ink-500">
          {inferenceMode === 'local'
            ? 'Usa el modelo guardado en el teléfono. Funciona sin internet y es lo más rápido.'
            : 'Envía los fotogramas al servidor por WebSocket. Sin internet vuelve solo al modelo del teléfono.'}
        </Text>
      </Card>

      <Card className="gap-3">
        <SectionTitle>Sincronización</SectionTitle>
        <View className="flex-row flex-wrap gap-2">
          <Badge label={online ? 'Con internet' : 'Sin internet'} tone={online ? 'good' : 'warn'} />
          <Badge label={pending ? `${pending} pendientes` : 'Todo al día'} tone={pending ? 'warn' : 'good'} />
        </View>
        {lastSyncAt ? <Text className="text-sm text-ink-500">Última: {formatDateTime(lastSyncAt.toISOString())}</Text> : null}
        {error ? <Text className="text-sm text-danger-600">{error}</Text> : null}
        <Button label="Sincronizar ahora" icon={RefreshCw} variant="secondary" onPress={sync} loading={status === 'syncing'} disabled={!online} />
      </Card>

      <Card className="gap-3">
        <SectionTitle>Servidor</SectionTitle>
        <ServerField />
      </Card>

      <Button label="Mis fincas y lotes" icon={Layers} variant="secondary" onPress={() => nav.navigate('Farms')} />
      <Button label="Cerrar sesión" icon={LogOut} variant="danger" onPress={logout} />
    </Screen>
  );
}
