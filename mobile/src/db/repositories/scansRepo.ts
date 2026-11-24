import { randomUUID } from 'expo-crypto';

import type { Part, Prediction } from '@/ml/types';

import { getDb } from '../database';

export interface ScanRow {
  id: string;
  farm_id: string | null;
  plot_id: string | null;
  part: Part;
  label_code: string;
  label_name: string;
  confidence: number;
  is_healthy: number;
  top_k: string;
  image_uri: string | null;
  image_synced: number;
  latitude: number | null;
  longitude: number | null;
  captured_at: string;
  source: 'local' | 'server';
  notes: string | null;
  updated_at: string;
  is_deleted: number;
  dirty: number;
}

export interface NewScan {
  part: Part;
  best: Prediction;
  topK: Prediction[];
  imageUri: string | null;
  farmId: string | null;
  plotId: string | null;
  latitude: number | null;
  longitude: number | null;
  source: 'local' | 'server';
  id?: string;
}

export interface Summary {
  total: number;
  healthy: number;
  byPart: Record<string, { total: number; healthy: number }>;
  byDisease: { part: string; code: string; name: string; count: number }[];
  timeline: { date: string; total: number; diseased: number }[];
}

const now = () => new Date().toISOString();

export const scansRepo = {
  async create(userId: string, s: NewScan): Promise<string> {
    const db = await getDb();
    const id = s.id ?? randomUUID(), t = now();
    await db.runAsync(
      `INSERT INTO scans (id, user_id, farm_id, plot_id, part, label_code, label_name, confidence, is_healthy, top_k,
        image_uri, latitude, longitude, captured_at, source, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, userId, s.farmId, s.plotId, s.part, s.best.code, s.best.name, s.best.confidence, s.best.isHealthy ? 1 : 0,
      JSON.stringify(s.topK), s.imageUri, s.latitude, s.longitude, t, s.source, t, t,
    );
    return id;
  },
  async list(userId: string, part?: Part): Promise<ScanRow[]> {
    const db = await getDb();
    return part
      ? db.getAllAsync<ScanRow>('SELECT * FROM scans WHERE user_id = ? AND is_deleted = 0 AND part = ? ORDER BY captured_at DESC', userId, part)
      : db.getAllAsync<ScanRow>('SELECT * FROM scans WHERE user_id = ? AND is_deleted = 0 ORDER BY captured_at DESC', userId);
  },
  async get(id: string): Promise<ScanRow | null> {
    const db = await getDb();
    return db.getFirstAsync<ScanRow>('SELECT * FROM scans WHERE id = ?', id);
  },
  async softDelete(id: string) {
    const db = await getDb();
    await db.runAsync('UPDATE scans SET is_deleted = 1, dirty = 1, updated_at = ? WHERE id = ?', now(), id);
  },
  async summary(userId: string, farmId?: string): Promise<Summary> {
    const db = await getDb();
    const where = farmId ? 'user_id = ? AND is_deleted = 0 AND farm_id = ?' : 'user_id = ? AND is_deleted = 0';
    const args = farmId ? [userId, farmId] : [userId];
    const totals = await db.getFirstAsync<{ total: number; healthy: number }>(
      `SELECT COUNT(*) AS total, COALESCE(SUM(is_healthy), 0) AS healthy FROM scans WHERE ${where}`, ...args);
    const parts = await db.getAllAsync<{ part: string; total: number; healthy: number }>(
      `SELECT part, COUNT(*) AS total, SUM(is_healthy) AS healthy FROM scans WHERE ${where} GROUP BY part`, ...args);
    const byDisease = await db.getAllAsync<{ part: string; code: string; name: string; count: number }>(
      `SELECT part, label_code AS code, label_name AS name, COUNT(*) AS count FROM scans
       WHERE ${where} AND is_healthy = 0 GROUP BY part, label_code ORDER BY count DESC LIMIT 8`, ...args);
    const timeline = await db.getAllAsync<{ date: string; total: number; diseased: number }>(
      `SELECT substr(captured_at, 1, 10) AS date, COUNT(*) AS total, SUM(1 - is_healthy) AS diseased FROM scans
       WHERE ${where} GROUP BY date ORDER BY date DESC LIMIT 14`, ...args);
    return {
      total: totals?.total ?? 0,
      healthy: totals?.healthy ?? 0,
      byPart: Object.fromEntries(parts.map((p) => [p.part, { total: p.total, healthy: p.healthy ?? 0 }])),
      byDisease,
      timeline: timeline.reverse(),
    };
  },
};
