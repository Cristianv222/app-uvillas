import { clearSession } from '../api';
import { useState } from 'react';
import { checkServer, currentServer, isNativeApp, normalizeServerUrl, setServerUrl } from '../lib/server';

/** Solo en la app de Android: dirección del servidor (la PC con Docker en el mismo Wi-Fi). */
export function ServerBar() {
  const [server, setServer] = useState(currentServer());
  const [open, setOpen] = useState(!currentServer());
  const [value, setValue] = useState(server.replace(/^http:\/\//, ''));
  const [state, setState] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');
  if (!isNativeApp()) return null;

  async function save() {
    const url = normalizeServerUrl(value);
    if (!url) return;
    setState('checking');
    const ok = await checkServer(url);
    if (url !== currentServer()) clearSession();
    setServerUrl(url);
    setServer(url);
    setValue(url.replace(/^http:\/\//, ''));
    setState(ok ? 'ok' : 'fail');
    if (ok) setOpen(false);
  }

  return (
    <div className={`server-bar ${open ? 'open' : ''}`}>
      {!open ? (
        <p>
          <span className={`srv-dot ${state === "fail" ? "off" : "on"}`} aria-hidden="true" />
          Servidor: <strong>{server}</strong>
          <button type="button" onClick={() => setOpen(true)}>Cambiar</button>
        </p>
      ) : (
        <form onSubmit={e => { e.preventDefault(); save(); }}>
          <label htmlFor="server">
            <strong>Dirección del servidor</strong>
            <span>Escribe la IP de la PC con Docker encendido. El teléfono y la PC deben estar en el mismo Wi-Fi.</span>
          </label>
          <div className="server-row">
            <input id="server" inputMode="url" autoCapitalize="off" autoCorrect="off" placeholder="192.168.1.10:8080" value={value}
              onChange={e => { setValue(e.target.value); setState('idle'); }} />
            <button className="pill pill-amber" type="submit" disabled={state === 'checking' || !value.trim()}>
              {state === 'checking' ? 'Probando…' : 'Guardar y probar'}
            </button>
          </div>
          {state === 'fail' && <p className="server-error" role="alert">No responde {server}. Revisa la IP, el Wi-Fi y que Docker esté encendido.</p>}
        </form>
      )}
    </div>
  );
}
