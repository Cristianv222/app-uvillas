import { useSyncExternalStore } from 'react';

import { metaRepo } from '@/db/repositories/metaRepo';

export type InferenceMode = 'local' | 'server';

export interface Settings {
  inferenceMode: InferenceMode;
}

let state: Settings = { inferenceMode: 'local' };
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
    listeners.forEach((l) => l());
  },
  async set<K extends keyof Settings>(key: K, value: Settings[K]) {
    state = { ...state, [key]: value };
    listeners.forEach((l) => l());
    await metaRepo.set(`setting:${key}`, String(value));
  },
};

export const useSettings = () => useSyncExternalStore(settingsStore.subscribe, settingsStore.get);
