import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Text } from 'react-native';

import { useAuth } from '@/core/auth/AuthContext';
import { errorMessage } from '@/core/errors';
import { useIsOnline } from '@/core/network/NetworkProvider';
import { Button, Input, Screen } from '@/ui/components';

export function RegisterScreen() {
  const nav = useNavigation<any>();
  const { register } = useAuth();
  const online = useIsOnline();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Escribe un correo válido.';
    if (password.length < 8) e.password = 'Usa al menos 8 caracteres.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await register(email, password, name);
    } catch (err) {
      setErrors({ form: errorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <Text className="text-2xl font-bold text-ink-900">Crear cuenta</Text>
      {!online ? <Text className="rounded-xl bg-gold-100 p-3 text-sm text-gold-600">Necesitas internet para crear tu cuenta.</Text> : null}
      <Input label="Nombre (opcional)" value={name} onChangeText={setName} autoComplete="name" />
      <Input label="Correo electrónico" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
      <Input label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" error={errors.password} onSubmitEditing={submit} />
      {errors.form ? <Text className="text-sm text-danger-600">{errors.form}</Text> : null}
      <Button label="Crear cuenta" onPress={submit} loading={loading} disabled={!online} />
      <Button label="Ya tengo cuenta" variant="ghost" onPress={() => nav.goBack()} />
    </Screen>
  );
}
