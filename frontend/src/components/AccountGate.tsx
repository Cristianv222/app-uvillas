import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { api, clearSession, hasSession, logout, setSession } from '../api';
import { ServerBar } from './ServerBar';

type User = { id: string; email: string; full_name: string };
export function AccountGate({ children }: { children: (userId: string) => ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(hasSession);
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    let active = true;
    const ended = () => { setUser(null); setRestoring(false); };
    window.addEventListener('uvillas:session-ended', ended);
    if (hasSession()) api('auth/me/').then(u => { if (active) setUser(u); }).catch(e => {
      if (active) { clearSession(); setError(e.message); }
    }).finally(() => { if (active) setRestoring(false); });
    return () => { active = false; window.removeEventListener('uvillas:session-ended', ended); };
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = new FormData(e.currentTarget);
    const password = String(form.get('password'));
    if (register && password !== form.get('confirmation')) { setError('Las contraseñas no coinciden.'); return; }
    setBusy(true); setError('');
    try {
      const data = await api(register ? 'auth/register/' : 'auth/login/', {
        method: 'POST', body: JSON.stringify({ email: String(form.get('email')).trim().toLowerCase(), password, ...(register ? { full_name: String(form.get('name')).trim() } : {}) }),
      });
      setSession(data); setUser(data.user);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  if (restoring) return <section className="lab2" role="status">Recuperando tu sesión…</section>;
  if (user) return <>
    <div className="account-strip">
      <span>Hola, <strong>{user.full_name || user.email}</strong></span>
      <button className="pill pill-ghost" disabled={busy} onClick={async () => {
        setBusy(true);
        try { await logout(); } catch { /* local session already cleared */ }
        finally { setBusy(false); }
      }}>Cerrar sesión</button>
    </div>
    <div key={user.id}>{children(user.id)}</div>
  </>;
  return <section className="lab2 account-gate">
    <ServerBar />
    <form className="step-card account-form" onSubmit={submit} key={String(register)}>
      <p className="eyebrow">UVILLAS · TU CULTIVO</p>
      <h1>{register ? 'Crea tu cuenta' : 'Inicia sesión'}</h1>
      <p>Guarda tus diagnósticos y consulta el historial de tu cultivo desde tu cuenta.</p>
      {register && <label>Nombre (opcional)<input name="name" autoComplete="name" maxLength={150} /></label>}
      <label>Correo electrónico<input name="email" type="email" autoComplete="email" autoCapitalize="none" required /></label>
      <label>Contraseña<input name="password" type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 8 : 1} required /></label>
      {register && <><small>Usa al menos 8 caracteres.</small><label>Confirmar contraseña<input name="confirmation" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required /></label></>}
      <label className="password-toggle"><input type="checkbox" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} /> Mostrar contraseña</label>
      {error && <p role="alert" className="lab2-error">{error}</p>}
      <button className="pill pill-amber" disabled={busy}>{busy ? 'Espera…' : register ? 'Crear cuenta' : 'Iniciar sesión'}</button>
      <button type="button" className="pill pill-ghost" disabled={busy} onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Ya tengo cuenta' : 'Crear una cuenta'}</button>
    </form>
  </section>;
}
