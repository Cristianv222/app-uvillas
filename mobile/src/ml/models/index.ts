import type { Part } from '../types';

// require() debe ser estático para que Metro empaquete los .tflite. Se generan con `npm run sync-models`.
export const MODEL_SOURCES: Record<Part, number> = {
  hojas: require('./hojas.tflite'),
  tallos: require('./tallos.tflite'),
  frutos: require('./frutos.tflite'),
};

export { LABELS } from './labels.generated';
