import { currentServer, isNativeApp } from './lib/server';

const KEY = 'uvillas:session';
let access = '', refresh = '', sessionServer = '';
let renewal: Promise<void> | null = null;
export function hasSession() { return !!access && sessionServer === currentServer(); }
export function setSession(data: { access: string; refresh: string }) {
  access = data.access; refresh = data.refresh; sessionServer = currentServer();
  try { sessionStorage.setItem(KEY, JSON.stringify({ access, refresh, server: sessionServer })); } catch { /* memory session */ }
}
export function clearSession() {
  access = ''; refresh = '';
  try { sessionStorage.removeItem(KEY); } catch { /* memory session */ }
  window.dispatchEvent(new Event('uvillas:session-ended'));
}
try {
  const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
  if (saved?.server === currentServer() && typeof saved.access === 'string' && typeof saved.refresh === 'string') {
    access = saved.access; refresh = saved.refresh; sessionServer = saved.server;
  }
} catch { /* no stored session */ }

async function renew() {
  if (!renewal) {
    const token = refresh, server = sessionServer;
    renewal = (async () => {
      const r = await fetch(`${server}/api/auth/refresh/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh: token }) });
      if (token !== refresh || server !== currentServer()) throw Error('La sesión cambió. Vuelve a intentarlo.');
      if (r.status === 401) { clearSession(); throw Error('Tu sesión venció. Vuelve a iniciar sesión.'); }
      if (!r.ok) throw Error('No se pudo renovar la sesión. Inténtalo de nuevo.');
      const data = await r.json();
      setSession({ access: data.access, refresh: data.refresh ?? token });
    })().finally(() => { renewal = null; });
  }
  return renewal;
}
export async function api(path: string, init: RequestInit = {}, retry = true): Promise<any> {
  if (access && sessionServer !== currentServer()) clearSession();
  const headers = new Headers(init.headers);
  if (access) headers.set('Authorization', `Bearer ${access}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (isNativeApp() && !currentServer()) throw Error('Configura primero la dirección del servidor.');
  const response = await fetch(`${currentServer()}/api/${path}`, { ...init, headers }).catch(() => { throw Error('El servidor no está disponible. Revisa la conexión y la dirección del servidor.'); });
  if (response.status === 401 && refresh && retry) { await renew(); return api(path, init, false); }
  if (!response.ok) {
    if (response.status === 401 && access) clearSession();
    const data = await response.json().catch(() => ({ detail: 'El servidor no está disponible.' }));
    throw Error(typeof data.detail === 'string' ? data.detail : Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' · '));
  }
  return response.status === 204 ? null : response.json();
}
export async function logout() {
  try { await api('auth/logout/', { method: 'POST', body: JSON.stringify({ refresh }) }); }
  finally { clearSession(); }
}
