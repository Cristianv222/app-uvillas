import { Capacitor } from '@capacitor/core';

/**
 * En la web, la API está en el mismo origen (/api/, detrás de nginx).
 * En la app de Android no hay servidor propio: se usa la dirección que el usuario guarda,
 * normalmente la IP de la PC con Docker en el mismo Wi-Fi (puerto 8080 de nginx).
 */
const KEY = 'uvillas:server';

export const isNativeApp = () => Capacitor.isNativePlatform();

export function getServerUrl(): string {
  if (!isNativeApp()) return '';
  try { return localStorage.getItem(KEY) ?? ''; } catch { return ''; }
}

export function setServerUrl(url: string) {
  try { localStorage.setItem(KEY, url); } catch { /* sin almacenamiento: dura solo esta sesión */ }
  memory = url;
}
let memory = '';
export const currentServer = () => getServerUrl() || memory;

/** Acepta "192.168.1.10", "192.168.1.10:8080" o "http://192.168.1.10:8080/". */
export function normalizeServerUrl(input: string): string {
  let url = input.trim().replace(/\/+$/, '').replace(/\/api$/, '');
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  const host = url.replace(/^https?:\/\//, '');
  if (url.startsWith('http://') && !/:\d+$/.test(host)) url = `${url}:8080`;
  return url;
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
