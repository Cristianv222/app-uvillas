import { getDb } from '../database';

export type Kind = 'farms' | 'plots' | 'scans';
type Row = Record<string, any>;

const PUSH_FIELDS: Record<Kind, string[]> = {
  farms: ['name', 'location', 'latitude', 'longitude'],
  plots: ['farm_id', 'name', 'area_hectares'],
  scans: ['farm_id', 'plot_id', 'part', 'label_code', 'label_name', 'confidence', 'top_k', 'latitude', 'longitude', 'source', 'notes', 'captured_at'],
};
const PULL_FIELDS: Record<Kind, string[]> = {
  farms: [...PUSH_FIELDS.farms],
  plots: [...PUSH_FIELDS.plots],
  scans: [...PUSH_FIELDS.scans, 'is_healthy'],
};

export const syncRepo = {
  async dirty(userId: string, kind: Kind): Promise<Row[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<Row>(`SELECT * FROM ${kind} WHERE user_id = ? AND dirty = 1`, userId);
    return rows.map((r) => {
      const item: Row = { id: r.id, updated_at: r.updated_at, is_deleted: !!r.is_deleted };
      for (const f of PUSH_FIELDS[kind]) item[f] = f === 'top_k' ? JSON.parse(r.top_k ?? '[]') : r[f];
      return item;
    });
  },
  /** Limpia `dirty` solo si el registro no cambió mientras se enviaba. */
  async markClean(kind: Kind, id: string, updatedAt: string) {
    const db = await getDb();
    await db.runAsync(`UPDATE ${kind} SET dirty = 0 WHERE id = ? AND updated_at = ?`, id, updatedAt);
  },
  async countDirty(userId: string): Promise<number> {
    const db = await getDb();
    let total = 0;
    for (const k of ['farms', 'plots', 'scans'] as Kind[]) {
      total += (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${k} WHERE user_id = ? AND dirty = 1`, userId))?.n ?? 0;
    }
    total += (await db.getFirstAsync<{ n: number }>(
      'SELECT COUNT(*) AS n FROM scans WHERE user_id = ? AND is_deleted = 0 AND dirty = 0 AND image_uri IS NOT NULL AND image_synced = 0', userId))?.n ?? 0;
    return total;
  },
  /** Aplica un registro del servidor salvo que el local sea más nuevo y esté pendiente (gana el más reciente). */
  async upsertFromServer(userId: string, kind: Kind, r: Row) {
    const db = await getDb();
    const local = await db.getFirstAsync<{ updated_at: string; dirty: number }>(`SELECT updated_at, dirty FROM ${kind} WHERE id = ?`, r.id);
    if (local && local.dirty && new Date(local.updated_at) > new Date(r.updated_at)) return;
    const fields = PULL_FIELDS[kind];
    const values = fields.map((f) => (f === 'top_k' ? JSON.stringify(r.top_k ?? []) : f === 'is_healthy' ? (r.is_healthy ? 1 : 0) : r[f] ?? null));
    const cols = ['id', 'user_id', 'created_at', 'updated_at', 'is_deleted', 'dirty', ...fields];
    const vals = [r.id, userId, r.created_at, r.updated_at, r.is_deleted ? 1 : 0, 0, ...values];
    const extra = kind === 'scans' && r.has_image ? ', image_synced = 1' : '';
    await db.runAsync(
      `INSERT INTO ${kind} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})
       ON CONFLICT(id) DO UPDATE SET ${cols.slice(2).map((c) => `${c} = excluded.${c}`).join(', ')}${extra}`,
      ...vals,
    );
  },
  async pendingImages(userId: string): Promise<{ id: string; image_uri: string }[]> {
    const db = await getDb();
    return db.getAllAsync(
      'SELECT id, image_uri FROM scans WHERE user_id = ? AND is_deleted = 0 AND dirty = 0 AND image_uri IS NOT NULL AND image_synced = 0', userId);
  },
  async markImageSynced(id: string) {
    const db = await getDb();
    await db.runAsync('UPDATE scans SET image_synced = 1 WHERE id = ?', id);
  },
};
