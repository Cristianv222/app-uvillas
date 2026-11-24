import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { checkServer, normalizeServerUrl } from '@/core/config/server';
import { settingsStore, useSettings } from '@/core/storage/settingsStore';
import { Button, Input } from '@/ui/components';

/**
 * Dirección del servidor. En una demostración, el teléfono y la PC con Docker deben estar
 * en el mismo Wi-Fi; aquí se escribe la IP de la PC (por ejemplo 192.168.1.10).
 */
export function ServerField() {
  const { apiUrl } = useSettings();
  const [value, setValue] = useState(apiUrl.replace(/^http:\/\//, ''));
  const [state, setState] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');

  const save = async () => {
    const url = normalizeServerUrl(value);
    if (!url) return;
    setState('checking');
    const ok = await checkServer(url);
    await settingsStore.set('apiUrl', url);
    setValue(url.replace(/^http:\/\//, ''));
    setState(ok ? 'ok' : 'fail');
  };

  return (
    <View className="gap-2">
      <Input
        label="Servidor (IP de la PC)" value={value} onChangeText={(t) => { setValue(t); setState('idle'); }}
        autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="192.168.1.10:8000" onSubmitEditing={save}
      />
      <Button label="Guardar y probar conexión" variant="secondary" onPress={save} loading={state === 'checking'} />
      {state === 'ok' ? <Text className="text-sm text-brand-700">Conectado a {apiUrl}.</Text> : null}
      {state === 'fail' ? (
        <Text className="text-sm text-danger-600">
          No responde {apiUrl}. Revisa que la PC y el teléfono estén en el mismo Wi-Fi, que Docker esté encendido y que la IP sea la de la PC.
        </Text>
      ) : null}
    </View>
  );
}
