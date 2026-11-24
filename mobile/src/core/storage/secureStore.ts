import * as SecureStore from 'expo-secure-store';

const KEYS = { access: 'auth.access', refresh: 'auth.refresh', user: 'auth.user' } as const;

export interface Tokens {
  access: string;
  refresh: string;
}

export interface SessionUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export const secureStorage = {
  async saveTokens(t: Tokens) {
    await SecureStore.setItemAsync(KEYS.access, t.access);
    await SecureStore.setItemAsync(KEYS.refresh, t.refresh);
  },
  async getTokens(): Promise<Tokens | null> {
    const [access, refresh] = await Promise.all([
      SecureStore.getItemAsync(KEYS.access),
      SecureStore.getItemAsync(KEYS.refresh),
    ]);
    return access && refresh ? { access, refresh } : null;
  },
  async saveUser(u: SessionUser) {
    await SecureStore.setItemAsync(KEYS.user, JSON.stringify(u));
  },
  async getUser(): Promise<SessionUser | null> {
    const raw = await SecureStore.getItemAsync(KEYS.user);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  },
  async clear() {
    await Promise.all(Object.values(KEYS).map((k) => SecureStore.deleteItemAsync(k)));
  },
};
