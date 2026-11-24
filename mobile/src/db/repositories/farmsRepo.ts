import { randomUUID } from 'expo-crypto';

import { getDb } from '../database';

export interface Farm {
  id: string;
  name: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  updated_at: string;
  is_deleted: number;
}
export interface Plot {
  id: string;
  farm_id: string;
  name: string;
  area_hectares: number | null;
  updated_at: string;
  is_deleted: number;
}

const now = () => new Date().toISOString();

export const farmsRepo = {
  async listFarms(userId: string): Promise<Farm[]> {
    const db = await getDb();
    return db.getAllAsync<Farm>('SELECT * FROM farms WHERE user_id = ? AND is_deleted = 0 ORDER BY name', userId);
  },
  async listPlots(userId: string, farmId?: string): Promise<Plot[]> {
    const db = await getDb();
    return farmId
      ? db.getAllAsync<Plot>('SELECT * FROM plots WHERE user_id = ? AND farm_id = ? AND is_deleted = 0 ORDER BY name', userId, farmId)
      : db.getAllAsync<Plot>('SELECT * FROM plots WHERE user_id = ? AND is_deleted = 0 ORDER BY name', userId);
  },
  async createFarm(userId: string, name: string, location = ''): Promise<string> {
    const db = await getDb();
    const id = randomUUID(), t = now();
    await db.runAsync(
      'INSERT INTO farms (id, user_id, name, location, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      id, userId, name.trim(), location.trim(), t, t,
    );
    return id;
  },
  async createPlot(userId: string, farmId: string, name: string, area: number | null): Promise<string> {
    const db = await getDb();
    const id = randomUUID(), t = now();
    await db.runAsync(
      'INSERT INTO plots (id, user_id, farm_id, name, area_hectares, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      id, userId, farmId, name.trim(), area, t, t,
    );
    return id;
  },
  async deleteFarm(id: string) {
    const db = await getDb(), t = now();
    await db.withTransactionAsync(async () => {
      await db.runAsync('UPDATE farms SET is_deleted = 1, dirty = 1, updated_at = ? WHERE id = ?', t, id);
      await db.runAsync('UPDATE plots SET is_deleted = 1, dirty = 1, updated_at = ? WHERE farm_id = ?', t, id);
    });
  },
  async deletePlot(id: string) {
    const db = await getDb();
    await db.runAsync('UPDATE plots SET is_deleted = 1, dirty = 1, updated_at = ? WHERE id = ?', now(), id);
  },
};
