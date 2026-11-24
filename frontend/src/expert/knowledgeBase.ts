/**
 * Base de conocimiento heurística del sistema experto.
 *
 * Fuente: informe del proyecto (tablas 4 y 5) basado en Lagos Burbano et al. (2020),
 * "Manejo de enfermedades de uchuva en zonas productoras de Nariño", Universidad de Nariño.
 * Los factores de certeza (FC) son estimaciones del equipo y deben validarse con un agrónomo.
 *
 * Reparto de funciones (conclusión del análisis de los modelos):
 *  - El modelo de imágenes decide si el órgano está SANO o ENFERMO (acierta 80–95 %).
 *  - Las reglas de síntomas y clima deciden QUÉ enfermedad es (el modelo acierta 14–31 %).
 */

export type Part = 'hojas' | 'tallos' | 'frutos';

export type DiseaseCode =
  | 'mancha_gris'
  | 'muerte_descendente'
  | 'esclerotiniosis'
  | 'moho_blanco'
  | 'pudricion_dura'
  | 'mancha_grasienta'
  | 'marchitez_bacterial';

export interface Disease {
  code: DiseaseCode;
  name: string;
  agent: string;
  type: 'Hongo' | 'Bacteria';
  /** Clima favorable (para mostrar). */
  climate: string;
  /** Rasgo visual clave. */
  keyTrait: string;
}

export const DISEASES: Record<DiseaseCode, Disease> = {
  mancha_gris: { code: 'mancha_gris', name: 'Mancha gris', agent: 'Cercospora sp.', type: 'Hongo', climate: '≈ 18 °C, HR > 80 %', keyTrait: 'Manchas redondas de 2–5 mm, centro gris y borde de color' },
  muerte_descendente: { code: 'muerte_descendente', name: 'Muerte descendente', agent: 'Phoma physalidis', type: 'Hongo', climate: '≈ 15 °C, HR ≈ 80 %', keyTrait: 'Lesión en "V" en la hoja; secado desde la punta de las ramas' },
  esclerotiniosis: { code: 'esclerotiniosis', name: 'Esclerotiniosis', agent: 'Sclerotinia sclerotiorum', type: 'Hongo', climate: '16–21 °C, HR ≈ 95 %', keyTrait: 'Lesión oscura y húmeda con micelio algodonoso y esclerocios negros' },
  moho_blanco: { code: 'moho_blanco', name: 'Moho blanco', agent: 'Micelio de Sclerotinia, Botrytis o Phoma (por confirmar)', type: 'Hongo', climate: '15–23 °C, HR ≈ 95 %', keyTrait: 'Capa de micelio blanco' },
  pudricion_dura: { code: 'pudricion_dura', name: 'Pudrición dura', agent: 'Posible Alternaria sp. (por confirmar)', type: 'Hongo', climate: '15–28 °C, HR > 90 %', keyTrait: 'Tejido oscuro, firme y seco con anillos' },
  mancha_grasienta: { code: 'mancha_grasienta', name: 'Mancha grasienta', agent: 'Xanthomonas sp.', type: 'Bacteria', climate: '20–24 °C, HR 75–80 %', keyTrait: 'Mancha translúcida y aceitosa que avanza desde la punta del cáliz' },
  marchitez_bacterial: { code: 'marchitez_bacterial', name: 'Marchitez bacterial', agent: 'Ralstonia solanacearum', type: 'Bacteria', climate: '22–35 °C, HR ≈ 95 %', keyTrait: 'Hojas flácidas aún verdes; oscurecimiento interno del tallo' },
};

/** Enfermedades que tiene cada modelo (además de la clase sana). */
export const PART_DISEASES: Record<Part, DiseaseCode[]> = {
  hojas: ['mancha_gris', 'muerte_descendente', 'esclerotiniosis', 'moho_blanco', 'pudricion_dura', 'mancha_grasienta', 'marchitez_bacterial'],
  frutos: ['mancha_gris', 'muerte_descendente', 'esclerotiniosis', 'moho_blanco', 'pudricion_dura', 'mancha_grasienta'],
  tallos: ['esclerotiniosis', 'moho_blanco', 'pudricion_dura'],
};

/**
 * Los labels.txt de Teachable Machine no son uniformes: en tallos las clases son
 * "Sano", "Dura" y "Blanco", y en frutos dice "Escleroteniosis".
 */
const CODE_ALIASES: Record<string, string> = {
  dura: 'pudricion_dura',
  blanco: 'moho_blanco',
  escleroteniosis: 'esclerotiniosis',
  sano: 'sano',
  hoja_sana: 'sano',
  fruto_sano: 'sano',
  tallo_sano: 'sano',
};

/** Convierte el código que devuelve la API a un código de la base de conocimiento ('sano' para la clase sana). */
export function normalizeCode(code: string): string {
  return CODE_ALIASES[code] ?? code;
}

/** Fiabilidad del modelo para distinguir enfermedades, según su acierto medio en prueba (tabla 3). */
export const MODEL_DISEASE_RELIABILITY: Record<Part, number> = {
  hojas: 0.3, // 14 % de acierto medio en enfermedades: casi azar
  frutos: 0.5, // 24 %
  tallos: 0.5, // 31 %
};

/* ─────────────────────────── Reglas de control ─────────────────────────── */

export const CONTROL = {
  /** SI la confianza máxima es menor ENTONCES pedir otra foto. */
  minConfidence: 0.5,
  /** SI la clase sana supera este valor ENTONCES el órgano se considera sano. */
  healthyThreshold: 0.6,
  /** Umbrales para calificar el diagnóstico final. */
  probable: 0.6,
  possible: 0.35,
};

/* ─────────────────────────── Reglas por síntomas ─────────────────────────── */

export interface Question {
  id: string;
  text: string;
  hint?: string;
  parts: Part[];
}

export const QUESTIONS: Question[] = [
  { id: 'manchas_redondas', text: '¿Hay manchas redondas pequeñas (2–5 mm) con centro gris y borde de color?', parts: ['hojas', 'frutos'] },
  { id: 'lesion_v', text: '¿La lesión tiene forma de "V" desde el borde de la hoja?', parts: ['hojas'] },
  { id: 'secado_puntas', text: '¿Las ramas o brotes se secan desde la punta hacia abajo?', parts: ['hojas', 'frutos'] },
  { id: 'micelio', text: '¿Se ve una capa de micelio blanco, como algodón?', parts: ['hojas', 'frutos', 'tallos'] },
  { id: 'esclerocios', text: '¿Hay cuerpos negros y duros (esclerocios) junto al micelio o dentro del tallo?', hint: 'Parecen granos o semillas negras.', parts: ['hojas', 'frutos', 'tallos'] },
  { id: 'blando_humedo', text: '¿El tejido afectado está blando, húmedo o acuoso?', parts: ['hojas', 'frutos', 'tallos'] },
  { id: 'firme_seco', text: '¿El tejido afectado está oscuro, firme y seco, con anillos?', parts: ['hojas', 'frutos', 'tallos'] },
  { id: 'aceitosa', text: '¿Hay manchas translúcidas de aspecto aceitoso o grasiento?', parts: ['hojas', 'frutos'] },
  { id: 'desde_caliz', text: '¿La mancha empieza en la punta del cáliz (capacho) y avanza hacia el fruto?', parts: ['frutos'] },
  { id: 'flacida_verde', text: '¿La planta se marchita (hojas flácidas pero todavía verdes), sobre todo en horas de calor?', parts: ['hojas'] },
  { id: 'cuello', text: '¿La lesión está en el cuello de la planta (base del tallo, junto al suelo)?', parts: ['tallos'] },
];

export type Answer = 'si' | 'no' | 'nose';

export interface SymptomRule {
  id: string;
  /** Pregunta que activa la regla. */
  question: string;
  /** Respuesta que la activa (por defecto 'si'). */
  when?: Answer;
  disease: DiseaseCode;
  /** FC de la conclusión: positivo apoya, negativo descarta. */
  cf: number;
  parts?: Part[];
}

export const SYMPTOM_RULES: SymptomRule[] = [
  { id: 'S1', question: 'manchas_redondas', disease: 'mancha_gris', cf: 0.7 },
  { id: 'S2', question: 'lesion_v', disease: 'muerte_descendente', cf: 0.7 },
  { id: 'S3', question: 'secado_puntas', disease: 'muerte_descendente', cf: 0.6 },
  { id: 'S4', question: 'micelio', disease: 'moho_blanco', cf: 0.5 },
  { id: 'S5', question: 'micelio', disease: 'esclerotiniosis', cf: 0.4 },
  // Moho blanco es el signo (micelio); los esclerocios lo identifican como Esclerotiniosis.
  { id: 'S6', question: 'esclerocios', disease: 'esclerotiniosis', cf: 0.8 },
  { id: 'S7', question: 'esclerocios', disease: 'moho_blanco', cf: -0.4 },
  // Informe: fruto blando y húmedo con micelio → Esclerotiniosis; firme y seco → Pudrición dura.
  { id: 'S8', question: 'blando_humedo', disease: 'esclerotiniosis', cf: 0.4 },
  { id: 'S9', question: 'blando_humedo', disease: 'pudricion_dura', cf: -0.5 },
  { id: 'S10', question: 'firme_seco', disease: 'pudricion_dura', cf: 0.7 },
  { id: 'S11', question: 'firme_seco', disease: 'esclerotiniosis', cf: -0.4 },
  { id: 'S12', question: 'aceitosa', disease: 'mancha_grasienta', cf: 0.7 },
  { id: 'S13', question: 'desde_caliz', disease: 'mancha_grasienta', cf: 0.8 },
  { id: 'S14', question: 'flacida_verde', disease: 'marchitez_bacterial', cf: 0.8 },
  { id: 'S15', question: 'cuello', disease: 'esclerotiniosis', cf: 0.5, parts: ['tallos'] },
  // Una respuesta "no" al rasgo clave resta certeza.
  { id: 'S16', question: 'micelio', when: 'no', disease: 'moho_blanco', cf: -0.6 },
  { id: 'S17', question: 'manchas_redondas', when: 'no', disease: 'mancha_gris', cf: -0.4 },
  { id: 'S18', question: 'aceitosa', when: 'no', disease: 'mancha_grasienta', cf: -0.4 },
  { id: 'S19', question: 'flacida_verde', when: 'no', disease: 'marchitez_bacterial', cf: -0.5 },
];

/* ─────────────────────────── Reglas por clima ─────────────────────────── */

export interface Climate {
  /** Temperatura en °C. */
  temperature?: number;
  /** Humedad relativa en %. */
  humidity?: number;
}

export interface ClimateRule {
  id: string;
  disease: DiseaseCode;
  description: string;
  cf: number;
  test: (c: Required<Climate>) => boolean;
}

const FUNGI: DiseaseCode[] = ['mancha_gris', 'muerte_descendente', 'esclerotiniosis', 'moho_blanco', 'pudricion_dura'];

export const CLIMATE_RULES: ClimateRule[] = [
  { id: 'C1', disease: 'mancha_gris', description: 'Temperatura de 15–21 °C y humedad mayor a 80 %', cf: 0.3, test: c => c.temperature >= 15 && c.temperature <= 21 && c.humidity > 80 },
  { id: 'C2', disease: 'muerte_descendente', description: 'Temperatura de 12–18 °C y humedad de 75 % o más', cf: 0.3, test: c => c.temperature >= 12 && c.temperature <= 18 && c.humidity >= 75 },
  { id: 'C3', disease: 'esclerotiniosis', description: 'Temperatura de 16–21 °C y humedad de 90 % o más', cf: 0.35, test: c => c.temperature >= 16 && c.temperature <= 21 && c.humidity >= 90 },
  { id: 'C4', disease: 'moho_blanco', description: 'Temperatura de 15–23 °C y humedad de 90 % o más', cf: 0.3, test: c => c.temperature >= 15 && c.temperature <= 23 && c.humidity >= 90 },
  { id: 'C5', disease: 'pudricion_dura', description: 'Temperatura de 15–28 °C y humedad mayor a 90 %', cf: 0.2, test: c => c.temperature >= 15 && c.temperature <= 28 && c.humidity > 90 },
  { id: 'C6', disease: 'mancha_grasienta', description: 'Temperatura de 20–24 °C y humedad de 70–85 %', cf: 0.3, test: c => c.temperature >= 20 && c.temperature <= 24 && c.humidity >= 70 && c.humidity <= 85 },
  // Informe: SI hay más de 22 °C y marchitez en horas de calor ENTONCES aumentar certeza de Marchitez bacterial.
  { id: 'C7', disease: 'marchitez_bacterial', description: 'Temperatura mayor a 22 °C', cf: 0.4, test: c => c.temperature > 22 },
  { id: 'C8', disease: 'marchitez_bacterial', description: 'Temperatura menor a 18 °C (poco favorable)', cf: -0.3, test: c => c.temperature < 18 },
  ...FUNGI.map((disease, i): ClimateRule => ({
    id: `C${9 + i}`,
    disease,
    description: 'Humedad menor a 60 % (poco favorable para hongos)',
    cf: -0.2,
    test: c => c.humidity < 60,
  })),
];

/** Advertencias de la bibliografía cuando el órgano no coincide con lo descrito. */
export const PART_WARNINGS: Partial<Record<Part, Partial<Record<DiseaseCode, string>>>> = {
  hojas: {
    mancha_grasienta: 'La bibliografía describe la Mancha grasienta en el cáliz, no en hojas. Revisa también los frutos.',
    esclerotiniosis: 'La bibliografía describe la Esclerotiniosis en cuello, tallo y cáliz, no en hojas. Revisa el tallo.',
  },
  tallos: {
    moho_blanco: '"Moho blanco" es un signo (micelio), no una enfermedad: busca esclerocios negros para confirmar Esclerotiniosis.',
  },
};
