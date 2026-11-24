import { loadTensorflowModel, type TensorflowModel } from 'react-native-fast-tflite';

import { LABELS, MODEL_SOURCES } from '../models';
import type { Part, Prediction } from '../types';

const loaded = new Map<Part, Promise<TensorflowModel>>();

/** Carga (una sola vez) el modelo TFLite de la parte indicada. Funciona sin internet. */
export function loadModel(part: Part): Promise<TensorflowModel> {
  if (!loaded.has(part)) {
    const p = loadTensorflowModel(MODEL_SOURCES[part], []);
    p.catch(() => loaded.delete(part));
    loaded.set(part, p);
  }
  return loaded.get(part)!;
}

function softmaxIfNeeded(scores: number[]): number[] {
  const sum = scores.reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) < 0.02) return scores;
  const max = Math.max(...scores);
  const exp = scores.map((s) => Math.exp(s - max));
  const total = exp.reduce((a, b) => a + b, 0);
  return exp.map((e) => e / total);
}

/** Devuelve todas las clases del modelo ordenadas de mayor a menor confianza. */
export async function classifyLocal(part: Part, input: Float32Array): Promise<Prediction[]> {
  const model = await loadModel(part);
  const [output] = await model.run([input.buffer as ArrayBuffer]);
  const scores = softmaxIfNeeded(Array.from(new Float32Array(output)));
  return LABELS[part]
    .filter((l) => l.index < scores.length)
    .map((l) => ({ code: l.code, name: l.name, confidence: scores[l.index], isHealthy: l.isHealthy }))
    .sort((a, b) => b.confidence - a.confidence);
}

/** Promedia varios fotogramas para que el resultado no parpadee. */
export function averagePredictions(frames: Prediction[][]): Prediction[] {
  if (frames.length === 0) return [];
  const acc = new Map<string, Prediction & { sum: number }>();
  for (const frame of frames)
    for (const p of frame) {
      const cur = acc.get(p.code);
      if (cur) cur.sum += p.confidence;
      else acc.set(p.code, { ...p, sum: p.confidence });
    }
  return [...acc.values()]
    .map(({ sum, ...p }) => ({ ...p, confidence: sum / frames.length }))
    .sort((a, b) => b.confidence - a.confidence);
}
