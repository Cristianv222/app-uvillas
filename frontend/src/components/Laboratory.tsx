import { useEffect, useState } from 'react';
import { api } from '../api';
import { ExpertPanel } from './ExpertPanel';
import { assessImage, type Diagnosis } from '../expert/engine';
import type { Part } from '../expert/knowledgeBase';

type Prediction = { code: string; name: string; confidence: number; is_healthy: boolean };
type Result = { part: Part; best: Prediction; predictions: Prediction[] };
type HistoryItem = { id: string; part: Part; label: string; detail: string; date: string };

const MAX_BYTES = 5 * 1024 * 1024;
const PART_LABEL: Record<Part, string> = { hojas: 'Hojas', tallos: 'Tallos', frutos: 'Frutos' };

export function Laboratory() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [part, setPart] = useState<Part>('hojas');
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

  function pickFile(f: File | undefined, input: HTMLInputElement) {
    reset();
    setFile(null);
    setError('');
    if (!f) return;
    if (f.size > MAX_BYTES || !['image/jpeg', 'image/png'].includes(f.type)) {
      setError('Selecciona un JPEG o PNG de hasta 5 MB.');
      input.value = '';
      return;
    }
    setFile(f);
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
    <section id="laboratorio" className="lab section">
      <div className="lab-heading">
        <div>
          <p className="eyebrow">DEL CAMPO AL CONOCIMIENTO</p>
          <h2>Tu laboratorio<br /><em>de uvillas.</em></h2>
          <p>Analiza una fotografía y deja que el sistema experto combine el modelo con tus observaciones.</p>
        </div>
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
          <label className="photo-upload">
            {preview
              ? <img src={preview} alt="Fotografía seleccionada para analizar" />
              : <span>Selecciona una fotografía<br /><small>JPEG o PNG · máximo 5 MB</small></span>}
            <input type="file" accept="image/jpeg,image/png" disabled={busy} onChange={e => pickFile(e.target.files?.[0], e.target)} />
          </label>
          <button className="button" disabled={busy || !file} onClick={analyze}>{busy ? 'Procesando…' : 'Analizar fotografía'}</button>
        </div>

        <div className="results" aria-live="polite">
          <p className="eyebrow">PASO 1 · MODELO DE IMÁGENES</p>
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
              <h3>Una imagen, una primera orientación.</h3>
              <p>Usa buena luz y enfoca una sola parte de la planta. Aquí aparecerán las tres predicciones del modelo.</p>
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
        <h3>Análisis de esta sesión</h3>
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
