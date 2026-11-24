import { describe, expect, it } from 'vitest';
import { assessImage, combineCF, diagnose, planQuestions, questionsFor } from './engine';
import { normalizeCode } from './knowledgeBase';

describe('combineCF', () => {
  it('combina evidencias positivas con FC = FC1 + FC2 × (1 − FC1)', () => {
    expect(combineCF(0.56, 0.5)).toBeCloseTo(0.78);
    expect(combineCF(combineCF(0.56, 0.5), 0.45)).toBeCloseTo(0.879, 3);
  });
  it('combina evidencias negativas y mixtas', () => {
    expect(combineCF(-0.4, -0.5)).toBeCloseTo(-0.7);
    expect(combineCF(0.8, -0.4)).toBeCloseTo(0.6667, 3);
  });
  it('se mantiene en [-1, 1]', () => {
    expect(combineCF(0.99, 0.99)).toBeLessThanOrEqual(1);
    expect(combineCF(-0.99, -0.99)).toBeGreaterThanOrEqual(-1);
  });
});

describe('normalizeCode', () => {
  it('unifica las etiquetas irregulares de Teachable Machine', () => {
    expect(normalizeCode('dura')).toBe('pudricion_dura');
    expect(normalizeCode('blanco')).toBe('moho_blanco');
    expect(normalizeCode('escleroteniosis')).toBe('esclerotiniosis');
    expect(normalizeCode('fruto_sano')).toBe('sano');
    expect(normalizeCode('mancha_gris')).toBe('mancha_gris');
  });
});

describe('reglas de control', () => {
  it('pide otra foto si la confianza es baja', () => {
    expect(assessImage([{ code: 'mancha_gris', confidence: 0.4 }, { code: 'hoja_sana', confidence: 0.35 }]).verdict).toBe('retake');
  });
  it('acepta el órgano sano', () => {
    expect(assessImage([{ code: 'sano', confidence: 0.9 }]).verdict).toBe('healthy');
  });
  it('pasa a preguntas si el modelo ve una enfermedad', () => {
    expect(assessImage([{ code: 'moho_blanco', confidence: 0.7 }, { code: 'fruto_sano', confidence: 0.2 }]).verdict).toBe('sick');
  });
});

describe('diagnose', () => {
  it('fruto blando y húmedo con micelio → Esclerotiniosis', () => {
    const d = diagnose('frutos', [{ code: 'moho_blanco', confidence: 0.7 }, { code: 'escleroteniosis', confidence: 0.2 }],
      { micelio: 'si', blando_humedo: 'si', esclerocios: 'si' }, { temperature: 18, humidity: 95 });
    expect(d.best?.code).toBe('esclerotiniosis');
    expect(d.level).toBe('probable');
  });

  it('fruto firme y seco → Pudrición dura aunque el modelo diga otra cosa', () => {
    const d = diagnose('frutos', [{ code: 'esclerotiniosis', confidence: 0.8 }], { firme_seco: 'si', blando_humedo: 'no', micelio: 'no' });
    expect(d.best?.code).toBe('pudricion_dura');
  });

  it('hojas flácidas y calor → Marchitez bacterial', () => {
    const d = diagnose('hojas', [{ code: 'mancha_gris', confidence: 0.6 }], { flacida_verde: 'si' }, { temperature: 27, humidity: 90 });
    expect(d.best?.code).toBe('marchitez_bacterial');
  });

  it('los esclerocios restan certeza a Moho blanco', () => {
    const d = diagnose('tallos', [{ code: 'blanco', confidence: 0.9 }], { micelio: 'si', esclerocios: 'si' });
    const moho = d.ranking.find(r => r.code === 'moho_blanco')!;
    const escl = d.ranking.find(r => r.code === 'esclerotiniosis')!;
    expect(escl.cf).toBeGreaterThan(moho.cf);
  });

  it('sin síntomas ni clima el resultado es indeterminado', () => {
    const d = diagnose('hojas', [{ code: 'mancha_gris', confidence: 0.7 }], {});
    expect(d.level).toBe('indeterminado');
    expect(d.best).toBeNull();
  });

  it('cada órgano solo pregunta lo que aplica', () => {
    expect(questionsFor('tallos').map(q => q.id)).not.toContain('desde_caliz');
    expect(questionsFor('frutos').map(q => q.id)).toContain('desde_caliz');
  });

  it('advierte cuando la bibliografía no describe la enfermedad en ese órgano', () => {
    const d = diagnose('hojas', [{ code: 'mancha_grasienta', confidence: 0.8 }], { aceitosa: 'si' });
    expect(d.best?.code).toBe('mancha_grasienta');
    expect(d.best?.warning).toMatch(/cáliz/);
  });
});

describe('planQuestions', () => {
  it('hace pocas preguntas, solo las que separan a los candidatos del modelo', () => {
    const plan = planQuestions('frutos', [{ code: 'moho_blanco', confidence: 0.62 }, { code: 'escleroteniosis', confidence: 0.21 }, { code: 'fruto_sano', confidence: 0.1 }]);
    const ids = plan.questions.map(q => q.id);
    expect(ids.length).toBeLessThanOrEqual(4);
    expect(ids).toContain('esclerocios');
    expect(ids).toContain('micelio');
    expect(ids).not.toContain('desde_caliz');
    expect(plan.candidates[0]).toBe('moho_blanco');
  });

  it('agrega la enfermedad que el modelo suele confundir', () => {
    const plan = planQuestions('hojas', [{ code: 'muerte_descendente', confidence: 0.9 }]);
    expect(plan.candidates).toContain('mancha_gris');
    const ids = plan.questions.map(q => q.id);
    expect(ids).toContain('lesion_v');
    expect(ids).toContain('manchas_redondas');
  });

  it('las demás preguntas quedan disponibles aparte', () => {
    const plan = planQuestions('hojas', [{ code: 'mancha_gris', confidence: 0.98 }]);
    expect(plan.questions.length + plan.extra.length).toBe(questionsFor('hojas').length);
  });
});
