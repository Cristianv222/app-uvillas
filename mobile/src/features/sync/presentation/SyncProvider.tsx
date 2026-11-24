import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/core/auth/AuthContext';
import { SYNC_INTERVAL_MS } from '@/core/config/env';
import { errorMessage } from '@/core/errors';
import { useIsOnline } from '@/core/network/NetworkProvider';
import { syncRepo } from '@/db/repositories/syncRepo';

import { syncNow } from '../application/syncService';

type Status = 'idle' | 'syncing' | 'error';

interface SyncContextValue {
  status: Status;
  pending: number;
  lastSyncAt: Date | null;
  error: string | null;
  /** Fuerza una sincronización (ej. botón). */
  sync: () => Promise<void>;
  /** Avisa que hubo cambios locales: actualiza el contador y sincroniza si hay internet. */
  notifyChange: () => void;
}

const SyncContext = createContext<SyncContextValue>(null as never);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const online = useIsOnline();
  const [status, setStatus] = useState<Status>('idle');
  const [pending, setPending] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);

  const refreshPending = useCallback(async () => {
    if (user) setPending(await syncRepo.countDirty(user.id));
  }, [user]);

  const sync = useCallback(async () => {
    if (!user || !online || running.current) return;
    running.current = true;
    setStatus('syncing');
    try {
      await syncNow(user.id);
      setLastSyncAt(new Date());
      setError(null);
      setStatus('idle');
    } catch (e) {
      setError(errorMessage(e));
      setStatus('error');
    } finally {
      running.current = false;
      await refreshPending();
    }
  }, [user, online, refreshPending]);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifyChange = useCallback(() => {
    void refreshPending();
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void sync(), 1500);
  }, [refreshPending, sync]);

  // Sincroniza al abrir sesión, al recuperar internet, al volver a la app y cada 5 minutos.
  useEffect(() => {
    void refreshPending();
    if (!user || !online) return;
    void sync();
    const timer = setInterval(() => void sync(), SYNC_INTERVAL_MS);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && void sync());
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [user, online, sync, refreshPending]);

  const value = useMemo(
    () => ({ status, pending, lastSyncAt, error, sync, notifyChange }),
    [status, pending, lastSyncAt, error, sync, notifyChange],
  );
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export const useSync = () => useContext(SyncContext);
