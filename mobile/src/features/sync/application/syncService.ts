import { api, uploadFile } from '@/core/http/client';
import { metaRepo } from '@/db/repositories/metaRepo';
import { syncRepo, type Kind } from '@/db/repositories/syncRepo';

const KINDS: Kind[] = ['farms', 'plots', 'scans']; // orden por llaves foráneas

interface PushResponse {
  applied: { kind: Kind; id: string }[];
  conflicts: { kind: Kind; id: string }[];
  rejected: { kind: Kind; id: string; code: string; detail: string }[];
}

export interface SyncReport {
  pushed: number;
  pulled: number;
  imagesUploaded: number;
  rejected: number;
}

async function push(userId: string): Promise<{ pushed: number; rejected: number }> {
  const payload: Record<Kind, Record<string, any>[]> = { farms: [], plots: [], scans: [] };
  for (const k of KINDS) payload[k] = await syncRepo.dirty(userId, k);
  if (KINDS.every((k) => payload[k].length === 0)) return { pushed: 0, rejected: 0 };

  const res = await api<PushResponse>('/api/sync/push/', { method: 'POST', body: payload });
  // "applied" y "conflicts" se limpian: en conflicto gana el servidor y el pull posterior lo trae.
  for (const ref of [...res.applied, ...res.conflicts]) {
    const item = payload[ref.kind].find((i) => i.id === ref.id);
    if (item) await syncRepo.markClean(ref.kind, ref.id, item.updated_at);
  }
  return { pushed: res.applied.length, rejected: res.rejected.length };
}

async function pull(userId: string): Promise<number> {
  const key = `last_pull:${userId}`;
  const since = await metaRepo.get(key);
  const res = await api<Record<Kind, any[]> & { server_time: string }>(
    `/api/sync/pull/${since ? `?since=${encodeURIComponent(since)}` : ''}`,
  );
  let count = 0;
  for (const k of KINDS) {
    for (const row of res[k] ?? []) {
      await syncRepo.upsertFromServer(userId, k, row);
      count++;
    }
  }
  await metaRepo.set(key, new Date(new Date(res.server_time).getTime() - 2000).toISOString());
  return count;
}

async function uploadImages(userId: string): Promise<number> {
  let n = 0;
  for (const { id, image_uri } of await syncRepo.pendingImages(userId)) {
    try {
      await uploadFile(`/api/scans/${id}/image/`, image_uri);
      await syncRepo.markImageSynced(id);
      n++;
    } catch (e: any) {
      if (e?.status === 404) await syncRepo.markImageSynced(id); // el diagnóstico ya no existe en el servidor
      else throw e;
    }
  }
  return n;
}

/** Sube lo pendiente, baja lo nuevo y sube las fotos. Gana el cambio más reciente por registro. */
export async function syncNow(userId: string): Promise<SyncReport> {
  const { pushed, rejected } = await push(userId);
  const pulled = await pull(userId);
  const imagesUploaded = await uploadImages(userId);
  return { pushed, pulled, imagesUploaded, rejected };
}
