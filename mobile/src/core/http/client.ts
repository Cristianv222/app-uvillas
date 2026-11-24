import * as FileSystem from 'expo-file-system/legacy';

import { API_URL } from '@/core/config/env';
import { ApiError, NetworkError } from '@/core/errors';
import { secureStorage, type Tokens } from '@/core/storage/secureStore';

type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler = () => {};
export const setSessionExpiredHandler = (fn: SessionExpiredHandler) => (onSessionExpired = fn);

let refreshing: Promise<Tokens | null> | null = null;

function decodeExp(token: string): number {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).exp * 1000;
  } catch {
    return 0;
  }
}

async function rawFetch(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new NetworkError();
  }
}

/** Renueva el access token (una sola petición aunque varias fallen a la vez). */
async function refreshTokens(): Promise<Tokens | null> {
  if (!refreshing) {
    refreshing = (async () => {
      const current = await secureStorage.getTokens();
      if (!current) return null;
      const res = await rawFetch('/api/auth/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: current.refresh }),
      });
      if (!res.ok) {
        if (res.status === 401) return null; // refresh vencido o revocado: sesión terminada
        throw new ApiError(res.status, 'refresh_failed', 'No se pudo renovar la sesión.');
      }
      const data = await res.json();
      const next = { access: data.access, refresh: data.refresh ?? current.refresh };
      await secureStorage.saveTokens(next);
      return next;
    })().finally(() => (refreshing = null));
  }
  return refreshing;
}

/** Devuelve un access token vigente (renovándolo si está por vencer). Lanza NetworkError si no hay internet. */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await secureStorage.getTokens();
  if (!tokens) return null;
  if (decodeExp(tokens.access) - Date.now() > 30_000) return tokens.access;
  const next = await refreshTokens();
  if (!next) {
    onSessionExpired();
    return null;
  }
  return next.access;
}

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

async function parse(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

function toError(status: number, data: any): ApiError {
  const detail =
    data?.detail ??
    (data && typeof data === 'object' ? Object.values(data).flat().join(' ') : null) ??
    'Error del servidor.';
  return new ApiError(status, data?.code ?? 'api_error', String(detail));
}

export async function api<T = any>(path: string, { method = 'GET', body, auth = true }: Options = {}): Promise<T> {
  const send = async (token: string | null) =>
    rawFetch(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  let token = auth ? await getValidAccessToken() : null;
  if (auth && !token) throw new ApiError(401, 'not_authenticated', 'Inicia sesión para continuar.');
  let res = await send(token);

  if (res.status === 401 && auth) {
    const next = await refreshTokens();
    if (!next) {
      onSessionExpired();
      throw new ApiError(401, 'session_expired', 'Tu sesión expiró. Inicia sesión de nuevo.');
    }
    res = await send(next.access);
  }
  const data = await parse(res);
  if (!res.ok) throw toError(res.status, data);
  return data as T;
}

/** Sube un archivo local como multipart (usado para las fotos de los diagnósticos). */
export async function uploadFile(path: string, fileUri: string, field = 'image'): Promise<void> {
  const token = await getValidAccessToken();
  if (!token) throw new ApiError(401, 'not_authenticated', 'Inicia sesión para continuar.');
  try {
    const res = await FileSystem.uploadAsync(`${API_URL}${path}`, fileUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: field,
      mimeType: 'image/jpeg',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status >= 400) throw toError(res.status, JSON.parse(res.body || '{}'));
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new NetworkError();
  }
}
