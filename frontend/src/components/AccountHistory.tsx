import { useEffect, useState } from 'react';
import { api } from '../api';

type Scan = { id: string; part: string; label_name: string; confidence: number; captured_at: string; notes: string };
export function AccountHistory({ revision, userId }: { revision: number; userId: string }) {
  const [rows, setRows] = useState<Scan[]>([]);
  const [part, setPart] = useState('');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setBusy(true); setError('');
    api(`scans/?user=${encodeURIComponent(userId)}&page=${page}${part ? `&part=${part}` : ''}`).then(data => {
      if (active) { setRows(data.results ?? data); setHasNext(!!data.next); }
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [part, page, revision, reload, userId]);
  return <section className="session" aria-labelledby="history-title">
    <h2 id="history-title">Mi historial de diagnósticos</h2>
    <p>Los resultados guardados están asociados a tu cuenta.</p>
    <div className="card-actions">
      <label>Parte de la planta <select value={part} onChange={e => { setPart(e.target.value); setPage(1); }}>
        <option value="">Todas</option><option value="hojas">Hojas</option><option value="tallos">Tallos</option><option value="frutos">Frutos</option>
      </select></label>
      <button className="pill pill-ghost" disabled={busy} onClick={() => setReload(v => v + 1)}>Actualizar historial</button>
    </div>
    {busy ? <p role="status">Cargando historial…</p> : error ? <p role="alert" className="lab2-error">{error}</p> : rows.length === 0 ? <p>Aún no hay diagnósticos guardados para esta selección.</p> : <ul>
      {rows.map(row => <li key={row.id}>
        <span className="session-part">{row.part}</span><strong>{row.label_name}</strong>
        <span>Modelo: {(row.confidence * 100).toFixed(1)} %</span>
        <time dateTime={row.captured_at}>{new Date(row.captured_at).toLocaleString('es')}</time>
        {row.notes && <details><summary>Ver diagnóstico y observaciones</summary><p className="history-notes">{row.notes}</p></details>}
      </li>)}
    </ul>}
    <div className="card-actions">
      <button className="pill pill-ghost" disabled={busy || page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
      <span>Página {page}</span>
      <button className="pill pill-ghost" disabled={busy || !hasNext || !!error} onClick={() => setPage(p => p + 1)}>Siguiente</button>
    </div>
    <small>El resultado orienta y no reemplaza la visita de un ingeniero agrónomo.</small>
  </section>;
}
