/**
 * Motor de inferencia: combina la confianza del modelo con las reglas de síntomas y clima
 * usando factores de certeza (FC) al estilo MYCIN.
 */
import {
  CLIMATE_RULES, CONTROL, DISEASES, MODEL_DISEASE_RELIABILITY, PART_DISEASES, PART_WARNINGS,
  QUESTIONS, SYMPTOM_RULES, normalizeCode,
  type Answer, type Climate, type DiseaseCode, type Part, type Question,
} from './knowledgeBase';

export interface ModelPrediction {
  code: string;
  confidence: number;
}

/** Combinación de dos FC (MYCIN). Ambos en [-1, 1]. */
export function combineCF(a: number, b: number): number {
  if (a >= 0 && b >= 0) return a + b * (1 - a);
  if (a <= 0 && b <= 0) return a + b * (1 + a);
  return (a + b) / (1 - Math.min(Math.abs(a), Math.abs(b)));
}

/* ─────────────────────────── Paso 1: reglas de control ─────────────────────────── */

export type ImageVerdict =
  /** Confianza baja: pedir otra foto. */
  | 'retake'
  /** El modelo reconoce el órgano sano. */
  | 'healthy'
  /** El modelo reconoce una enfermedad: hay que preguntar síntomas y clima. */
  | 'sick';

export interface ImageAssessment {
  verdict: ImageVerdict;
  healthyProbability: number;
  bestConfidence: number;
  message: string;
}

export function assessImage(predictions: ModelPrediction[]): ImageAssessment {
  const best = Math.max(0, ...predictions.map(p => p.confidence));
  const healthy = predictions.find(p => normalizeCode(p.code) === 'sano')?.confidence ?? 0;
  if (best < CONTROL.minConfidence) {
    return { verdict: 'retake', healthyProbability: healthy, bestConfidence: best, message: `R1 · La confianza del modelo es menor de ${pct(CONTROL.minConfidence)}: toma otra foto con buena luz y una sola parte de la planta.` };
  }
  if (healthy >= CONTROL.healthyThreshold) {
    return { verdict: 'healthy', healthyProbability: healthy, bestConfidence: best, message: `R2 · El modelo reconoce el órgano sano con ${pct(healthy)} (el modelo acierta entre 80 y 95 % en la clase sana).` };
  }
  return { verdict: 'sick', healthyProbability: healthy, bestConfidence: best, message: 'R3 · El modelo detecta una enfermedad, pero distingue mal cuál es. Responde las preguntas para que las reglas decidan.' };
}

/* ─────────────────────────── Paso 2: diagnóstico ─────────────────────────── */

export interface Evidence {
  rule: string;
  source: 'modelo' | 'síntoma' | 'clima';
  description: string;
  cf: number;
}

export interface DiseaseResult {
  code: DiseaseCode;
  name: string;
  cf: number;
  evidence: Evidence[];
  warning?: string;
}

export type Level = 'probable' | 'posible' | 'indeterminado';

export interface Diagnosis {
  part: Part;
  ranking: DiseaseResult[];
  best: DiseaseResult | null;
  level: Level;
}

export function questionsFor(part: Part): Question[] {
  return QUESTIONS.filter(q => q.parts.includes(part));
}

/**
 * Confusiones principales que mostró la evaluación de los modelos (matrices de confusión):
 * si el modelo propone una, la otra también es candidata.
 */
const CONFUSIONS: Partial<Record<DiseaseCode, DiseaseCode[]>> = {
  muerte_descendente: ['mancha_gris'],
  mancha_gris: ['muerte_descendente'],
  esclerotiniosis: ['moho_blanco', 'pudricion_dura'],
  moho_blanco: ['esclerotiniosis'],
  pudricion_dura: ['esclerotiniosis'],
};

export interface QuestionPlan {
  /** Enfermedades entre las que hay que decidir, de la más a la menos probable según el modelo. */
  candidates: DiseaseCode[];
  /** Preguntas que más separan a esos candidatos, en orden. */
  questions: Question[];
  /** El resto de preguntas del órgano, por si el usuario quiere responder más. */
  extra: Question[];
}

/**
 * Elige pocas preguntas: solo las que distinguen entre las enfermedades que propone el modelo
 * (y las que suele confundir con ellas). Cada pregunta puntúa por el peso de sus reglas sobre
 * los candidatos; una pregunta que apoya a un candidato y descarta a otro vale más.
 */
export function planQuestions(part: Part, predictions: ModelPrediction[], max = 4): QuestionPlan {
  const available = questionsFor(part);
  const allowed = new Set(PART_DISEASES[part]);
  const weight = new Map<DiseaseCode, number>();
  for (const p of predictions) {
    const code = normalizeCode(p.code) as DiseaseCode;
    if (allowed.has(code) && p.confidence >= 0.02) weight.set(code, (weight.get(code) ?? 0) + p.confidence);
  }
  // Si el modelo solo vio la clase sana (el usuario pidió revisar igual), todas son candidatas.
  if (weight.size === 0) PART_DISEASES[part].forEach(d => weight.set(d, 0.1));
  for (const [code, w] of [...weight]) {
    for (const partner of CONFUSIONS[code] ?? []) {
      if (allowed.has(partner) && !weight.has(partner)) weight.set(partner, w * 0.5);
    }
  }
  const candidates = [...weight.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);

  const scored = available.map(q => {
    const rules = SYMPTOM_RULES.filter(r => r.question === q.id && weight.has(r.disease) && (!r.parts || r.parts.includes(part)));
    const touched = new Set(rules.map(r => r.disease));
    const score = rules.reduce((acc, r) => acc + Math.abs(r.cf) * (0.25 + (weight.get(r.disease) ?? 0)), 0)
      * (touched.size > 1 ? 1.3 : 1);
    return { q, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

  const questions = scored.slice(0, max).map(x => x.q);
  const chosen = new Set(questions.map(q => q.id));
  return { candidates, questions, extra: available.filter(q => !chosen.has(q.id)) };
}

export function diagnose(
  part: Part,
  predictions: ModelPrediction[],
  answers: Record<string, Answer>,
  climate: Climate = {},
): Diagnosis {
  const candidates = PART_DISEASES[part];
  const diseaseProbs = new Map<string, number>();
  for (const p of predictions) {
    const code = normalizeCode(p.code);
    if (code !== 'sano') diseaseProbs.set(code, (diseaseProbs.get(code) ?? 0) + p.confidence);
  }
  const diseaseMass = [...diseaseProbs.values()].reduce((a, b) => a + b, 0);
  const reliability = MODEL_DISEASE_RELIABILITY[part];
  const questionText = new Map(QUESTIONS.map(q => [q.id, q.text]));
  const hasClimate = climate.temperature !== undefined && climate.humidity !== undefined && !Number.isNaN(climate.temperature) && !Number.isNaN(climate.humidity);

  const ranking = candidates.map((code): DiseaseResult => {
    const evidence: Evidence[] = [];

    const share = diseaseMass > 0 ? (diseaseProbs.get(code) ?? 0) / diseaseMass : 0;
    if (share > 0) {
      evidence.push({
        rule: 'M1',
        source: 'modelo',
        description: `El modelo da ${pct(share)} entre las enfermedades; se pondera por su fiabilidad en ${part} (${pct(reliability)}).`,
        cf: round(share * reliability),
      });
    }

    for (const r of SYMPTOM_RULES) {
      if (r.disease !== code || (r.parts && !r.parts.includes(part))) continue;
      if (!questionsFor(part).some(q => q.id === r.question)) continue;
      if (answers[r.question] !== (r.when ?? 'si')) continue;
      const verb = (r.when ?? 'si') === 'si' ? 'Sí' : 'No';
      evidence.push({ rule: r.id, source: 'síntoma', description: `${verb}: ${questionText.get(r.question)}`, cf: r.cf });
    }

    if (hasClimate) {
      for (const r of CLIMATE_RULES) {
        if (r.disease === code && r.test(climate as Required<Climate>)) {
          evidence.push({ rule: r.id, source: 'clima', description: r.description, cf: r.cf });
        }
      }
    }

    const cf = round(evidence.reduce((acc, e) => combineCF(acc, e.cf), 0));
    return { code, name: DISEASES[code].name, cf, evidence, warning: PART_WARNINGS[part]?.[code] };
  }).sort((a, b) => b.cf - a.cf);

  const top = ranking[0] ?? null;
  const level: Level = !top || top.cf < CONTROL.possible ? 'indeterminado' : top.cf < CONTROL.probable ? 'posible' : 'probable';
  return { part, ranking, best: level === 'indeterminado' ? null : top, level };
}

function round(x: number) {
  return Math.round(x * 100) / 100;
}

export function pct(x: number) {
  return `${Math.round(x * 100)} %`;
}
