import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, setSessionExpiredHandler } from '@/core/http/client';
import { secureStorage, type SessionUser } from '@/core/storage/secureStore';
import { settingsStore } from '@/core/storage/settingsStore';
import { getDb } from '@/db/database';

type Status = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: Status;
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>(null as never);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<SessionUser | null>(null);

  const clearSession = useCallback(async () => {
    await secureStorage.clear();
    setUser(null);
    setStatus('signedOut');
  }, []);

  // Arranque: la sesión guardada sirve aunque no haya internet (modo offline).
  useEffect(() => {
    setSessionExpiredHandler(() => void clearSession());
    (async () => {
      await getDb(); // migra la BD local
      await settingsStore.load();
      const [tokens, cached] = await Promise.all([secureStorage.getTokens(), secureStorage.getUser()]);
      if (!tokens || !cached) return setStatus('signedOut');
      setUser(cached);
      setStatus('signedIn');
      api<SessionUser>('/api/auth/me/') // si hay red, refresca el perfil; si no, se ignora
        .then(async (fresh) => {
          await secureStorage.saveUser(fresh);
          setUser(fresh);
        })
        .catch(() => {});
    })();
  }, [clearSession]);

  const startSession = useCallback(async (data: { access: string; refresh: string; user: SessionUser }) => {
    await secureStorage.saveTokens({ access: data.access, refresh: data.refresh });
    await secureStorage.saveUser(data.user);
    setUser(data.user);
    setStatus('signedIn');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login: async (email, password) =>
        startSession(await api('/api/auth/login/', { method: 'POST', auth: false, body: { email: email.trim().toLowerCase(), password } })),
      register: async (email, password, fullName) => {
        await startSession(await api('/api/auth/register/', {
          method: 'POST', auth: false, body: { email: email.trim().toLowerCase(), password, full_name: fullName.trim() },
        }));
      },
      logout: async () => {
        const tokens = await secureStorage.getTokens();
        if (tokens) api('/api/auth/logout/', { method: 'POST', body: { refresh: tokens.refresh } }).catch(() => {});
        await clearSession();
      },
    }),
    [status, user, startSession, clearSession],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
