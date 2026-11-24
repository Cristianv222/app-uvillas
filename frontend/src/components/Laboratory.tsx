import { useEffect, useState } from 'react';
import { api } from '../api';
import { prepareImage } from '../lib/image';
import { ExpertPanel } from './ExpertPanel';
import { assessImage, type Diagnosis } from '../expert/engine';
import type { Part } from '../expert/knowledgeBase';

type Prediction = { code: string; name: string; confidence: number; is_healthy: boolean };
type Result = { part: Part; best: Prediction; predictions: Prediction[] };
type HistoryItem = { id: string; part: Part; label: string; detail: string; date: string };

const PART_LABEL: Record<Part, string> = { hojas: 'Hojas', tallos: 'Tallos', frutos: 'Frutos' };

/** La portada enlaza a /laboratorio?parte=hojas|tallos|frutos para empezar con esa parte elegida. */
function initialPart(): Part {
  const p = new URLSearchParams(location.search).get('parte');
  return p === 'tallos' || p === 'frutos' || p === 'hojas' ? p : 'hojas';
}

export function Laboratory() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [part, setPart] = useState<Part>(initialPart);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [askAnyway, setAskAnyway] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function reset() {
    setResult(null);
    setDiagnosis(null);
    setAskAnyway(false);
    setSaved(false);
  }

  async function analyze() {
    if (!file) return;
    setBusy(true);
    setError('');
    reset();
    try {
      const data = new FormData();
      data.append('part', part);
      data.append('image', file);
      setResult(await api('recognition/laboratory/', { method: 'POST', body: data }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function pickFile(input: HTMLInputElement) {
    const f = input.files?.[0];
    input.value = '';
    reset();
    setError('');
    if (!f) return;
    try {
      setBusy(true);
      setFile(await prepareImage(f));
    } catch (e) {
      setFile(null);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const assessment = result ? assessImage(result.predictions) : null;
  const showExpert = !!result && !!assessment && (assessment.verdict === 'sick' || askAnyway);

  function save() {
    if (!result || !assessment || saved) return;
    const item: HistoryItem = diagnosis
      ? {
          id: crypto.randomUUID(), part: result.part, date: new Date().toISOString(),
          label: diagnosis.best?.name ?? 'Sin diagnóstico claro',
          detail: diagnosis.best ? `FC ${diagnosis.best.cf.toFixed(2)} · ${diagnosis.level}` : 'indeterminado',
        }
      : {
          id: crypto.randomUUID(), part: result.part, date: new Date().toISOString(),
          label: assessment.verdict === 'healthy' ? `${PART_LABEL[result.part]} sano` : result.best.name,
          detail: `modelo ${(result.best.confidence * 100).toFixed(1)} %`,
        };
    setHistory(items => [item, ...items]);
    setSaved(true);
  }

  return (
    <section id="laboratorio" className="lab">
      <div className="lab-heading">
        <h1>Laboratorio de diagnóstico</h1>
        <p>Analiza una fotografía. El modelo dice si el órgano está sano; si está enfermo, tus observaciones y el clima deciden qué enfermedad es.</p>
      </div>

      {error && <p role="alert" className="lab-error">{error}</p>}

      <div className="lab-grid">
        <div className="upload-panel">
          <label>Parte de la planta
            <select value={part} disabled={busy} onChange={e => { setPart(e.target.value as Part); reset(); }}>
              <option value="hojas">Hojas</option>
              <option value="tallos">Tallos</option>
              <option value="frutos">Frutos</option>
            </select>
          </label>
          <div className={`photo-drop ${preview ? 'has-photo' : ''}`}>
            {preview
              ? <img src={preview} alt="Fotografía seleccionada para analizar" />
              : <p>Toma una foto con buena luz, enfocando una sola parte de la planta.</p>}
            <div className="photo-actions">
              <label className="button button-ghost">
                Tomar foto
                <input className="visually-hidden" type="file" accept="image/*" capture="environment" disabled={busy} onChange={e => pickFile(e.target)} />
              </label>
              <label className="button button-ghost">
                Elegir de la galería
                <input className="visually-hidden" type="file" accept="image/*" disabled={busy} onChange={e => pickFile(e.target)} />
              </label>
            </div>
          </div>
          <button className="button" disabled={busy || !file} onClick={analyze}>{busy ? 'Procesando…' : 'Analizar foto'}</button>
        </div>

        <div className="results" aria-live="polite">
          <h2 className="panel-title">Resultado del modelo</h2>
          {result && assessment ? (
            <>
              <h3>{result.best.name}</h3>
              {result.predictions.map(p => (
                <div className="prediction" key={p.code}>
                  <div><span>{p.name}</span><strong>{(p.confidence * 100).toFixed(1)}%</strong></div>
                  <progress max={1} value={p.confidence} />
                </div>
              ))}
              <p className={`control-note control-note--${assessment.verdict}`}>{assessment.message}</p>
              {assessment.verdict !== 'sick' && !askAnyway && (
                <button className="button button-ghost" onClick={() => setAskAnyway(true)}>
                  {assessment.verdict === 'healthy' ? 'Veo síntomas: revisar de todos modos' : 'Continuar con las preguntas de todos modos'}
                </button>
              )}
              {(assessment.verdict === 'healthy' && !askAnyway) || diagnosis ? (
                <button className="button" onClick={save} disabled={busy || saved}>{saved ? 'Conservado en esta sesión' : 'Conservar en esta sesión'}</button>
              ) : null}
            </>
          ) : (
            <>
              <p className="empty">Elige la parte de la planta y una foto. Aquí aparecerán las tres clases más probables.</p>
            </>
          )}
          <small>El resultado orienta, no reemplaza la visita de un ingeniero agrónomo.</small>
        </div>
      </div>

      {showExpert && result && (
        <ExpertPanel
          key={`${result.part}-${preview}`}
          part={result.part}
          predictions={result.predictions}
          onDiagnosis={d => { setDiagnosis(d); setSaved(false); }}
        />
      )}

      <div className="lab-history">
        <h2 className="panel-title">Análisis de esta sesión</h2>
        {history.length === 0
          ? <p>Aún no has guardado análisis.</p>
          : history.map(item => (
            <article key={item.id}>
              <span>{PART_LABEL[item.part]}</span>
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
              <time>{new Date(item.date).toLocaleDateString('es')}</time>
            </article>
          ))}
        <p>Los resultados se conservan mientras esta página esté abierta. No se guardan en una cuenta.</p>
      </div>
    </section>
  );
}
