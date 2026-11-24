import { settingsStore } from '@/core/storage/settingsStore';

/** Dirección del servidor elegida en la app (por ejemplo, la IP de la PC en el mismo Wi-Fi). */
export const getApiUrl = () => settingsStore.get().apiUrl;
export const getWsUrl = () => getApiUrl().replace(/^http/, 'ws');

/** Acepta "192.168.1.10", "192.168.1.10:8000" o "http://192.168.1.10:8000/". */
export function normalizeServerUrl(input: string): string {
  let url = input.trim().replace(/\/+$/, '');
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  if (!/:\d+$/.test(url.replace(/^https?:\/\//, '')) && url.startsWith('http://')) url = `${url}:8000`;
  return url.replace(/\/api$/, '');
}

/** Comprueba que el servidor responde en /api/health/ (5 s de espera). */
export async function checkServer(url: string): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(`${url}/api/health/`, { signal: ctrl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
