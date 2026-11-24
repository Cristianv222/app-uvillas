import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api } from '../api';
import { assessImage, diagnose, planQuestions, type Diagnosis } from '../expert/engine';
import { CONTROL, DISEASES, type Answer, type Part } from '../expert/knowledgeBase';
import { prepareImage } from '../lib/image';
import { CameraCapture, canUseCamera } from './CameraCapture';
import { FruitArt, LeafArt, StemArt } from './Illustrations';
import { ServerBar } from './ServerBar';

type Prediction = { code: string; name: string; confidence: number; is_healthy: boolean };
type Result = { part: Part; best: Prediction; predictions: Prediction[] };
type HistoryItem = { id: string; part: Part; label: string; detail: string; date: string };

const PARTS: { id: Part; name: string; hint: string; Art: typeof LeafArt }[] = [
  { id: 'hojas', name: 'Hoja', hint: '8 clases', Art: LeafArt },
  { id: 'tallos', name: 'Tallo', hint: '4 clases', Art: StemArt },
  { id: 'frutos', name: 'Fruto', hint: '7 clases', Art: FruitArt },
];
const PART_NAME: Record<Part, string> = { hojas: 'Hoja', tallos: 'Tallo', frutos: 'Fruto' };
const STEPS = ['Parte', 'Foto', 'Modelo', 'Síntomas', 'Diagnóstico'];
const LEVEL_TEXT = { probable: 'Diagnóstico probable', posible: 'Diagnóstico posible', indeterminado: 'Sin diagnóstico claro' } as const;
const ANSWERS: { value: Answer; label: string }[] = [
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' },
  { value: 'nose', label: 'No sé' },
];

/** La portada enlaza a /laboratorio?parte=hojas|tallos|frutos para empezar con esa parte elegida. */
function initialPart(): Part | null {
  const p = new URLSearchParams(location.search).get('parte');
  return p === 'tallos' || p === 'frutos' || p === 'hojas' ? p : null;
}

const pct = (x: number) => `${(x * 100).toFixed(1)} %`;

export function Laboratory() {
  const [part, setPart] = useState<Part | null>(initialPart);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [askAnyway, setAskAnyway] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [useClimate, setUseClimate] = useState(false);
  const [temperature, setTemperature] = useState(18);
  const [humidity, setHumidity] = useState(85);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const assessment = result ? assessImage(result.predictions) : null;
  const asking = !!result && !!assessment && (assessment.verdict === 'sick' || askAnyway);

  const plan = useMemo(() => (result ? planQuestions(result.part, result.predictions) : null), [result]);
  const candidateNames = plan ? plan.candidates.slice(0, 3).map(c => DISEASES[c].name) : [];

  const diagnosis: Diagnosis | null = useMemo(() => {
    if (!result || !asking) return null;
    return diagnose(result.part, result.predictions, answers, useClimate ? { temperature, humidity } : {});
  }, [result, asking, answers, useClimate, temperature, humidity]);

  const step = !part ? 0 : !result ? 1 : !asking ? 2 : !showDiagnosis ? 3 : 4;

  function resetAnalysis() {
    setResult(null);
    setAskAnyway(false);
    setAnswers({});
    setShowDiagnosis(false);
    setShowExtra(false);
    setSaved(false);
  }

  function choosePart(p: Part) {
    setPart(p);
    resetAnalysis();
    const url = new URL(location.href);
    url.searchParams.set('parte', p);
    window.history.replaceState(null, '', url);
  }

  async function takeFile(f: File | undefined) {
    resetAnalysis();
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

  async function analyze() {
    if (!file || !part) return;
    setBusy(true);
    setError('');
    resetAnalysis();
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

  function startOver() {
    resetAnalysis();
    setFile(null);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function save() {
    if (!result || !assessment || saved) return;
    const base = { id: crypto.randomUUID(), part: result.part, date: new Date().toISOString() };
    const item: HistoryItem = diagnosis && showDiagnosis
      ? { ...base, label: diagnosis.best?.name ?? 'Sin diagnóstico claro', detail: diagnosis.best ? `Certeza ${diagnosis.best.cf.toFixed(2)}` : 'Indeterminado' }
      : { ...base, label: assessment.verdict === 'healthy' ? `${PART_NAME[result.part]} sana` : result.best.name, detail: `Modelo ${pct(result.best.confidence)}` };
    setHistory(items => [item, ...items]);
    setSaved(true);
  }

  return (
    <section id="laboratorio" className="lab2">
      <header className="lab2-head">
        <h1>Laboratorio de diagnóstico</h1>
        <p>Cinco pasos. El modelo mira la foto y dice si la planta está sana; si no lo está, tus observaciones deciden qué enfermedad es.</p>
        <ol className="stepper" aria-label="Progreso">
          {STEPS.map((s, i) => (
            <li key={s} className={i < step ? 'done' : i === step ? 'current' : ''} aria-current={i === step ? 'step' : undefined}>
              <span>{i < step ? '✓' : i + 1}</span>{s}
            </li>
          ))}
        </ol>
      </header>

      <ServerBar />
      {error && <p role="alert" className="lab2-error">{error}</p>}

      {/* 1 · Parte */}
      <Card n={1} title="¿Qué parte de la planta vas a analizar?" active={step === 0}>
        <div className="part-picker">
          {PARTS.map(({ id, name, hint, Art }) => (
            <button key={id} type="button" className="part-option" aria-pressed={part === id} onClick={() => choosePart(id)} disabled={busy}>
              <Art />
              <strong>{name}</strong>
              <span>{hint}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* 2 · Foto */}
      {part && (
        <Card n={2} title={`Foto de ${PART_NAME[part].toLowerCase()}`} active={step === 1} scrollOnMount={!initialPart()}>
          <div
            className={`dropzone ${dragging ? 'is-dragging' : ''} ${preview ? 'has-photo' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); takeFile(e.dataTransfer.files?.[0]); }}
          >
            {preview
              ? <img src={preview} alt="Foto seleccionada" />
              : (
                <div className="dropzone-empty">
                  <p><strong>Arrastra una foto aquí</strong> o usa los botones.</p>
                  <ul>
                    <li>Buena luz, sin sombras fuertes</li>
                    <li>Una sola {PART_NAME[part].toLowerCase()}, centrada y cerca</li>
                    <li>Que se vea la lesión, si la hay</li>
                  </ul>
                </div>
              )}
            <div className="dropzone-actions">
              {canUseCamera()
                ? <button type="button" className="pill pill-ghost" disabled={busy} onClick={() => setCameraOpen(true)}>Tomar foto</button>
                : (
                  <label className="pill pill-ghost">
                    Tomar foto
                    <input className="visually-hidden" type="file" accept="image/*" capture="environment" disabled={busy} onChange={e => { takeFile(e.target.files?.[0]); e.target.value = ''; }} />
                  </label>
                )}
              <label className="pill pill-ghost">
                {preview ? 'Cambiar foto' : 'Elegir de la galería'}
                <input className="visually-hidden" type="file" accept="image/*" disabled={busy} onChange={e => { takeFile(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
            </div>
          </div>
          {cameraOpen && (
            <CameraCapture onClose={() => setCameraOpen(false)} onCapture={f => { setCameraOpen(false); takeFile(f); }} />
          )}
          <button className="pill pill-amber pill-lg" disabled={!file || busy} onClick={analyze}>
            {busy ? <><span className="spinner" aria-hidden="true" /> Analizando…</> : 'Analizar foto'}
          </button>
        </Card>
      )}

      {/* 3 · Modelo */}
      {result && assessment && (
        <Card n={3} title="Lo que vio el modelo" active={step === 2} scrollOnMount>
          <div className="model-grid">
            <div className="model-bars">
              {result.predictions.map((p, i) => (
                <div className={`bar ${i === 0 ? 'top' : ''}`} key={p.code}>
                  <div className="bar-label"><span>{p.name}</span><strong>{pct(p.confidence)}</strong></div>
                  <div className="bar-track"><span className={p.is_healthy ? 'healthy' : ''} style={{ ['--w' as string]: `${p.confidence * 100}%` }} /></div>
                </div>
              ))}
            </div>
            <div className={`verdict verdict--${assessment.verdict}`}>
              <span className="verdict-badge">
                {assessment.verdict === 'healthy' ? 'Parece sana' : assessment.verdict === 'sick' ? 'Hay una enfermedad' : 'Foto poco clara'}
              </span>
              <p>{assessment.message.replace(/^R\d · /, '')}</p>
              <small>Regla de control {assessment.message.slice(0, 2)}</small>
            </div>
          </div>
          {assessment.verdict !== 'sick' && !askAnyway && (
            <div className="card-actions">
              {assessment.verdict === 'retake' && <button className="pill pill-amber" onClick={startOver}>Tomar otra foto</button>}
              {assessment.verdict === 'healthy' && <button className="pill pill-amber" onClick={save} disabled={saved}>{saved ? 'Guardado en esta sesión' : 'Guardar resultado'}</button>}
              <button className="pill pill-ghost" onClick={() => setAskAnyway(true)}>
                {assessment.verdict === 'healthy' ? 'Veo síntomas: revisar igual' : 'Continuar con las preguntas'}
              </button>
            </div>
          )}
        </Card>
      )}

      {/* 4 · Síntomas */}
      {result && asking && (
        <Card n={4} title="¿Qué observas en la planta?" active={step === 3} scrollOnMount>
          <p className="card-intro">
            {plan && plan.questions.length > 0
              ? <>Según el modelo, puede ser <strong>{candidateNames.join(candidateNames.length > 2 ? ', ' : ' o ').replace(/, ([^,]*)$/, ' o $1')}</strong>. Estas {plan.questions.length === 1 ? 'pregunta las distingue' : `${plan.questions.length} preguntas las distinguen`}; si no estás seguro, deja «No sé».</>
              : 'Responde lo que veas; si no estás seguro, deja «No sé».'}
          </p>
          <ul className="questions">
            {plan && [...plan.questions, ...(showExtra ? plan.extra : [])].map(q => {
              const value = answers[q.id] ?? 'nose';
              return (
                <li key={q.id} className={value !== 'nose' ? 'answered' : ''}>
                  <p>{q.text}{q.hint && <small>{q.hint}</small>}</p>
                  <div className="segmented" role="radiogroup" aria-label={q.text}>
                    {ANSWERS.map(a => (
                      <label key={a.value} className={value === a.value ? `on ${a.value}` : ''}>
                        <input type="radio" name={q.id} value={a.value} checked={value === a.value}
                          onChange={() => { setAnswers(s => ({ ...s, [q.id]: a.value })); setSaved(false); }} />
                        {a.label}
                      </label>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
          {plan && plan.extra.length > 0 && (
            <button type="button" className="more-questions" aria-expanded={showExtra} onClick={() => setShowExtra(v => !v)}>
              {showExtra ? 'Mostrar solo las preguntas clave' : `Responder más preguntas (${plan.extra.length})`}
            </button>
          )}

          <div className={`climate ${useClimate ? 'on' : ''}`}>
            <label className="switch">
              <input type="checkbox" checked={useClimate} onChange={e => { setUseClimate(e.target.checked); setSaved(false); }} />
              <span className="switch-ui" aria-hidden="true" />
              Conozco el clima del lote
            </label>
            {useClimate && (
              <div className="sliders">
                <label>
                  <span>Temperatura <output>{temperature} °C</output></span>
                  <input type="range" min={0} max={35} step={1} value={temperature} onChange={e => setTemperature(Number(e.target.value))} />
                </label>
                <label>
                  <span>Humedad relativa <output>{humidity} %</output></span>
                  <input type="range" min={20} max={100} step={1} value={humidity} onChange={e => setHumidity(Number(e.target.value))} />
                </label>
              </div>
            )}
          </div>

          {!showDiagnosis && <button className="pill pill-amber pill-lg" onClick={() => setShowDiagnosis(true)}>Ver diagnóstico</button>}
        </Card>
      )}

      {/* 5 · Diagnóstico */}
      {diagnosis && showDiagnosis && (
        <Card n={5} title="Diagnóstico" active={step === 4} scrollOnMount>
          <DiagnosisView d={diagnosis} />
          <p className="live-note">Si cambias una respuesta o el clima, el diagnóstico se recalcula al instante.</p>
          <div className="card-actions">
            <button className="pill pill-amber" onClick={save} disabled={saved}>{saved ? 'Guardado en esta sesión' : 'Guardar resultado'}</button>
            <button className="pill pill-ghost" onClick={startOver}>Nuevo análisis</button>
          </div>
        </Card>
      )}

      <div className="session">
        <h2>Análisis de esta sesión</h2>
        {history.length === 0
          ? <p>Aún no guardas resultados. Se conservan mientras la página esté abierta.</p>
          : (
            <ul>
              {history.map(h => (
                <li key={h.id}>
                  <span className="session-part">{PART_NAME[h.part]}</span>
                  <strong>{h.label}</strong>
                  <span>{h.detail}</span>
                  <time>{new Date(h.date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</time>
                </li>
              ))}
            </ul>
          )}
        <small>El resultado orienta y no reemplaza la visita de un ingeniero agrónomo.</small>
      </div>
    </section>
  );
}

function Card({ n, title, active, scrollOnMount, children }: { n: number; title: string; active: boolean; scrollOnMount?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (scrollOnMount && ref.current) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      ref.current.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <section ref={ref} className={`step-card ${active ? 'is-active' : ''}`} aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`}><span className="step-n">{n}</span>{title}</h2>
      {children}
    </section>
  );
}

function DiagnosisView({ d }: { d: Diagnosis }) {
  const best = d.best;
  const info = best ? DISEASES[best.code] : null;
  const cf = Math.max(0, best?.cf ?? d.ranking[0]?.cf ?? 0);
  const R = 54, C = 2 * Math.PI * R;
  const others = d.ranking.filter(r => r !== best && r.cf > 0).slice(0, 3);

  return (
    <div className={`dx dx--${d.level}`} aria-live="polite">
      <div className="dx-main">
        <div className="ring" role="img" aria-label={`Factor de certeza ${cf.toFixed(2)} de 1`}>
          <svg viewBox="0 0 128 128">
            <circle cx="64" cy="64" r={R} className="ring-track" />
            <circle cx="64" cy="64" r={R} className="ring-value" strokeDasharray={C} strokeDashoffset={C * (1 - cf)} />
          </svg>
          <div className="ring-label"><strong>{cf.toFixed(2)}</strong><span>certeza</span></div>
        </div>
        <div>
          <p className="dx-level">{LEVEL_TEXT[d.level]}</p>
          <h3>{best ? best.name : 'Faltan datos'}</h3>
          {best && info
            ? <p className="dx-agent"><i>{info.agent}</i> · {info.type.toLowerCase()}</p>
            : <p className="dx-agent">Ninguna enfermedad llega a {CONTROL.possible.toFixed(2)}. Responde más preguntas, agrega el clima o toma otra foto.</p>}
        </div>
      </div>

      {best && info && (
        <dl className="dx-facts">
          <div><dt>Rasgo clave</dt><dd>{info.keyTrait}</dd></div>
          <div><dt>Clima favorable</dt><dd>{info.climate}</dd></div>
        </dl>
      )}
      {best?.warning && <p className="dx-warning">{best.warning}</p>}

      {best && (
        <div className="dx-why">
          <h4>Por qué</h4>
          <ul>
            {best.evidence.map(e => (
              <li key={e.rule}>
                <span className={`chip ${e.cf < 0 ? 'neg' : ''}`}>{e.cf > 0 ? '+' : ''}{e.cf.toFixed(2)}</span>
                <span><b>{e.rule}</b> {e.source}: {e.description}</span>
              </li>
            ))}
          </ul>
          <small>Se combinan con FC = FC₁ + FC₂ × (1 − FC₁). Las evidencias negativas restan.</small>
        </div>
      )}

      {others.length > 0 && (
        <div className="dx-others">
          <h4>También posible</h4>
          {others.map(r => (
            <div className="bar" key={r.code}>
              <div className="bar-label"><span>{r.name}</span><strong>{r.cf.toFixed(2)}</strong></div>
              <div className="bar-track"><span style={{ ['--w' as string]: `${r.cf * 100}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
