import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Text, View } from 'react-native';

import { useAuth } from '@/core/auth/AuthContext';
import { errorMessage } from '@/core/errors';
import { useIsOnline } from '@/core/network/NetworkProvider';
import { useSettings } from '@/core/storage/settingsStore';
import { ServerField } from '@/features/settings/presentation/components/ServerField';
import { Button, Input, Screen } from '@/ui/components';
import { Eye, EyeOff, Sprout } from '@/ui/icons';
import { Pressable } from 'react-native';

export function LoginScreen() {
  const nav = useNavigation<any>();
  const { login } = useAuth();
  const online = useIsOnline();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showServer, setShowServer] = useState(false);
  const { apiUrl } = useSettings();

  const validate = () => {
    const e: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Escribe un correo válido.';
    if (!password) e.password = 'Escribe tu contraseña.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll className="justify-center">
      <View className="items-center gap-2 py-8">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand-100">
          <Sprout size={34} color="#25603A" />
        </View>
        <Text className="text-3xl font-bold text-ink-900">Uvillas</Text>
        <Text className="text-center text-base text-ink-500">Diagnostica hojas, tallos y frutos con la cámara.</Text>
      </View>
      {!online ? (
        <Text className="rounded-xl bg-gold-100 p-3 text-sm text-gold-600">
          Sin internet. Si ya iniciaste sesión antes en este teléfono, la app abre sola y funciona sin conexión.
        </Text>
      ) : null}
      <Input label="Correo electrónico" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errors.email} />
      <Input
        label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry={!show} autoCapitalize="none"
        autoComplete="current-password" error={errors.password} onSubmitEditing={submit}
        right={<Pressable accessibilityLabel={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} onPress={() => setShow((s) => !s)} hitSlop={8}>{show ? <EyeOff size={20} color="#66736C" /> : <Eye size={20} color="#66736C" />}</Pressable>}
      />
      {errors.form ? <Text className="text-sm text-danger-600">{errors.form}</Text> : null}
      <Button label="Iniciar sesión" onPress={submit} loading={loading} />
      <Button label="Crear una cuenta" variant="ghost" onPress={() => nav.navigate('Register')} />
      <Pressable onPress={() => setShowServer((s) => !s)} hitSlop={8} accessibilityRole="button">
        <Text className="text-center text-sm text-ink-500">Servidor: {apiUrl} · {showServer ? 'Ocultar' : 'Cambiar'}</Text>
      </Pressable>
      {showServer ? <ServerField /> : null}
    </Screen>
  );
}
