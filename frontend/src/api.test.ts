import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./lib/server', () => ({ currentServer: () => '', isNativeApp: () => false }));
let storage: Map<string, string>;
beforeEach(() => {
  vi.resetModules();
  storage = new Map();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  });
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
});
it('restores a session after reload and removes it on logout', async () => {
  let client = await import('./api');
  client.setSession({ access: 'access', refresh: 'refresh' });
  vi.resetModules();
  client = await import('./api');
  expect(client.hasSession()).toBe(true);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  await client.logout();
  expect(client.hasSession()).toBe(false);
  expect(storage.size).toBe(0);
});
it('renews only once for simultaneous expired requests', async () => {
  const client = await import('./api');
  client.setSession({ access: 'old', refresh: 'refresh' });
  let renewals = 0;
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => {
    if (url.includes('/refresh/')) {
      renewals++;
      await new Promise(resolve => setTimeout(resolve, 5));
      return Response.json({ access: 'new', refresh: 'rotated' });
    }
    return new Headers(init.headers).get('Authorization') === 'Bearer new'
      ? Response.json({ results: [] }) : new Response(null, { status: 401 });
  }));
  await Promise.all([client.api('scans/'), client.api('auth/me/')]);
  expect(renewals).toBe(1);
});
it('clears the UI session when refresh is revoked', async () => {
  const client = await import('./api');
  client.setSession({ access: 'old', refresh: 'revoked' });
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => new Response(null, { status: 401 })));
  await expect(client.api('scans/')).rejects.toThrow('Tu sesión venció');
  expect(client.hasSession()).toBe(false);
  expect(window.dispatchEvent).toHaveBeenCalled();
});
