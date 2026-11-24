export interface DiseaseInfo {
  code: string;
  name: string;
  is_healthy: boolean;
  severity: 'low' | 'medium' | 'high';
  symptom: string;
}

export interface PartInfo {
  part: 'hojas' | 'tallos' | 'frutos';
  title: string;
  headline: string;
  symbol: string;
  description: string;
  recommendation: string;
  stageIndex: number;
  diseases: DiseaseInfo[];
}

export const PLANT_PARTS: Record<string, PartInfo> = {
  hojas: {
    part: 'hojas',
    title: 'Hojas',
    headline: 'Lee el lenguaje de las hojas.',
    symbol: '❧',
    description: 'La superficie foliar es el primer indicador de estrés hídrico, deficiencias nutricionales y patógenos. El modelo neuronal analiza 8 condiciones botánicas clave.',
    recommendation: 'Observa cambios de pigmentación, bordes quemados o manchas con halo. Mantén registro fotográfico con luz natural difusa.',
    stageIndex: 0,
    diseases: [
      { code: 'hoja_sana', name: 'Hoja sana', is_healthy: true, severity: 'low', symptom: 'Lámina verde uniforme, bordes enteros y turgencia normal.' },
      { code: 'pudricion_dura', name: 'Pudrición dura', is_healthy: false, severity: 'high', symptom: 'Áreas oscuras y consistencia rígida en el limbo foliar.' },
      { code: 'muerte_descendente', name: 'Muerte descendente', is_healthy: false, severity: 'high', symptom: 'Necrosis que avanza desde el ápice hacia el pecíolo.' },
      { code: 'moho_blanco', name: 'Moho blanco', is_healthy: false, severity: 'medium', symptom: 'Pelusa micelial blanquecina en envés y zonas húmedas.' },
      { code: 'marchitez_bacterial', name: 'Marchitez bacterial', is_healthy: false, severity: 'high', symptom: 'Pérdida súbita de turgencia sin clorosis previa.' },
      { code: 'mancha_gris', name: 'Mancha gris', is_healthy: false, severity: 'medium', symptom: 'Lesiones concéntricas grisáceas con halo clorótico.' },
      { code: 'mancha_grasienta', name: 'Mancha grasienta', is_healthy: false, severity: 'medium', symptom: 'Puntos translúcidos con brillo aceitoso característico.' },
      { code: 'esclerotiniosis', name: 'Esclerotiniosis', is_healthy: false, severity: 'high', symptom: 'Lesiones acuosas que colapsan el tejido rápidamente.' },
    ],
  },
  tallos: {
    part: 'tallos',
    title: 'Tallos',
    headline: 'Observa lo que sostiene la vida.',
    symbol: '⌇',
    description: 'El sistema vascular del tallo transporta los nutrientes desde la raíz hasta los cálices. Cualquier lesión compromete el llenado del fruto.',
    recommendation: 'Inspecciona la base del tallo y los nudos de bifurcación donde se acumula humedad. Desinfecta tijeras tras cada poda.',
    stageIndex: 4,
    diseases: [
      { code: 'tallo_sano', name: 'Tallo sano', is_healthy: true, severity: 'low', symptom: 'Corteza verde flexible, sin hendiduras ni exudados.' },
      { code: 'pudricion_dura', name: 'Pudrición dura', is_healthy: false, severity: 'high', symptom: 'Chancros oscuros que estrangulan la circulación del tallo.' },
      { code: 'moho_blanco', name: 'Moho blanco', is_healthy: false, severity: 'medium', symptom: 'Crecimiento algodonoso blanquecino en horquetas y nudos.' },
      { code: 'esclerotiniosis', name: 'Esclerotiniosis', is_healthy: false, severity: 'high', symptom: 'Médula hueca quebradiza con presencia de esclerocios negros.' },
    ],
  },
  frutos: {
    part: 'frutos',
    title: 'Frutos',
    headline: 'Acompaña el desarrollo del fruto.',
    symbol: '◉',
    description: 'La baya de Physalis peruviana requiere un cáliz intacto para madurar con sus antioxidantes y balance agridulce característico.',
    recommendation: 'Revisa tanto el capacho exterior como la baya interna. Cosecha cuando el cáliz adquiera tono pajizo dorado.',
    stageIndex: 3,
    diseases: [
      { code: 'fruto_sano', name: 'Fruto sano', is_healthy: true, severity: 'low', symptom: 'Esfera tersa dorada, aroma frutal y cáliz seco protector.' },
      { code: 'pudricion_dura', name: 'Pudrición dura', is_healthy: false, severity: 'high', symptom: 'Pulpa oscurecida que pierde jugo y se endurece prematuramente.' },
      { code: 'muerte_descendente', name: 'Muerte descendente', is_healthy: false, severity: 'high', symptom: 'Momificación rápida del fruto dentro del capacho.' },
      { code: 'moho_blanco', name: 'Moho blanco', is_healthy: false, severity: 'medium', symptom: 'Micelio blanquecino que descompone la epidermis.' },
      { code: 'mancha_gris', name: 'Mancha gris', is_healthy: false, severity: 'medium', symptom: 'Punteaduras grisáceas que demeritan la calidad comercial.' },
      { code: 'mancha_grasienta', name: 'Mancha grasienta', is_healthy: false, severity: 'medium', symptom: 'Zonas acuosas y reblandecimiento localizado.' },
      { code: 'esclerotiniosis', name: 'Esclerotiniosis', is_healthy: false, severity: 'high', symptom: 'Colapso total del tejido en una masa blanda acuosa.' },
    ],
  },
};
