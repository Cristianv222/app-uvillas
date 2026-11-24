import { getDb } from '../database';

export const metaRepo = {
  async get(key: string): Promise<string | null> {
    const db = await getDb();
    return (await db.getFirstAsync<{ value: string }>('SELECT value FROM meta WHERE key = ?', key))?.value ?? null;
  },
  async set(key: string, value: string) {
    const db = await getDb();
    await db.runAsync('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
  },
};
