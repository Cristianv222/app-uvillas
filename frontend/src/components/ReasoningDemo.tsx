import { useMemo, useState } from 'react';
import { diagnose } from '../expert/engine';
import type { Answer } from '../expert/knowledgeBase';

/** Predicción real del modelo de hojas sobre una foto del dataset (prueba del 24/11/2026). */
const PREDICTIONS = [
  { code: 'mancha_gris', confidence: 0.983 },
  { code: 'marchitez_bacterial', confidence: 0.013 },
  { code: 'muerte_descendente', confidence: 0.003 },
];

const TOGGLES = [
  { id: 'manchas_redondas', label: 'Manchas redondas de 2–5 mm con centro gris' },
  { id: 'lesion_v', label: 'Lesión en forma de "V" desde el borde' },
  { id: 'clima', label: 'Clima del lote: 18 °C y 85 % de humedad' },
] as const;

const LEVEL = { probable: 'Probable', posible: 'Posible', indeterminado: 'Sin diagnóstico' } as const;

export function ReasoningDemo() {
  const [on, setOn] = useState<Record<string, boolean>>({ manchas_redondas: true, lesion_v: false, clima: false });

  const d = useMemo(() => {
    const answers: Record<string, Answer> = {};
    if (on.manchas_redondas) answers.manchas_redondas = 'si';
    if (on.lesion_v) answers.lesion_v = 'si';
    return diagnose('hojas', PREDICTIONS, answers, on.clima ? { temperature: 18, humidity: 85 } : {});
  }, [on]);

  const top = d.ranking[0];
  const second = d.ranking[1];

  return (
    <figure className="demo" aria-labelledby="demo-caption">
      <figcaption id="demo-caption" className="demo-head">
        <strong>Así razona el sistema</strong>
        <span>Foto de una hoja. El modelo responde Mancha gris con 98,3 %.</span>
      </figcaption>

      <fieldset className="demo-toggles">
        <legend>Marca lo que observa el agricultor</legend>
        {TOGGLES.map(t => (
          <label key={t.id}>
            <input type="checkbox" checked={on[t.id]} onChange={e => setOn(s => ({ ...s, [t.id]: e.target.checked }))} />
            <span>{t.label}</span>
          </label>
        ))}
      </fieldset>

      <div className="demo-result" aria-live="polite">
        <div className="demo-verdict">
          <span className={`level level--${d.level}`}>{LEVEL[d.level]}</span>
          <span className="demo-name">{top.name}</span>
          <span className="demo-cf" aria-label={`Factor de certeza ${top.cf.toFixed(2)}`}>{top.cf.toFixed(2)}</span>
        </div>
        <div className="gauge" role="img" aria-label={`Certeza de ${top.name}: ${top.cf.toFixed(2)} sobre 1`}>
          <span className="gauge-fill" style={{ width: `${Math.max(0, top.cf) * 100}%` }} />
          <span className="gauge-mark" style={{ left: '35%' }} title="Posible" />
          <span className="gauge-mark" style={{ left: '60%' }} title="Probable" />
        </div>
        <ol className="ledger">
          {top.evidence.map(e => (
            <li key={e.rule}>
              <span className="ledger-rule">{e.rule}</span>
              <span className="ledger-text">{e.description}</span>
              <span className={`ledger-cf ${e.cf < 0 ? 'neg' : ''}`}>{e.cf > 0 ? '+' : ''}{e.cf.toFixed(2)}</span>
            </li>
          ))}
        </ol>
        {second && second.cf > 0 && (
          <p className="demo-second">Segunda opción: {second.name}, {second.cf.toFixed(2)}</p>
        )}
      </div>
    </figure>
  );
}
