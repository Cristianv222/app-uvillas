import { useMemo, useState, type FormEvent } from 'react';
import { diagnose, questionsFor, type Diagnosis, type ModelPrediction } from '../expert/engine';
import { CONTROL, DISEASES, type Answer, type Part } from '../expert/knowledgeBase';

const LEVEL_TEXT = {
  probable: 'Diagnóstico probable',
  posible: 'Diagnóstico posible',
  indeterminado: 'Sin diagnóstico claro',
} as const;

const ANSWERS: { value: Answer; label: string }[] = [
  { value: 'si', label: 'Sí' },
  { value: 'no', label: 'No' },
  { value: 'nose', label: 'No sé' },
];

export function ExpertPanel({ part, predictions, onDiagnosis }: {
  part: Part;
  predictions: ModelPrediction[];
  onDiagnosis: (d: Diagnosis) => void;
}) {
  const questions = useMemo(() => questionsFor(part), [part]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [result, setResult] = useState<Diagnosis | null>(null);

  function run(event: FormEvent) {
    event.preventDefault();
    const climate = temperature !== '' && humidity !== '' ? { temperature: Number(temperature), humidity: Number(humidity) } : {};
    const d = diagnose(part, predictions, answers, climate);
    setResult(d);
    onDiagnosis(d);
  }

  return (
    <section className="expert" aria-labelledby="expert-title">
      <h2 id="expert-title" className="panel-title">Sistema experto: ¿qué observas en la planta?</h2>
      <p>El modelo distingue bien un órgano sano de uno enfermo, pero confunde las enfermedades entre sí. Tus observaciones y el clima deciden cuál es.</p>

      <form onSubmit={run} className="expert-form">
        <fieldset className="expert-questions">
          <legend>Síntomas</legend>
          {questions.map(q => (
            <div className="expert-question" key={q.id} role="radiogroup" aria-label={q.text}>
              <p>{q.text}{q.hint && <small> {q.hint}</small>}</p>
              <div className="answer-group">
                {ANSWERS.map(a => (
                  <label key={a.value} className={(answers[q.id] ?? 'nose') === a.value ? 'is-selected' : ''}>
                    <input
                      type="radio"
                      name={q.id}
                      value={a.value}
                      checked={(answers[q.id] ?? 'nose') === a.value}
                      onChange={() => { setAnswers(prev => ({ ...prev, [q.id]: a.value })); setResult(null); }}
                    />
                    {a.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </fieldset>

        <fieldset className="expert-climate">
          <legend>Clima del lote <small>(opcional)</small></legend>
          <label>Temperatura (°C)
            <input type="number" inputMode="decimal" min={-5} max={45} step="0.5" value={temperature} placeholder="Ej. 18" onChange={e => { setTemperature(e.target.value); setResult(null); }} />
          </label>
          <label>Humedad relativa (%)
            <input type="number" inputMode="numeric" min={0} max={100} value={humidity} placeholder="Ej. 85" onChange={e => { setHumidity(e.target.value); setResult(null); }} />
          </label>
          <small>Se usan solo si llenas los dos campos.</small>
        </fieldset>

        <button className="button" type="submit">Diagnosticar</button>
      </form>

      {result && <DiagnosisView diagnosis={result} />}
    </section>
  );
}

function DiagnosisView({ diagnosis }: { diagnosis: Diagnosis }) {
  const { best, level, ranking } = diagnosis;
  const others = ranking.filter(r => r !== best && r.cf > 0).slice(0, 3);
  const info = best ? DISEASES[best.code] : null;
  return (
    <div className={`diagnosis diagnosis--${level}`} aria-live="polite">
      <p className="diagnosis-level">{LEVEL_TEXT[level]}</p>
      {best && info ? (
        <>
          <h4>{best.name}</h4>
          <div className="prediction">
            <div><span>Factor de certeza</span><strong>{best.cf.toFixed(2)}</strong></div>
            <progress max={1} value={Math.max(0, best.cf)} />
          </div>
          <dl className="diagnosis-facts">
            <div><dt>Agente</dt><dd>{info.agent} ({info.type.toLowerCase()})</dd></div>
            <div><dt>Clima favorable</dt><dd>{info.climate}</dd></div>
            <div><dt>Rasgo clave</dt><dd>{info.keyTrait}</dd></div>
          </dl>
          {best.warning && <p className="diagnosis-warning">{best.warning}</p>}
          <details open>
            <summary>¿Por qué este diagnóstico?</summary>
            <ul className="evidence">
              {best.evidence.map(e => (
                <li key={e.rule}>
                  <span className={`evidence-cf ${e.cf < 0 ? 'is-negative' : ''}`}>{e.cf > 0 ? '+' : ''}{e.cf.toFixed(2)}</span>
                  <span><b>{e.rule}</b> · {e.source}: {e.description}</span>
                </li>
              ))}
            </ul>
            <p className="evidence-formula">Las evidencias se combinan con FC = FC₁ + FC₂ × (1 − FC₁); las negativas restan certeza.</p>
          </details>
        </>
      ) : (
        <p>Ninguna enfermedad alcanza un factor de certeza de {CONTROL.possible.toFixed(2)}. Responde más preguntas, agrega el clima o toma otra foto. Si el problema sigue, consulta con un técnico.</p>
      )}
      {others.length > 0 && (
        <div className="diagnosis-others">
          <p>Otras posibilidades</p>
          {others.map(r => (
            <div className="prediction" key={r.code}>
              <div><span>{r.name}</span><strong>{r.cf.toFixed(2)}</strong></div>
              <progress max={1} value={r.cf} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
