import { useSyncExternalStore } from 'react';

import { DEFAULT_API_URL } from '@/core/config/env';
import { metaRepo } from '@/db/repositories/metaRepo';

export type InferenceMode = 'local' | 'server';

export interface Settings {
  inferenceMode: InferenceMode;
  /** Dirección del servidor, sin barra final (por ejemplo http://192.168.1.10:8000). */
  apiUrl: string;
}

let state: Settings = { inferenceMode: 'local', apiUrl: DEFAULT_API_URL };
const listeners = new Set<() => void>();

export const settingsStore = {
  get: () => state,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  async load() {
    const mode = await metaRepo.get('setting:inferenceMode');
    if (mode === 'local' || mode === 'server') state = { ...state, inferenceMode: mode };
    const apiUrl = await metaRepo.get('setting:apiUrl');
    if (apiUrl) state = { ...state, apiUrl };
    listeners.forEach((l) => l());
  },
  async set<K extends keyof Settings>(key: K, value: Settings[K]) {
    state = { ...state, [key]: value };
    listeners.forEach((l) => l());
    await metaRepo.set(`setting:${key}`, String(value));
  },
};

export const useSettings = () => useSyncExternalStore(settingsStore.subscribe, settingsStore.get);
